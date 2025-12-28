// frontend/src/api/axios.js
import axios from "axios";

// Create an Axios instance
const instance = axios.create({
  baseURL: "/api", // Proxy defined in vite.config.js
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: Add an interceptor for auth token if needed
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Or get token from your authService
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;
