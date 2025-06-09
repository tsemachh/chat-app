import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { authState } from "./authState";

export const chatState = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  msgsLoading: false,

  getAccounts: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  history: async (userId) => {
    set({ msgsLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ msgsLoading: false });
    }
  },
  sendMsg: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  syncMsgs: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = authState.getState().socket;

    socket.on("newMsg", (newMsg) => {
      const isFromUser = newMsg.senderId === selectedUser._id;
      if (!isFromUser) return;

      set({
        messages: [...get().messages, newMsg],
      });
    });
  },

  offMessages: () => {
    const socket = authState.getState().socket;
    socket.off("newMsg");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));