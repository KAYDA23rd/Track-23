/**
 * Custom hook for API calls with error handling, loading, and retry logic
 * Usage: const { data, loading, error, refetch } = useApi('/endpoint');
 */

import { useState, useEffect, useCallback } from "react";
import api from "../api/api";

export const useApi = (endpoint, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const {
    method = "GET",
    body = null,
    retries = 3,
    retryDelay = 1000,
    enabled = true,
  } = options;

  const fetchData = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const config = { method };
      if (body) {
        config.data = body;
      }

      const response = await api(endpoint, config);
      setData(response.data);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      const errorMessage =
        err.response?.data?.error?.message ||
        err.message ||
        "An error occurred";
      const errorCode = err.response?.status;

      // Don't retry on 4xx errors (client errors)
      if (errorCode >= 400 && errorCode < 500) {
        setError(errorMessage);
      } else if (retryCount < retries) {
        // Retry on 5xx or network errors
        setRetryCount((prev) => prev + 1);
        setTimeout(() => fetchData(), retryDelay * Math.pow(2, retryCount)); // Exponential backoff
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, method, body, retries, retryDelay, retryCount, enabled]);

  useEffect(() => {
    if (method === "GET") {
      fetchData();
    }
  }, [endpoint, method, enabled]);

  return { data, loading, error, refetch: fetchData };
};

export default useApi;
