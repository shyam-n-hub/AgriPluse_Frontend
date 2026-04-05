// main.jsx – Entry point
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import "leaflet/dist/leaflet.css";
import App from "./App.jsx";
import { seedFirebaseData } from "./firebase/seedData.js";

// Seed Firebase with rule data on first launch
seedFirebaseData();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
