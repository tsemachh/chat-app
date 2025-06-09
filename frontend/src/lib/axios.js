import axios from "axios";

// Axios instance 
export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development"
   ? "http://localhost:5001/api" // use local backend for dev
  : "/api",
  withCredentials: true, // send cookies on every request
});