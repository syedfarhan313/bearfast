import "./index.css";
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { ensureAnonymousAuth, initAuthPersistence } from "./lib/firebase";

const rootElement = document.getElementById("root");

if (rootElement) {
  initAuthPersistence()
    .catch((err) => {
      console.error("[Auth] persistence init failed", err);
    })
    .finally(() => {
      ensureAnonymousAuth();
      createRoot(rootElement).render(<App />);
    });
}
