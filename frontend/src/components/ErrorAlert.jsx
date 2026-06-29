/**
 * Error display component
 * Shows formatted error messages with dismiss button
 */

import "../styles/components/ErrorAlert.css";

export const ErrorAlert = ({ error, onDismiss }) => {
  if (!error) return null;

  return (
    <div className="error-alert">
      <div className="error-alert-content">
        <svg
          className="error-icon"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div className="error-text">
          <strong>Error</strong>
          <p>{error}</p>
        </div>
      </div>
      {onDismiss && (
        <button
          className="error-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss error"
        >
          ✕
        </button>
      )}
    </div>
  );
};

export default ErrorAlert;
