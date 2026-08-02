import { ParrotWidget } from "./core";

// Auto-initialize when loaded
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => new ParrotWidget());
  } else {
    new ParrotWidget();
  }
}
