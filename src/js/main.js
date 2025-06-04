import "../css/style.css";
import OBR from "@owlbear-rodeo/sdk";
import { setupContextMenu } from "./contextMenu.js";
import { setupSettings } from "./settings/settings.js";
import { ID } from "./constants.js";
import { fetchCharacterData } from "./characterData.js";
import { loadCharacterDetails } from "./characterDetails.js";
import { setupRollBroadcastListeners } from "./rollBroadcast.js";

let pollingIntervals = {};
let lastCharacterData = {};
let showInspiration = true;

function updateInspirationVisibility(enabled) {
  showInspiration = enabled;
  document.querySelectorAll(".char-inspiration").forEach((el) => {
    el.style.display = enabled ? "" : "none";
  });
}

async function fetchInitialSettings() {
  const metadata = await OBR.room.getMetadata();
  const settings = metadata?.[`${ID}/settings`] ?? {};
  updateInspirationVisibility(settings.showInspiration ?? true);

  const labelEl = document.getElementById("details-tab-label");
  if (labelEl && settings.detailsTabLabel) {
    labelEl.textContent = settings.detailsTabLabel;
  }
}

OBR.onReady(async () => {
  async function initialize() {
    await fetchInitialSettings();

    const usageGuide = document.getElementById("usageButton");
    if (usageGuide) {
      usageGuide.onclick = () => {
        window.open(
          "https://github.com/Leftysloft/obr-meet-the-cast/tree/5-28-25-2#readme",
          "mozillaWindow",
          "left=100,top=100,width=600,height=800"
        );
      };
    }

    const allItems = await OBR.scene.items.getItems();
    handleSceneItems(allItems);

    OBR.scene.items.onChange(async () => {
      const updatedItems = await OBR.scene.items.getItems();
      handleSceneItems(updatedItems);
    });

    try {
      const metadata = await OBR.room.getMetadata();
      if (metadata?.[`${ID}/settings`]?.openActionEnabled) {
        OBR.action.open();
      }
    } catch (error) {
      console.error("Error retrieving metadata:", error);
    }

    setupContextMenu();
    setupSettings();
  }

  if (await OBR.scene.isReady()) {
    await initialize();
  }

  OBR.scene.onReadyChange(async (ready) => {
    if (ready) {
      await initialize();
    }
  });

  setupRollBroadcastListeners();
});

async function handleSceneItems(items) {
  const charItems = items.filter(
    (item) => item.metadata?.[`${ID}/metadata`]?.character_id
  );

  const currentCharIds = new Set();

  for (const item of charItems) {
    const charId = item.metadata[`${ID}/metadata`].character_id;
    currentCharIds.add(charId);

    // Polling setup
    if (!pollingIntervals[charId]) {
      pollingIntervals[charId] = setInterval(async () => {
        const data = await fetchCharacterData(charId);
        const allItems = await OBR.scene.items.getItems();
        const match = allItems.find((i) => i.metadata?.[`${ID}/metadata`]?.character_id === charId);
        if (data && match) {
          loadCharacterDetails(charId, data, match, lastCharacterData);
        }
      }, 10000);
    }

    // Fetch and render character
    const data = await fetchCharacterData(charId);
    if (data) {
      loadCharacterDetails(charId, data, item, lastCharacterData);
    }
  }

  // Clean up removed character entries
  for (const charId in lastCharacterData) {
    if (!currentCharIds.has(charId)) {
      const charElement = document.getElementById(charId);
      if (charElement) {
        charElement.remove();
      }
      clearInterval(pollingIntervals[charId]);
      delete pollingIntervals[charId];
      delete lastCharacterData[charId];
    }
  }
}
