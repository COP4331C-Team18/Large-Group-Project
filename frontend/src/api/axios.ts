import axios from "axios";
import type { AxiosRequestConfig } from "axios";
// Using the built-in type ensures all axios-specific properties are valid

const config: AxiosRequestConfig = {
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true,
    headers: {
        "Content-Type": "application/json",
    },
};

const api = axios.create(config);

// Adding a global 401 axios interceptor to handle unauthorized errors
// AuthContext will listen for the "auth-expired" event and log the user out when it occurs
// Had to add this so that user reroutes to login if they try and make any API call while on the dashboard and their session has expired
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;

    // Ignore 401 from /auth/me — normal when logged out
    if (status === 401 && url !== "/auth/me") {
      window.dispatchEvent(new Event("auth-expired"));
    }
    return Promise.reject(error);
  }
);
export default api;