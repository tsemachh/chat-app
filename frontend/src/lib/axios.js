// This file installs a reusable Axios instance for API calls with base URL and credentials.

import axios from "axios";

// configure Axios instance with environment-based baseURL and cookie
export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development"
   ? "http://localhost:5001/api" // use local backend for dev
  : "/api", // use relative path in production
  withCredentials: true, // send cookies on every request (auth sessions)
});