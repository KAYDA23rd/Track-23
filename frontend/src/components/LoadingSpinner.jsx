/**
 * Loading spinner component
 * Displays during data loading
 */

import "../styles/components/LoadingSpinner.css";

export const LoadingSpinner = ({ size = "medium", text = "Loading..." }) => {
  return (
    <div className={`loading-spinner loading-spinner-${size}`}>
      <div className="spinner"></div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
