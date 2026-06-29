// Shared Axios client for the Track23 frontend.
// Attaches auth tokens, handles forced logout scenarios,
// and centralizes API base configuration.
import axios from "axios";
import { clearSession, decodeRole, getToken } from "../utils/authSession";

const api = axios.create({
  baseURL: "http://localhost:4000",
});

const clearSessionAndRedirect = () => {
  const role = decodeRole();
  clearSession();

  const nextLocation =
    role === "DRIVER"
      ? "/driver/login"
      : role === "MECHANIC"
        ? "/mechanic/login"
        : role === "SUPERVISOR"
          ? "/supervisor/login"
        : "/login";

  if (window.location.pathname !== nextLocation) {
    window.location.href = nextLocation;
  }
};

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const message = error?.response?.data?.error || "";

    if (
      status === 401 ||
      (status === 403 &&
        [
          "Account inactive",
          "Driver account pending admin approval",
          "Mechanic account pending admin approval",
          "Supervisor account pending admin approval",
        ].includes(message))
    ) {
      clearSessionAndRedirect();
    }

    return Promise.reject(error);
  },
);

export default api;

