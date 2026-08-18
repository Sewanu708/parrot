import { ParrotWidget } from "../core";

// Auto-initialize when loaded inside iframe or standalone
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => new ParrotWidget());
  } else {
    new ParrotWidget();
  }
}
