// Driver operating console.
// Combines live tracking, shift compliance, trip capture,
// remittance submission, and issue reporting in one app.
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/api";
import DriverNavigationMap from "./DriverNavigationMap";
import "../styles/driver.css";
import { clearSession, getDriverName, getDriverPhone } from "../utils/authSession";

const formatMoney = (value) => `NGN ${Number(value || 0).toLocaleString()}`;

/**
 * DriverApp
 * Driver-side operating console for live tracking, shift compliance,
 * trip performance capture, remittance submission, and issue reporting.
 */
export default function DriverApp() {
  const geolocationSupported = typeof navigator !== "undefined" && "geolocation" in navigator;
  const [driver, setDriver] = useState(null);
  const [allShifts, setAllShifts] = useState([]);
  const [allRemittances, setAllRemittances] = useState([]);
  const [allTickets, setAllTickets] = useState([]);
  const [expectedAmount, setExpectedAmount] = useState(25000);
  const [trackingStatus, setTrackingStatus] = useState("Waiting for location permission...");
  const [currentPosition, setCurrentPosition] = useState(null);
  const [currentSpeedKph, setCurrentSpeedKph] = useState(null);
  const [currentAccuracyM, setCurrentAccuracyM] = useState(null);
  const [lastLocationSyncAt, setLastLocationSyncAt] = useState(null);

  const [activeTab, setActiveTab] = useState("shift");
  const [remittanceForm, setRemittanceForm] = useState({
    reportedAmount: "",
    varianceReason: "",
  });
  const [issueForm, setIssueForm] = useState({ issue: "" });
  const [performanceForm, setPerformanceForm] = useState({
    completedTrips: "",
    completedLoops: "",
    passengerCount: "",
    tripPerformanceNotes: "",
  });

  const navigate = useNavigate();
  const watchIdRef = useRef(null);
  const lastSentAtRef = useRef(0);

  const loadData = async () => {
    const phone = getDriverPhone();

    // Load all driver-facing operational data together so the app reflects one
    // coherent shift/remittance state after every action.
    const [driversRes, shiftsRes, remRes, ticketsRes, expectedRes] = await Promise.all([
      api.get("/drivers"),
      api.get("/shifts"),
      api.get("/remittances"),
      api.get("/maintenance"),
      api.get("/remittances/expected-amount"),
    ]);

    const matchedDriver = driversRes.data.find((item) => item.phone === phone) || null;

    setDriver(matchedDriver);
    setAllShifts(shiftsRes.data);
    setAllRemittances(remRes.data);
    setAllTickets(ticketsRes.data);
    setExpectedAmount(expectedRes.data.expectedAmount);
  };

  useEffect(() => {
    const init = async () => {
      const phone = getDriverPhone();

      const [driversRes, shiftsRes, remRes, ticketsRes, expectedRes] = await Promise.all([
        api.get("/drivers"),
        api.get("/shifts"),
        api.get("/remittances"),
        api.get("/maintenance"),
        api.get("/remittances/expected-amount"),
      ]);

      const matchedDriver = driversRes.data.find((item) => item.phone === phone) || null;

      setDriver(matchedDriver);
      setAllShifts(shiftsRes.data);
      setAllRemittances(remRes.data);
      setAllTickets(ticketsRes.data);
      setExpectedAmount(expectedRes.data.expectedAmount);
    };

    init();
  }, []);

  const driverShifts = useMemo(() => {
    if (!driver) return [];
    return allShifts.filter((shift) => shift.driverId === driver.id);
  }, [allShifts, driver]);

  const todayShift = useMemo(() => {
    const today = new Date().toDateString();
    return (
      driverShifts.find((shift) => new Date(shift.startTime).toDateString() === today) ||
      driverShifts[0] ||
      null
    );
  }, [driverShifts]);

  const assignedBusId = todayShift?.busId || "";

  const driverRemittances = useMemo(() => {
    if (!driver) return [];
    return allRemittances
      .filter((item) => item.driverId === driver.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [allRemittances, driver]);

  const driverTickets = useMemo(() => {
    if (!driver) return [];
    const busIds = new Set(driverShifts.map((shift) => shift.busId));
    return allTickets
      .filter((ticket) => busIds.has(ticket.busId))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [allTickets, driver, driverShifts]);

  const todayCollection = useMemo(() => {
    const today = new Date().toDateString();
    return driverRemittances
      .filter((item) => new Date(item.date).toDateString() === today)
      .reduce((sum, item) => sum + item.reportedAmount, 0);
  }, [driverRemittances]);

  const todayTrips = useMemo(() => {
    const today = new Date().toDateString();
    return driverShifts.filter((shift) => new Date(shift.startTime).toDateString() === today).length;
  }, [driverShifts]);

  // Driver actions are intentionally gated by shift lifecycle so the mobile app
  // cannot bypass dispatch controls set by admin.
  const canReportIssue = ["HANDED_OVER", "ON_ROUTE", "COMPLETED", "CLOSED"].includes(todayShift?.status || "");
  const canSubmitRemittance = todayShift?.status === "COMPLETED";
  const canUpdatePerformance = ["HANDED_OVER", "ON_ROUTE", "COMPLETED"].includes(todayShift?.status || "");

  useEffect(() => {
    const nextPerformanceForm = !todayShift
      ? {
          completedTrips: "",
          completedLoops: "",
          passengerCount: "",
          tripPerformanceNotes: "",
        }
      : {
          completedTrips: todayShift.completedTrips?.toString() || "",
          completedLoops: todayShift.completedLoops?.toString() || "",
          passengerCount: todayShift.passengerCount?.toString() || "",
          tripPerformanceNotes: todayShift.tripPerformanceNotes || "",
        };

    const syncId = window.setTimeout(() => {
      setPerformanceForm(nextPerformanceForm);
    }, 0);

    return () => window.clearTimeout(syncId);
  }, [todayShift]);

  const submitRemittance = async (e) => {
    e.preventDefault();

    if (!driver) {
      alert("Driver profile not found. Ensure driver phone matches login phone.");
      return;
    }

    if (!assignedBusId) {
      alert("No bus assigned by admin yet. Contact admin before submitting remittance.");
      return;
    }

    if (!canSubmitRemittance) {
      alert("Shift must be completed before remittance can be submitted.");
      return;
    }

    await api.post("/remittances", {
      busId: assignedBusId,
      driverId: driver.id,
      reportedAmount: Number(remittanceForm.reportedAmount),
      varianceReason: remittanceForm.varianceReason,
    });

    setRemittanceForm({ reportedAmount: "", varianceReason: "" });
    loadData();
  };

  const submitIssue = async (e) => {
    e.preventDefault();

    if (!assignedBusId) {
      alert("No bus assigned by admin yet. Contact admin before reporting issue.");
      return;
    }

    if (!canReportIssue) {
      alert("Bus handover must be confirmed before issue reporting can begin.");
      return;
    }

    // Fault tickets immediately feed the maintenance workflow, which can
    // deactivate the bus and block future dispatch.
    await api.post("/maintenance", {
      busId: assignedBusId,
      issue: issueForm.issue,
    });

    setIssueForm({ issue: "" });
    loadData();
  };

  const submitPerformance = async (e) => {
    e.preventDefault();

    if (!todayShift) {
      alert("No active shift found.");
      return;
    }

    if (!canUpdatePerformance) {
      alert("Trip performance can only be updated after handover and before final closure.");
      return;
    }

    await api.put(`/shifts/${todayShift.id}/performance`, {
      completedTrips: Number(performanceForm.completedTrips || 0),
      completedLoops: Number(performanceForm.completedLoops || 0),
      passengerCount: Number(performanceForm.passengerCount || 0),
      tripPerformanceNotes: performanceForm.tripPerformanceNotes,
    });

    await loadData();
  };

  useEffect(() => {
    if (!geolocationSupported) {
      return undefined;
    }

    // Tracking starts automatically on login and stays on. We only throttle the
    // network sync interval so the device is not spamming the backend.
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const speedMps = position.coords.speed;
        const speedKph = speedMps == null ? null : speedMps * 3.6;
        const heading = position.coords.heading;
        const accuracyM = position.coords.accuracy;

        setCurrentPosition([lat, lng]);
        setCurrentSpeedKph(speedKph);
        setCurrentAccuracyM(accuracyM);
        setTrackingStatus("Live tracking active");

        const now = Date.now();
        if (now - lastSentAtRef.current < 10000) return;

        lastSentAtRef.current = now;

        try {
          await api.post("/tracking/location", {
            lat,
            lng,
            speedKph,
            heading,
            accuracyM,
          });
          setLastLocationSyncAt(new Date());
        } catch {
          setTrackingStatus("Unable to sync location to server");
        }
      },
      () => {
        setTrackingStatus("Location permission denied or GPS unavailable");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      },
    );

    // Stop the browser watch cleanly when the app unmounts so we do not leave
    // orphaned geolocation watchers running.
    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [assignedBusId, geolocationSupported]);

  const logout = () => {
    clearSession();
    navigate("/driver/login");
  };

  return (
    <div className="driver-shell">
      <div className="driver-app">
        <header className="driver-topbar">
          <div>
            <Link className="driver-top-kicker" to="/">
              Track23 Driver
            </Link>
            <h1>{getDriverName() || "Driver Console"}</h1>
            <p>{driver ? driver.phone : "Driver profile lookup in progress"}</p>
          </div>

          <div className="driver-top-actions">
            <span className="driver-status">Active</span>
            <button className="driver-btn driver-btn-ghost" onClick={logout} type="button">
              Log out
            </button>
          </div>
        </header>

        <section className="driver-main-grid">
          <article className="driver-card driver-card-shift">
            <div className="driver-card-head">
              <h2>Today&apos;s Shift</h2>
              <span>{new Date().toLocaleDateString()}</span>
            </div>

            {todayShift ? (
              <div className="driver-shift-info">
                <p>
                  <strong>Bus:</strong> {todayShift.bus?.plateNumber || "-"}
                </p>
                <p>
                  <strong>Route:</strong> {todayShift.bus?.route?.name || "-"}
                </p>
                <p>
                  <strong>Status:</strong> {todayShift.status}
                </p>
                <p>
                  <strong>Handover:</strong> {todayShift.confirmed ? "Confirmed" : "Pending admin confirmation"}
                </p>
                <p>
                  <strong>Start:</strong> {new Date(todayShift.startTime).toLocaleString()}
                </p>
                <p>
                  <strong>End:</strong> {new Date(todayShift.endTime).toLocaleString()}
                </p>
                <p>
                  <strong>Compliance:</strong>{" "}
                  {todayShift.status === "ASSIGNED"
                    ? "Awaiting admin handover"
                    : todayShift.status === "HANDED_OVER"
                      ? "Vehicle issued, waiting to move on route"
                      : todayShift.status === "ON_ROUTE"
                        ? "Live on corridor"
                        : todayShift.status === "COMPLETED"
                          ? "Ready for remittance"
                          : "Shift closed"}
                </p>
              </div>
            ) : (
              <p className="driver-muted">No shift scheduled yet.</p>
            )}
          </article>

          <article className="driver-card">
            <h3>Today&apos;s Stats</h3>
              <div className="driver-stats-grid">
                <div>
                  <strong>{todayTrips}</strong>
                  <span>Shifts</span>
                </div>
                <div>
                  <strong>{todayShift?.completedTrips || 0}</strong>
                  <span>Trips</span>
                </div>
                <div>
                  <strong>{todayShift?.passengerCount || 0}</strong>
                  <span>Passengers</span>
                </div>
                <div>
                  <strong>{formatMoney(todayCollection)}</strong>
                  <span>Collection</span>
                </div>
              </div>
            </article>
        </section>

        <section className="driver-tabs">
          <button
            className={`driver-tab ${activeTab === "shift" ? "is-active" : ""}`}
            onClick={() => setActiveTab("shift")}
            type="button"
          >
            Shift
          </button>
          <button
            className={`driver-tab ${activeTab === "history" ? "is-active" : ""}`}
            onClick={() => setActiveTab("history")}
            type="button"
          >
            History
          </button>
          <button
            className={`driver-tab ${activeTab === "vehicle" ? "is-active" : ""}`}
            onClick={() => setActiveTab("vehicle")}
            type="button"
          >
            Vehicle
          </button>
        </section>

        {activeTab === "shift" && (
          <section className="driver-actions-grid">
            <DriverNavigationMap
              className="driver-map-focus"
              currentPosition={currentPosition}
              defaultHeight="460px"
              currentSpeedKph={currentSpeedKph}
              currentAccuracyM={currentAccuracyM}
              lastLocationSyncAt={lastLocationSyncAt}
              trackingStatus={trackingStatus}
              assignedBusLabel={todayShift?.bus?.plateNumber || "Not assigned"}
            />

            <article className="driver-card">
              <h3>Live Monitoring</h3>
              <p className="driver-muted">
                {geolocationSupported ? trackingStatus : "Geolocation unavailable on this device"}
              </p>
              <p className="driver-muted">
                Last sync: {lastLocationSyncAt ? lastLocationSyncAt.toLocaleTimeString() : "Not synced yet"}
              </p>
              <p className="driver-muted">Tracking is mandatory while logged in.</p>
              <p className="driver-muted">
                Shift access: {todayShift ? todayShift.status : "No active assignment"}
              </p>
            </article>

            <article className="driver-card">
              <h3>Trip Performance</h3>
              <form className="driver-form" onSubmit={submitPerformance}>
                <input
                  className="driver-input"
                  min="0"
                  onChange={(e) => setPerformanceForm((prev) => ({ ...prev, completedTrips: e.target.value }))}
                  placeholder="Completed trips"
                  type="number"
                  value={performanceForm.completedTrips}
                />

                <input
                  className="driver-input"
                  min="0"
                  onChange={(e) => setPerformanceForm((prev) => ({ ...prev, completedLoops: e.target.value }))}
                  placeholder="Completed loops"
                  type="number"
                  value={performanceForm.completedLoops}
                />

                <input
                  className="driver-input"
                  min="0"
                  onChange={(e) => setPerformanceForm((prev) => ({ ...prev, passengerCount: e.target.value }))}
                  placeholder="Passenger count"
                  type="number"
                  value={performanceForm.passengerCount}
                />

                <textarea
                  className="driver-input driver-textarea"
                  onChange={(e) =>
                    setPerformanceForm((prev) => ({ ...prev, tripPerformanceNotes: e.target.value }))
                  }
                  placeholder="Trip notes, congestion issues, turnaround observations"
                  value={performanceForm.tripPerformanceNotes}
                />

                <button className="driver-btn driver-btn-primary" disabled={!canUpdatePerformance} type="submit">
                  Save Performance
                </button>
              </form>
              <p className="driver-muted">
                Avg passengers per trip:{" "}
                {todayShift?.completedTrips > 0
                  ? (todayShift.passengerCount / todayShift.completedTrips).toFixed(1)
                  : "0.0"}
              </p>
            </article>

            <article className="driver-card">
              <h3>Submit Remittance</h3>
              <form className="driver-form" onSubmit={submitRemittance}>
                <input
                  className="driver-input"
                  readOnly
                  type="text"
                  value={todayShift?.bus?.plateNumber || "No bus assigned by admin"}
                />

                <input
                  className="driver-input"
                  min="0"
                  value={expectedAmount}
                  placeholder="Expected amount"
                  readOnly
                  type="number"
                />

                <input
                  className="driver-input"
                  min="0"
                  onChange={(e) =>
                    setRemittanceForm({ ...remittanceForm, reportedAmount: e.target.value })
                  }
                  placeholder="Reported amount"
                  required
                  type="number"
                  value={remittanceForm.reportedAmount}
                />

                <input
                  className="driver-input"
                  onChange={(e) => setRemittanceForm({ ...remittanceForm, varianceReason: e.target.value })}
                  placeholder="Variance reason if amount differs"
                  value={remittanceForm.varianceReason || ""}
                />

                <button className="driver-btn driver-btn-primary" disabled={!canSubmitRemittance} type="submit">
                  Submit
                </button>
              </form>
              {!canSubmitRemittance ? (
                <p className="driver-muted">Admin must mark the shift completed before remittance submission.</p>
              ) : null}
            </article>

            <article className="driver-card">
              <h3>Report Issue</h3>
              <form className="driver-form" onSubmit={submitIssue}>
                <input
                  className="driver-input"
                  readOnly
                  type="text"
                  value={todayShift?.bus?.plateNumber || "No bus assigned by admin"}
                />

                <textarea
                  className="driver-input driver-textarea"
                  onChange={(e) => setIssueForm({ ...issueForm, issue: e.target.value })}
                  placeholder="Describe the issue"
                  required
                  value={issueForm.issue}
                />

                <button className="driver-btn driver-btn-primary" disabled={!canReportIssue} type="submit">
                  Report Issue
                </button>
              </form>
              {!canReportIssue ? (
                <p className="driver-muted">Issue reporting opens after handover confirmation.</p>
              ) : null}
            </article>
          </section>
        )}

        {activeTab === "history" && (
          <section className="driver-card">
            <h3>Remittance History</h3>
            <div className="driver-list">
              {driverRemittances.map((item) => (
                <div className="driver-list-item" key={item.id}>
                  <div>
                    <strong>{new Date(item.date).toLocaleDateString()}</strong>
                    <p>{item.bus?.plateNumber || "Bus"}</p>
                  </div>
                  <div>
                    <span>{formatMoney(item.reportedAmount)}</span>
                    <p>{item.approved ? "Approved" : "Pending approval"}</p>
                  </div>
                </div>
              ))}
              {driverRemittances.length === 0 && <p className="driver-muted">No remittance records yet.</p>}
            </div>
          </section>
        )}

        {activeTab === "vehicle" && (
          <section className="driver-card">
            <h3>Vehicle and Issues</h3>
            <div className="driver-list">
              <div className="driver-list-item">
                <div>
                  <strong>{todayShift?.bus?.plateNumber || "No assigned bus"}</strong>
                  <p>{todayShift?.bus?.model || "-"}</p>
                </div>
                <div>
                  <span>{todayShift?.bus?.status || "-"}</span>
                  <p>Current status</p>
                </div>
              </div>

              {driverTickets.map((ticket) => (
                <div className="driver-list-item" key={ticket.id}>
                  <div>
                    <strong>{ticket.bus?.plateNumber || "Bus"}</strong>
                    <p>{ticket.issue}</p>
                  </div>
                  <div>
                    <span>{ticket.status}</span>
                    <p>{new Date(ticket.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}

              {driverTickets.length === 0 && <p className="driver-muted">No maintenance tickets reported.</p>}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

