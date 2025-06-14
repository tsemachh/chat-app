import { io } from "socket.io-client";
import { authState } from "./state/authState"; // adjust path if needed

const userId = authState.getState().user?._id || ""; // grab userId from auth state

export const socket = io("http://localhost:5001", {
  query: { userId },
  withCredentials: true,
  autoConnect: true,
});
