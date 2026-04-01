import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "@/styles/globals.css";
import { FontApplier } from "@/components/FontApplier";
// import { injectMockDpsData } from "./utils/mockDpsData";
// injectMockDpsData();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <FontApplier />
    <App />
  </StrictMode>,
);
