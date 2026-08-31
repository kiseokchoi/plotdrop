import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Home from "../app/page";
import "../app/globals.css";

const root = document.getElementById("root");

if (!root) throw new Error("Plotdrop root element was not found.");

createRoot(root).render(
  <StrictMode>
    <Home />
  </StrictMode>,
);

if (import.meta.env.MODE === "pwa" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // Plotdrop remains usable online if offline caching is unavailable.
    });
  });
}
