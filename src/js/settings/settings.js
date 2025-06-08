// settings.js
import OBR from "@owlbear-rodeo/sdk";
import { ID } from "../constants.js";
import { showDiceOverlay } from "../diceOverlay.js";

const SETTINGS_KEY = `${ID}/settings`;

export async function updateSetting(key, value) {
  const metadata = await OBR.room.getMetadata();
  const currentSettings = metadata?.[SETTINGS_KEY] ?? {};

  const updatedSettings = {
    ...currentSettings,
    [key]: value,
  };
  console.log("Updated Settings:", updatedSettings);

  await OBR.room.setMetadata({
    [SETTINGS_KEY]: updatedSettings,
  });
}

export function setupSettings() {
  const gmSettings = [
    {
      id: "openActionSetting",
      label: "openActionSetting",
      key: "openActionEnabled",
      defaultValue: false,
      type: "checkbox",
    },
    {
      id: "showInspirationSetting",
      label: "showInspirationSetting",
      key: "showInspiration",
      defaultValue: true,
      type: "checkbox",
    },
  ];

  const radioSetting = {
    id: "statBlockAccess",
    label: "Who can view character stats?",
    key: "statBlockAccess",
    defaultValue: "gmOwner", // or "all"
    type: "radio",
    options: [
      { value: "gmOwner", label: "GM + Owner" },
      { value: "all", label: "All" },
    ],
  };

  let overlayOpen = false;

  const diceTrayButton = document.getElementById("diceTrayButton");
  if (diceTrayButton) {
    diceTrayButton.addEventListener("click", () => {
      console.log("Dice tray button clicked!");
      if (!overlayOpen) {
        showDiceOverlay(() => (overlayOpen = false)); // Pass a close callback
        overlayOpen = true;
      } else {
        const overlay = document.getElementById("dice-overlay");
        if (overlay) overlay.remove();
        overlayOpen = false;
      }
    });
  }

  OBR.player.getRole().then(async (role) => {
    const isGM = role === "GM";
    const metadata = isGM ? await OBR.room.getMetadata() : {};
    const settings = isGM ? metadata?.[SETTINGS_KEY] ?? {} : {};

    if (!isGM) {
      const settingsContent = document.getElementById("settings-content");
      settingsContent.innerHTML = `
        <p class="dm-only-message">Settings are currently only for DM control.</p>
        <p class="dm-only-message spacing-md">Please check back later as this app is evolving.</p>
      `;
      return;
    }

    // Set up checkboxes
    for (const setting of gmSettings) {
      const input = document.getElementById(setting.id);
      if (!input) continue;

      input.checked = settings?.[setting.key] ?? setting.defaultValue;
      input.addEventListener("change", () => {
        updateSetting(setting.key, input.checked);
      });
    }

    // Set up radio group
    const radios = document.getElementsByName(radioSetting.id);
    radios.forEach((radio) => {
      radio.checked = settings?.[radioSetting.key] === radio.value;
      radio.addEventListener("change", () => {
        if (radio.checked) {
          updateSetting(radioSetting.key, radio.value);
        }
      });
    });

    // Set up label input
    const labelInput = document.getElementById("detailsTabLabelSetting");
    const labelEl = document.getElementById("details-tab-label");

    if (labelInput) {
      const savedLabel = settings?.detailsTabLabel ?? "Character's";
      labelInput.value = savedLabel;
      if (labelEl) labelEl.textContent = savedLabel;

      labelInput.addEventListener("input", () => {
        const newLabel = labelInput.value.trim() || "Character's";
        updateSetting("detailsTabLabel", newLabel);
        if (labelEl) labelEl.textContent = newLabel;
      });
    }
  });
}
