// diceTray.js
import { showDiceOverlay } from "./diceOverlay.js";

let overlayOpen = false;

export function openDiceOverlay() {
  if (!overlayOpen) {
    showDiceOverlay(() => (overlayOpen = false));
    overlayOpen = true;
  }
}

export function closeDiceOverlay() {
  const overlay = document.getElementById("dice-overlay");
  if (overlay) overlay.remove();

  const rollButton = document.getElementById("roll-dice-button");
  if (rollButton) rollButton.remove();

  overlayOpen = false;
}
