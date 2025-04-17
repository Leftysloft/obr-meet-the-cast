import OBR from "@owlbear-rodeo/sdk";
import { ID } from "../constants.js";
import { setupSheetList } from "../sheetList.js";
// import { settingUpdate } from "../sheetList";

const SETTINGS_KEY = `${ID}/settings`;

export async function updateSetting(key, value) {
  const metadata = await OBR.room.getMetadata();
  const currentSettings = metadata?.[SETTINGS_KEY] ?? {};

  const updatedSettings = {
    ...currentSettings,
    [key]: value,
  };

  await OBR.room.setMetadata({
    [SETTINGS_KEY]: updatedSettings,
  });
  setupSheetList;
}

export function setupSettings() {
  const backButton = document.getElementById("closeSettings");
  const settingsOverlay = document.getElementById("settings-overlay");

  if (backButton && settingsOverlay) {
    backButton.addEventListener("click", () => {
      settingsOverlay.classList.add("hidden");
    });
  }

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

    // console.log("Current Room Metadata:", metadata);
    // console.log("Parsed Settings Object:", settings);

    if (!isGM) {
      const settingsContent = document.querySelector(".settings-content");
      const constructionMessage = document.createElement("p");
      constructionMessage.innerText =
        "Settings are under construction. Please check back later.";
      settingsContent.appendChild(constructionMessage);

      document
        .querySelectorAll("input[type='checkbox']")
        .forEach((input) => (input.style.display = "none"));
      document
        .querySelectorAll("label")
        .forEach((label) => (label.style.display = "none"));
      return;
    }

    for (const setting of gmSettings) {
      const input = document.getElementById(setting.id);
      const label = document.querySelector(`label[for="${setting.label}"]`);
      if (!input || !label) continue;

      input.checked = settings?.[setting.key] ?? setting.defaultValue;

      input.addEventListener("change", () => {
        updateSetting(setting.key, input.checked);
      });
    }
  });
}
