import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { authState } from "./authState";
import DHKeyExchange from "../lib/keyExchange";

export const chatState = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  msgsLoading: false,
  keyExchange: new DHKeyExchange(),
  keyExchangeStatus: {}, // userId -> status

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
    const { selectedUser, messages, keyExchange } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      if (error.response?.data?.requiresKeyExchange) {
        toast.error("Key exchange required before sending encrypted messages");
        // Automatically initiate key exchange
        get().initiateKeyExchange(selectedUser._id);
      } else {
        toast.error(error.response?.data?.message || "Failed to send message");
      }
    }
  },

  // Key exchange functions
  initiateKeyExchange: async (targetUserId) => {
    const { keyExchange, keyExchangeStatus } = get();
    
    try {
      set({ 
        keyExchangeStatus: { 
          ...keyExchangeStatus, 
          [targetUserId]: 'initiating' 
        } 
      });

      const res = await axiosInstance.post(`/keys/initiate/${targetUserId}`);
      
      set({ 
        keyExchangeStatus: { 
          ...keyExchangeStatus, 
          [targetUserId]: 'pending' 
        } 
      });

      toast.success("Key exchange initiated. Waiting for response...");
    } catch (error) {
      set({ 
        keyExchangeStatus: { 
          ...keyExchangeStatus, 
          [targetUserId]: 'failed' 
        } 
      });
      toast.error(error.response?.data?.error || "Failed to initiate key exchange");
    }
  },

  respondToKeyExchange: async (sessionId, otherPublicKey, accept = true) => {
    const { keyExchange } = get();
    
    try {
      if (accept) {
        // Generate our key pair and derive shared secret
        await keyExchange.generateKeyPair();
        const ourPublicKey = await keyExchange.exportPublicKey();
        const sharedKey = await keyExchange.deriveSharedKey(otherPublicKey);
        
        // Store the session
        keyExchange.storeSession(sessionId, ourPublicKey, sharedKey);
      }

      const res = await axiosInstance.post('/keys/respond', {
        sessionId,
        otherPublicKey,
        accept
      });

      if (accept) {
        toast.success("Key exchange completed successfully!");
      } else {
        toast.info("Key exchange declined");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to respond to key exchange");
    }
  },

  completeKeyExchange: async (sessionId, otherPublicKey) => {
    const { keyExchange } = get();
    
    try {
      const sharedKey = await keyExchange.deriveSharedKey(otherPublicKey);
      keyExchange.storeSession(sessionId, otherPublicKey, sharedKey);

      await axiosInstance.post('/keys/complete', {
        sessionId,
        otherPublicKey
      });

      toast.success("Key exchange completed!");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to complete key exchange");
    }
  },

  syncMsgs: () => {
    const { selectedUser } = get();
    if (!selectedUser) return;

    const socket = authState.getState().socket;

    socket.on("newMsg", (newMsg) => {
      const isFromUser = newMsg.fromUserId === selectedUser._id;
      if (!isFromUser) return;

      set({
        messages: [...get().messages, newMsg],
      });
    });

    // Handle key exchange events
    socket.on("keyExchangeRequest", (data) => {
      const { from, publicKey, sessionId } = data;
      
      toast((t) => (
        <div>
          <p>Key exchange request from user</p>
          <div className="flex gap-2 mt-2">
            <button
              className="bg-green-500 text-white px-3 py-1 rounded text-sm"
              onClick={() => {
                get().respondToKeyExchange(sessionId, publicKey, true);
                toast.dismiss(t.id);
              }}
            >
              Accept
            </button>
            <button
              className="bg-red-500 text-white px-3 py-1 rounded text-sm"
              onClick={() => {
                get().respondToKeyExchange(sessionId, publicKey, false);
                toast.dismiss(t.id);
              }}
            >
              Decline
            </button>
          </div>
        </div>
      ), {
        duration: 10000, // 10 seconds to respond
        id: `key-exchange-${sessionId}`
      });
    });

    socket.on("keyExchangeResponse", (data) => {
      const { from, publicKey, sessionId, accepted } = data;
      
      if (accepted) {
        get().completeKeyExchange(sessionId, publicKey);
      } else {
        toast.info("Key exchange was declined by the other user");
      }
    });

    socket.on("connectionEstablished", (data) => {
      console.log("Connection established:", data.message);
    });
  },

  offMessages: () => {
    const socket = authState.getState().socket;
    socket.off("newMsg");
    socket.off("keyExchangeRequest");
    socket.off("keyExchangeResponse");
    socket.off("connectionEstablished");
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));