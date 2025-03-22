import OBR from "@owlbear-rodeo/sdk";
import { ID } from "../constants.js";

export function setupSettings() {
  // console.log("Settings.js is loaded");

  const backButton = document.getElementById("closeSettings");
  const settingsOverlay = document.getElementById("settings-overlay");
  const openActionSetting = document.getElementById("openActionSetting");
  const openActionLabel = document.querySelector(
    'label[for="openActionSetting"]'
  );

  // Handle back button click
  if (backButton && settingsOverlay) {
    backButton.addEventListener("click", () => {
      // console.log("Back button clicked!");
      settingsOverlay.classList.add("hidden");
      // console.log("Overlay hidden.");
    });
  } else {
    // console.warn("Back button or settings overlay not found.");
  }

  // Get the label and checkbox elements
  OBR.player.getRole().then((role) => {
    if (role !== "GM") {
      // If not GM, change label text and hide the checkbox
      if (openActionLabel) {
        openActionLabel.innerText = "Under Construction"; // Change label text
      }
      if (openActionSetting) {
        openActionSetting.style.display = "none"; // Hide the checkbox
      }
      return; // Skip further execution for non-GMs
    }

    // For GM only — load metadata and allow interaction with checkbox
    if (openActionSetting) {
      OBR.room
        .getMetadata()
        .then((metadata) => {
          const isChecked = metadata?.[`${ID}/openActionEnabled`] ?? false;
          openActionSetting.checked = isChecked;
        })
        .catch((error) => {
          console.error("Error loading metadata:", error);
        });

      // Save state when checkbox changes
      openActionSetting.addEventListener("change", async () => {
        try {
          await OBR.room.setMetadata({
            [`${ID}/openActionEnabled`]: openActionSetting.checked,
          });
        } catch (error) {
          console.error("Error saving setting:", error);
        }
      });
    } else {
      console.warn("Checkbox element 'openActionSetting' not found.");
    }
  });
}
