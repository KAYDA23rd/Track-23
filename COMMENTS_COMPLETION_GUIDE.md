# Track23 Code Comments - Completion Guide

## Current State

This guide has been updated to match the product as of **April 1, 2026**.

The codebase now includes:

- admin console
- driver app
- mechanic app
- supervisor app
- general staff approvals
- alert center
- live driver tracking
- remittance reconciliation
- trip performance tracking
- maintenance and workshop workflows

Because the product surface has expanded, the old comment checklist is no longer accurate.

---

## What Is Already Well Covered

These files already have meaningful top-level or route-level documentation and do not need urgent comment work:

### Backend

- `backend/src/server.js`
- `backend/src/app.js`
- `backend/src/auth/auth.routes.js`
- `backend/src/auth/auth.middleware.js`
- `backend/src/auth/auth.controller.js`
- `backend/src/tracking/tracking.routes.js`
- `backend/src/reports/report.routes.js`
- `backend/src/shifts/shift.routes.js`
- `backend/src/remittances/remittance.routes.js`
- `backend/src/maintenance/maintenance.routes.js`
- `backend/src/utils/jwt.js`

### Frontend

- `frontend/src/main.jsx`
- `frontend/src/App.jsx`
- `frontend/src/api/api.js`
- `frontend/src/auth/ProtectedRoute.jsx`
- `frontend/src/layout/MainLayout.jsx`

These are not necessarily “perfectly commented,” but they are not the main problem anymore.

---

## Highest-Value Files Still Worth Commenting

These files now contain the most business logic and would benefit most from structured comments.

### Backend Controllers

- `backend/src/shifts/shift.controller.js`
  - dispatch lifecycle
  - bus issuance
  - handover confirmation
  - shift close-out
  - trip performance capture

- `backend/src/remittances/remittance.controller.js`
  - expected amount enforcement
  - variance logic
  - reconciliation workflow
  - approval and escalation flow

- `backend/src/reports/report.controller.js`
  - operations snapshot
  - alert-center aggregation
  - route performance calculations
  - trip metrics rollups

- `backend/src/maintenance/maintenance.controller.js`
  - fault intake
  - bus deactivation rules
  - workshop record updates
  - return-to-service logic

- `backend/src/tracking/tracking.controller.js`
  - assigned-bus resolution
  - live location upsert
  - active tracking feed

- `backend/src/buses/bus.controller.js`
  - status transition safeguards
  - maintenance lock behavior

- `backend/src/routes/route.controller.js`
  - route planning data
  - corridor planning parameters

### Frontend Operational Screens

- `frontend/src/dashboard/Dashboard.jsx`
  - operations console rendering
  - control-room summaries
  - route performance sections

- `frontend/src/shifts/ShiftsPage.jsx`
  - dispatch lifecycle actions
  - bus issuance workflow
  - trip performance updates

- `frontend/src/remittances/RemittancesPage.jsx`
  - review and reconciliation flow
  - expected amount controls

- `frontend/src/driver/DriverApp.jsx`
  - mandatory tracking
  - shift-state gating
  - remittance and issue submission
  - trip performance capture

- `frontend/src/mechanic/MechanicApp.jsx`
  - workshop board
  - repair details
  - checklist and return-to-service workflow

- `frontend/src/supervisor/SupervisorApp.jsx`
  - alert-center filtering
  - live operations view
  - corridor watchlist

- `frontend/src/staff/StaffPage.jsx`
  - staff approval and activation logic

- `frontend/src/landing/LandingPage.jsx`
  - role-aware portal entry logic

---

## New Files Added Since The Old Guide

The old guide did not account for these files. They should now be part of the comment plan.

### New Frontend Apps / Access Layers

- `frontend/src/mechanic/MechanicLogin.jsx`
- `frontend/src/mechanic/MechanicProtectedRoute.jsx`
- `frontend/src/mechanic/MechanicApp.jsx`
- `frontend/src/supervisor/SupervisorLogin.jsx`
- `frontend/src/supervisor/SupervisorProtectedRoute.jsx`
- `frontend/src/supervisor/SupervisorApp.jsx`
- `frontend/src/staff/StaffPage.jsx`

### New Stylesheets

- `frontend/src/styles/mechanic.css`
- `frontend/src/styles/supervisor.css`

### New Backend Logic Areas

- `backend/src/reports/report.controller.js`
  - now includes alert center logic
- `backend/src/auth/auth.controller.js`
  - now includes mechanic and supervisor signup/approval logic

---

## Recommended Commenting Order

If we are doing this in a disciplined way, the right order is:

1. `backend/src/shifts/shift.controller.js`
2. `backend/src/remittances/remittance.controller.js`
3. `backend/src/reports/report.controller.js`
4. `backend/src/maintenance/maintenance.controller.js`
5. `backend/src/tracking/tracking.controller.js`
6. `frontend/src/driver/DriverApp.jsx`
7. `frontend/src/shifts/ShiftsPage.jsx`
8. `frontend/src/remittances/RemittancesPage.jsx`
9. `frontend/src/supervisor/SupervisorApp.jsx`
10. `frontend/src/mechanic/MechanicApp.jsx`
11. `frontend/src/dashboard/Dashboard.jsx`
12. `frontend/src/staff/StaffPage.jsx`

That order documents the system from core operations outward.

---

## Commenting Pattern To Use

### For Controllers

Use block comments above exported handlers:

```javascript
/**
 * CREATE_SHIFT
 * Assigns a bus and driver to an operating window while enforcing
 * fleet availability, maintenance locks, and dispatch rules.
 * Requires: ADMIN authentication
 */
exports.createShift = async (req, res) => {
  // ...
};
```

### For React Screens

Use a short component header plus inline comments only where the logic is not obvious:

```javascript
/**
 * SupervisorApp
 * Control-tower view for live alerts, active corridor operations,
 * workshop blockers, and dispatch exceptions.
 */
export default function SupervisorApp() {
  // Fetch all supervisor-facing live datasets together so the control room
  // refreshes as a single operational snapshot.
}
```

### For CSS Files

Use section headers, not comments on every property:

```css
/* ==========================
   Supervisor Shell
   App frame, background, topbar
   ========================== */
```

---

## Practical Rules

- Comment business rules, not trivial JSX or assignments.
- Explain why a guard exists when it enforces an operational policy.
- Keep comments close to complex decisions:
  - inactive bus lock
  - remittance variance handling
  - tracking enforcement
  - shift lifecycle rules
  - supervisor alert severity logic
- Avoid narrating obvious rendering code.

---

## Files That Should Not Be Over-Commented

These files should stay lean:

- `frontend/src/main.jsx`
- `backend/src/server.js`
- simple route files
- simple protected-route wrappers

Add only a file header or a small explanation where needed.

---

## Real Priority Now

The most important code to document is no longer generic CRUD.

The real priority is documenting:

- dispatch lifecycle
- financial controls
- alert generation
- live tracking rules
- maintenance lock rules
- role-gated operational workflows

That is where future confusion will come from if comments are missing.

---

## Recommended Next Comment Batch

If continuing immediately, the best next batch is:

1. `backend/src/shifts/shift.controller.js`
2. `backend/src/remittances/remittance.controller.js`
3. `backend/src/reports/report.controller.js`
4. `frontend/src/driver/DriverApp.jsx`
5. `frontend/src/supervisor/SupervisorApp.jsx`

That batch covers the heart of the operating system.
