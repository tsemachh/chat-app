// This file renders the React app to the DOM

// - main.jsx imports global styles from index.css (includes Tailwind setup)
// - main.jsx wraps the App component with React.StrictMode for highlighting potential issues
// - main.jsx uses BrowserRouter to enable client-side routing
// - main.jsx mounts the React app to the root div in index.html using createRoot (React 18+)


import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css"; // Global styles with Tailwind directives
import App from "./App.jsx"; // Root application component

import { BrowserRouter } from "react-router-dom"; // Enables routing with URL paths

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);