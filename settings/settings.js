import OBR from "@owlbear-rodeo/sdk";
import { ID } from "../constants.js";

export function setupSettings() {
  console.log("Settings.js is loaded");

  const backButton = document.getElementById("closeSettings");
  const settingsOverlay = document.getElementById("settings-overlay");
  const openActionSetting = document.getElementById("openActionSetting");

  // Log for debugging
  console.log("backButton:", backButton);
  console.log("settingsOverlay:", settingsOverlay);
  console.log("openActionSetting:", openActionSetting);
  console.log("metadata", OBR.room.getMetadata());

  // Handle back button click
  if (backButton && settingsOverlay) {
    backButton.addEventListener("click", () => {
      console.log("Back button clicked!");
      settingsOverlay.classList.add("hidden");
      console.log("Overlay hidden.");
    });
  } else {
    console.warn("Back button or settings overlay not found.");
  }

  // Load checkbox state from room metadata
  if (openActionSetting) {
    OBR.room
      .getMetadata()
      .then((metadata) => {
        // Correct path using the ID
        const isChecked = metadata?.[`${ID}/openActionEnabled`] ?? false;
        openActionSetting.checked = isChecked;
      })
      .catch((error) => {
        console.error("Error loading metadata:", error);
      });

    // Save state on checkbox change
    openActionSetting.addEventListener("change", async () => {
      try {
        await OBR.room.setMetadata({
          [`${ID}/openActionEnabled`]: openActionSetting.checked, // Correct path for the metadata
        });
        console.log("Setting saved!");
      } catch (error) {
        console.error("Error saving setting:", error);
      }
    });
  } else {
    console.warn("Checkbox element 'openActionSetting' not found.");
  }
}
