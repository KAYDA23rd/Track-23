// Mechanic workshop console.
// Manages active faults, repair records, parts usage,
// and return-to-service readiness by bus.
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";
import "../styles/mechanic.css";
import { clearSession } from "../utils/authSession";

const emptyWorkshopForm = {
  diagnosis: "",
  repairNotes: "",
  partsUsed: "",
  assignedMechanicName: "",
  workshopPriority: "",
  brakeChecked: false,
  engineChecked: false,
  tireChecked: false,
  electricalChecked: false,
  roadTestPassed: false,
};

export default function MechanicApp() {
  const [tickets, setTickets] = useState([]);
  const [filter, setFilter] = useState("open");
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState({});
  const [selectedBusId, setSelectedBusId] = useState("all");
  const navigate = useNavigate();

  const loadTickets = async () => {
    try {
      const res = await api.get("/maintenance");
      setTickets(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const ticketCounts = useMemo(
    () => ({
      open: tickets.filter((ticket) => ticket.status === "OPEN").length,
      enroute: tickets.filter((ticket) => ticket.status === "ENROUTE").length,
      resolved: tickets.filter((ticket) => ticket.status === "RESOLVED").length,
    }),
    [tickets],
  );

  const busHistory = useMemo(() => {
    const grouped = new Map();

    tickets.forEach((ticket) => {
      const key = ticket.busId;
      if (!grouped.has(key)) {
        grouped.set(key, {
          busId: ticket.busId,
          plateNumber: ticket.bus?.plateNumber || "Bus",
          model: ticket.bus?.model || "-",
          routeName: ticket.bus?.route?.name || "No route",
          tickets: [],
        });
      }

      grouped.get(key).tickets.push(ticket);
    });

    return Array.from(grouped.values());
  }, [tickets]);

  const visibleTickets = useMemo(() => {
    let base = tickets;

    if (filter === "active") base = tickets.filter((ticket) => ticket.status !== "RESOLVED");
    else if (filter !== "all") base = tickets.filter((ticket) => ticket.status === filter.toUpperCase());

    if (selectedBusId !== "all") {
      base = base.filter((ticket) => ticket.busId === selectedBusId);
    }

    return base;
  }, [filter, selectedBusId, tickets]);

  const updateTicketStatus = async (id, status) => {
    const draft = drafts[id] || emptyWorkshopForm;

    if (status === "RESOLVED") {
      await api.put(`/maintenance/${id}/resolve`, draft);
    } else {
      await api.put(`/maintenance/${id}/status`, { status });
    }
    await loadTickets();
  };

  const saveTicketDetails = async (id) => {
    const draft = drafts[id] || emptyWorkshopForm;
    await api.put(`/maintenance/${id}/details`, draft);
    await loadTickets();
  };

  const setDraftField = (id, key, value) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || emptyWorkshopForm),
        [key]: value,
      },
    }));
  };

  const getTicketDraft = (ticket) => ({
    ...emptyWorkshopForm,
    diagnosis: ticket.diagnosis || "",
    repairNotes: ticket.repairNotes || "",
    partsUsed: ticket.partsUsed || "",
    assignedMechanicName: ticket.assignedMechanicName || "",
    workshopPriority: ticket.workshopPriority?.toString() || "",
    brakeChecked: Boolean(ticket.brakeChecked),
    engineChecked: Boolean(ticket.engineChecked),
    tireChecked: Boolean(ticket.tireChecked),
    electricalChecked: Boolean(ticket.electricalChecked),
    roadTestPassed: Boolean(ticket.roadTestPassed),
    ...(drafts[ticket.id] || {}),
  });

  const logout = () => {
    clearSession();
    navigate("/mechanic/login");
  };

  return (
    <div className="mechanic-shell">
      <div className="mechanic-app">
        <header className="mechanic-topbar">
          <div>
            <Link className="mechanic-login-kicker" to="/">
              Track23 Mechanic
            </Link>
            <h1>Workshop Console</h1>
            <p>Manage faults, capture workshop data, and release buses back into safe service.</p>
          </div>

          <div className="mechanic-top-actions">
            <span className="mechanic-status">Workshop Live</span>
            <button className="mechanic-btn mechanic-btn-ghost" onClick={logout} type="button">
              Log out
            </button>
          </div>
        </header>

        <section className="mechanic-summary-grid">
          <article className="mechanic-card">
            <span>Open Faults</span>
            <strong>{ticketCounts.open}</strong>
          </article>
          <article className="mechanic-card">
            <span>Under Repair</span>
            <strong>{ticketCounts.enroute}</strong>
          </article>
          <article className="mechanic-card">
            <span>Resolved</span>
            <strong>{ticketCounts.resolved}</strong>
          </article>
        </section>

        <section className="mechanic-card">
          <div className="mechanic-board-head">
            <div>
              <h2>Maintenance Board</h2>
              <p>Open jobs by bus, route, diagnosis, and workshop release state.</p>
            </div>

            <div className="mechanic-board-controls">
              <div className="mechanic-filter-row">
                <button className={`mechanic-filter ${filter === "open" ? "is-active" : ""}`} onClick={() => setFilter("open")} type="button">
                  Open
                </button>
                <button className={`mechanic-filter ${filter === "enroute" ? "is-active" : ""}`} onClick={() => setFilter("enroute")} type="button">
                  Under Repair
                </button>
                <button className={`mechanic-filter ${filter === "resolved" ? "is-active" : ""}`} onClick={() => setFilter("resolved")} type="button">
                  Resolved
                </button>
                <button className={`mechanic-filter ${filter === "active" ? "is-active" : ""}`} onClick={() => setFilter("active")} type="button">
                  Active
                </button>
                <button className={`mechanic-filter ${filter === "all" ? "is-active" : ""}`} onClick={() => setFilter("all")} type="button">
                  All
                </button>
              </div>

              <select
                className="mechanic-select"
                onChange={(e) => setSelectedBusId(e.target.value)}
                value={selectedBusId}
              >
                <option value="all">All buses</option>
                {busHistory.map((bus) => (
                  <option key={bus.busId} value={bus.busId}>
                    {bus.plateNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mechanic-ticket-grid">
            {visibleTickets.map((ticket) => {
              const draft = getTicketDraft(ticket);

              return (
                <article className="mechanic-ticket-card" key={ticket.id}>
                  <div className="mechanic-ticket-head">
                    <div>
                      <h3>{ticket.bus?.plateNumber || "Bus"}</h3>
                      <p>{ticket.bus?.route?.name || "No route assigned"}</p>
                    </div>
                    <span className={`mechanic-badge mechanic-badge-${ticket.status.toLowerCase()}`}>
                      {ticket.status}
                    </span>
                  </div>

                  <p className="mechanic-ticket-issue">{ticket.issue}</p>

                  <div className="mechanic-ticket-meta">
                    <span>Reported: {new Date(ticket.createdAt).toLocaleString()}</span>
                    <span>Model: {ticket.bus?.model || "-"}</span>
                    <span>Priority: {ticket.workshopPriority ?? "-"}</span>
                  </div>

                  <div className="mechanic-form-grid">
                    <input
                      className="mechanic-input"
                      onChange={(e) => setDraftField(ticket.id, "assignedMechanicName", e.target.value)}
                      placeholder="Assigned mechanic"
                      value={draft.assignedMechanicName}
                    />
                    <input
                      className="mechanic-input"
                      min="1"
                      onChange={(e) => setDraftField(ticket.id, "workshopPriority", e.target.value)}
                      placeholder="Priority (1-5)"
                      type="number"
                      value={draft.workshopPriority}
                    />
                    <textarea
                      className="mechanic-input mechanic-textarea"
                      onChange={(e) => setDraftField(ticket.id, "diagnosis", e.target.value)}
                      placeholder="Diagnosis"
                      value={draft.diagnosis}
                    />
                    <textarea
                      className="mechanic-input mechanic-textarea"
                      onChange={(e) => setDraftField(ticket.id, "repairNotes", e.target.value)}
                      placeholder="Repair notes"
                      value={draft.repairNotes}
                    />
                    <textarea
                      className="mechanic-input mechanic-textarea"
                      onChange={(e) => setDraftField(ticket.id, "partsUsed", e.target.value)}
                      placeholder="Parts used"
                      value={draft.partsUsed}
                    />
                  </div>

                  <div className="mechanic-checklist">
                    {[
                      ["brakeChecked", "Brakes"],
                      ["engineChecked", "Engine"],
                      ["tireChecked", "Tires"],
                      ["electricalChecked", "Electrical"],
                      ["roadTestPassed", "Road test"],
                    ].map(([key, label]) => (
                      <label className="mechanic-checkitem" key={key}>
                        <input
                          checked={Boolean(draft[key])}
                          onChange={(e) => setDraftField(ticket.id, key, e.target.checked)}
                          type="checkbox"
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>

                  <div className="mechanic-ticket-actions">
                    <button className="mechanic-btn mechanic-btn-ghost" onClick={() => saveTicketDetails(ticket.id)} type="button">
                      Save Record
                    </button>

                    {ticket.status === "OPEN" ? (
                      <button className="mechanic-btn mechanic-btn-primary" onClick={() => updateTicketStatus(ticket.id, "ENROUTE")} type="button">
                        Take Job
                      </button>
                    ) : null}

                    {ticket.status === "ENROUTE" ? (
                      <button className="mechanic-btn mechanic-btn-primary" onClick={() => updateTicketStatus(ticket.id, "RESOLVED")} type="button">
                        Return To Service
                      </button>
                    ) : null}

                    {ticket.status === "RESOLVED" ? (
                      <button className="mechanic-btn mechanic-btn-ghost" disabled type="button">
                        Closed
                      </button>
                    ) : null}
                  </div>
                </article>
              );
            })}

            {!loading && visibleTickets.length === 0 ? (
              <p className="mechanic-empty">No tickets in this queue.</p>
            ) : null}
          </div>
        </section>

        <section className="mechanic-card">
          <div className="mechanic-board-head">
            <div>
              <h2>Repair History By Bus</h2>
              <p>Every bus keeps a workshop trail for diagnosis, parts, and return-to-service checks.</p>
            </div>
          </div>

          <div className="mechanic-history-grid">
            {busHistory.map((bus) => (
              <article className="mechanic-history-card" key={bus.busId}>
                <div className="mechanic-history-head">
                  <div>
                    <h3>{bus.plateNumber}</h3>
                    <p>
                      {bus.model} · {bus.routeName}
                    </p>
                  </div>
                  <span className="mechanic-badge mechanic-badge-enroute">
                    {bus.tickets.length} records
                  </span>
                </div>

                <div className="mechanic-history-list">
                  {bus.tickets.map((ticket) => (
                    <div className="mechanic-history-item" key={ticket.id}>
                      <strong>{ticket.issue}</strong>
                      <span>{ticket.status}</span>
                      <p>{ticket.diagnosis || "No diagnosis yet"}</p>
                      <small>
                        Parts: {ticket.partsUsed || "None logged"} · Returned:{" "}
                        {ticket.returnedToServiceAt
                          ? new Date(ticket.returnedToServiceAt).toLocaleDateString()
                          : "Pending"}
                      </small>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

