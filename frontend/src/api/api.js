/**
 * Axios API client with authentication and error handling
 * Centralized configuration for all Track23 frontend API calls
 */

import axios from "axios";
import { clearSession, decodeRole, getToken } from "../utils/authSession";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:4000",
  timeout: 10000,
});

/**
 * Clear session and redirect to appropriate login page
 */
const clearSessionAndRedirect = () => {
  const role = decodeRole();
  clearSession();

  const loginPages = {
    DRIVER: "/driver/login",
    MECHANIC: "/mechanic/login",
    SUPERVISOR: "/supervisor/login",
  };

  const nextLocation = loginPages[role] || "/login";

  if (window.location.pathname !== nextLocation) {
    window.location.href = nextLocation;
  }
};

/**
 * Request interceptor - Attach JWT token to all requests
 */
api.interceptors.request.use(
  (config) => {
    const token = getToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Response interceptor - Handle errors and auth failures
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message =
      error?.response?.data?.error?.message ||
      error?.message ||
      "An error occurred";

    // Handle 401 Unauthorized - redirect to login
    if (status === 401) {
      clearSessionAndRedirect();
      return Promise.reject({
        status,
        message: "Session expired. Please log in again.",
        code: "AUTH_ERROR",
      });
    }

    // Handle 403 Forbidden - account inactive or pending approval
    if (
      status === 403 &&
      [
        "Account inactive",
        "Driver account pending admin approval",
        "Mechanic account pending admin approval",
        "Supervisor account pending admin approval",
      ].includes(message)
    ) {
      clearSessionAndRedirect();
      return Promise.reject({
        status,
        message,
        code: "ACCOUNT_INACTIVE",
      });
    }

    // Handle 429 Too Many Requests
    if (status === 429) {
      return Promise.reject({
        status,
        message: "Too many requests. Please wait a moment and try again.",
        code: "RATE_LIMIT",
      });
    }

    // Handle 500+ Server Errors
    if (status >= 500) {
      return Promise.reject({
        status,
        message: "Server error. Please try again later.",
        code: "SERVER_ERROR",
      });
    }

    // Return formatted error
    return Promise.reject({
      status,
      message,
      code: error?.response?.data?.error?.code || "UNKNOWN_ERROR",
      details: error?.response?.data?.error?.details || {},
    });
  },
);

export default api;
