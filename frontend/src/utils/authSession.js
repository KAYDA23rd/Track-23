const TOKEN_KEY = "token";
const DRIVER_PHONE_KEY = "driver_phone";
const DRIVER_NAME_KEY = "driver_name";

const getStorageValue = (storage, key) => {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
};

const setStorageValue = (storage, key, value) => {
  try {
    storage.setItem(key, value);
  } catch {
    // Storage may be unavailable in restricted browser modes.
  }
};

const removeStorageValue = (storage, key) => {
  try {
    storage.removeItem(key);
  } catch {
    // Storage may be unavailable in restricted browser modes.
  }
};

export const getToken = () =>
  getStorageValue(sessionStorage, TOKEN_KEY) || getStorageValue(localStorage, TOKEN_KEY);

export const setToken = (token) => {
  setStorageValue(sessionStorage, TOKEN_KEY, token);
  removeStorageValue(localStorage, TOKEN_KEY);
};

export const clearSession = () => {
  [sessionStorage, localStorage].forEach((storage) => {
    [TOKEN_KEY, DRIVER_PHONE_KEY, DRIVER_NAME_KEY].forEach((key) =>
      removeStorageValue(storage, key),
    );
  });
};

export const getDriverPhone = () =>
  getStorageValue(sessionStorage, DRIVER_PHONE_KEY) ||
  getStorageValue(localStorage, DRIVER_PHONE_KEY);

export const setDriverProfile = ({ name, phone }) => {
  if (phone) {
    setStorageValue(sessionStorage, DRIVER_PHONE_KEY, phone);
    removeStorageValue(localStorage, DRIVER_PHONE_KEY);
  }

  if (name) {
    setStorageValue(sessionStorage, DRIVER_NAME_KEY, name);
    removeStorageValue(localStorage, DRIVER_NAME_KEY);
  }
};

export const getDriverName = () =>
  getStorageValue(sessionStorage, DRIVER_NAME_KEY) ||
  getStorageValue(localStorage, DRIVER_NAME_KEY);

export const decodeRole = (token = getToken()) => {
  try {
    if (!token) return null;
    const [, payload] = token.split(".");
    if (!payload) return null;
    const parsed = JSON.parse(atob(payload));
    return parsed.role || null;
  } catch {
    return null;
  }
};
