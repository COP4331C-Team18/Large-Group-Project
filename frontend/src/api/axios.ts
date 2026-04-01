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

export default api;