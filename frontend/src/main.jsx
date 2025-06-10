// renders the React app to the DOM


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