//charStats.js

import OBR from "@owlbear-rodeo/sdk";
import { fetchCharacterData } from "./characterData.js";
import {
  renderAbilities,
  renderSavingThrows,
  renderSaveNotes,
} from "./renderStats.js";

function getQueryParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

OBR.onReady(async () => {
  const charName = getQueryParam("name") || "Unknown";
  const charId = getQueryParam("charId");
  const modalId = getQueryParam("modalId");

  document.getElementById("char-name").textContent = charName;
  document.getElementById("stats").textContent = charId
    ? `Character ID: ${charId}`
    : "No Character ID";

  document.getElementById("closeBtn").addEventListener("click", () => {
    if (modalId) {
      OBR.popover.close(modalId);
    }
  });

  if (!charId) return;

  try {
    const data = await fetchCharacterData(charId);
    if (!data?.stats) {
      document.getElementById("stats").textContent =
        "Failed to load character.";
      return;
    }

    renderAbilities(data.stats, charName);
    renderSavingThrows(data.stats, charName);
    renderSaveNotes(data.stats);

    document.getElementById("stats").style.display = "none";
  } catch (err) {
    console.error(err);
    document.getElementById("stats").textContent = "Error loading character.";
  }
});
