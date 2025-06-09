// This file is the entry point of the frontend React application


import Topbar from "./components/Topbar";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import SignInPage from "./pages/SignInPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";

import { Routes, Route, Navigate } from "react-router-dom";
import { authState } from "./state/authState";
import { themeState } from "./state/themeState";
import { useEffect } from "react";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, onlineUsers } = authState(); // Auth store state
  const { theme } = themeState(); // Theme store

  console.log({ onlineUsers });
  console.log({ authUser });

  // On app load, check if the user is already authenticated
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Show a loading spinner while checking authentication
  if (isCheckingAuth && !authUser)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin" />
      </div>
    );

  return (
    // Apply selected DaisyUI theme to the entire app
    <div data-theme={theme}>
      {/* Top navigation bar */}
      <Topbar />

      {/* Define application routes */}
      <Routes>
        {/* Private route: home/chat */}
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/signIn" />} />

        {/* Public route: sign up */}
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />

        {/* Public route: signIn */}
        <Route path="/signIn" element={!authUser ? <SignInPage /> : <Navigate to="/" />} />

        {/* Settings page – accessible always */}
        <Route path="/settings" element={<SettingsPage />} />

        {/* Private route: profile */}
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/signIn" />} />
      </Routes>

      {/* Global toast notification system */}
      <Toaster />
    </div>
  );
};

export default App;