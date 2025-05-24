import OBR from "@owlbear-rodeo/sdk";
import { ID } from "../constants.js";

const SETTINGS_KEY = `${ID}/settings`;

export async function updateSetting(key, value) {
  const metadata = await OBR.room.getMetadata();
  const currentSettings = metadata?.[SETTINGS_KEY] ?? {};

  const updatedSettings = {
    ...currentSettings,
    [key]: value,
  };
  console.log("current data", currentSettings);

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
    },
    {
      id: "showInspirationSetting",
      label: "showInspirationSetting",
      key: "showInspiration",
      defaultValue: true,
    },
  ];

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

    for (const setting of gmSettings) {
      const input = document.getElementById(setting.id);
      if (!input) continue;

      input.checked = settings?.[setting.key] ?? setting.defaultValue;
      input.addEventListener("change", () => {
        updateSetting(setting.key, input.checked);
      });
    }

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
