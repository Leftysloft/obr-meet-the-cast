// diceTray.js
import { showDiceOverlay } from "./diceOverlay.js";

let overlayOpen = false;

export function setupDiceTray(buttonId = "diceTrayButton") {
  console.log("Hitting dicyTray.js/setupDiceTray()");
  const diceTrayButton = document.getElementById(buttonId);
  if (diceTrayButton) {
    diceTrayButton.addEventListener("click", () => {
      console.log("[DiceTray] Button clicked!");

      if (!overlayOpen) {
        showDiceOverlay(() => (overlayOpen = false));
        overlayOpen = true;
      } else {
        const overlay = document.getElementById("dice-overlay");
        if (overlay) overlay.remove();
        overlayOpen = false;
      }
    });
  } else {
    console.warn(`[DiceTray] Button with ID '${buttonId}' not found`);
  }
}
