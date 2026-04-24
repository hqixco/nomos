import { applyStoredContent, getPageKeyFromLocation } from "./content-store.js";

document.addEventListener("DOMContentLoaded", function () {
  applyStoredContent(document, getPageKeyFromLocation());
});
