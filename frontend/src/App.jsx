// This file is the entry point of the frontend React application

// - App.jsx sets up routing with React Router DOM
// - App.jsx uses Zustand stores to track authentication state and theme
// - App.jsx checks user authentication on load and renders the appropriate routes
// - App.jsx shows a loading spinner while verifying the session
// - App.jsx applies the selected theme using data-theme for DaisyUI styling
// - App.jsx includes a global Navbar and Toaster for layout and notifications

import Navbar from "./components/Navbar";

import HomePage from "./pages/HomePage";
import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { useEffect } from "react";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth, onlineUsers } = useAuthStore(); // Auth store state
  const { theme } = useThemeStore(); // Theme store

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
      <Navbar />

      {/* Define application routes */}
      <Routes>
        {/* Private route: home/chat */}
        <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />

        {/* Public route: sign up */}
        <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />

        {/* Public route: login */}
        <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/" />} />

        {/* Settings page – accessible always */}
        <Route path="/settings" element={<SettingsPage />} />

        {/* Private route: profile */}
        <Route path="/profile" element={authUser ? <ProfilePage /> : <Navigate to="/login" />} />
      </Routes>

      {/* Global toast notification system */}
      <Toaster />
    </div>
  );
};

export default App;
