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

    OBR.room.onMetadataChange((metadata) => {
      const settings = metadata?.[`${ID}/settings`] ?? {};
      updateInspirationVisibility(settings.showInspiration ?? true);

      const labelEl = document.getElementById("details-tab-label");
      if (labelEl && settings.detailsTabLabel) {
        labelEl.textContent = settings.detailsTabLabel;
      }
    });

    const usageGuide = document.getElementById("usageButton");
    usageGuide.onclick = () => {
      window.open(
        "https://github.com/Leftysloft/obr-meet-the-cast/tree/5-28-25-2#readme",
        "mozillaWindow",
        "left=100,top=100,width=600,height=800"
      );
    };

    const items = await OBR.scene.items.getItems();
    handleSceneItems(items);

    OBR.scene.items.onChange(async () => {
      const allItems = await OBR.scene.items.getItems();
      handleSceneItems(allItems);
    });

    try {
      const metadata = await OBR.room.getMetadata();
      if (metadata?.[`${ID}/settings`]?.openActionEnabled) {
        OBR.action.open();
      }
    } catch (error) {
      console.error("Error retrieving metadata. Check path:", error);
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

  const activeCharIds = new Set(
    charItems.map(
      (item) => item.metadata?.[`${ID}/metadata`]?.character_id
    )
  );

  charItems.forEach((item) => {
    const charId = item.metadata[`${ID}/metadata`].character_id;

    fetchCharacterData(charId).then(async (data) => {
      const freshItems = await OBR.scene.items.getItems();
      const freshItem = freshItems.find((i) => i.id === item.id);
      if (data && freshItem) {
        loadCharacterDetails(charId, data, freshItem, lastCharacterData);
      } else {
        console.error("Failed to fetch character data or item");
      }
    });

    if (!pollingIntervals[charId]) {
      pollingIntervals[charId] = setInterval(async () => {
        const data = await fetchCharacterData(charId);
        if (data) {
          const freshItems = await OBR.scene.items.getItems();
          const freshItem = freshItems.find((i) => i.id === item.id);
          if (freshItem) {
            loadCharacterDetails(charId, data, freshItem, lastCharacterData);
          }
        }
      }, 10000);
    }
  });

  // Stop polling for removed characters
  Object.keys(pollingIntervals).forEach((charId) => {
    if (!activeCharIds.has(charId)) {
      clearInterval(pollingIntervals[charId]);
      delete pollingIntervals[charId];
    }
  });

  // Remove DOM and cache entries for removed characters
  Object.keys(lastCharacterData).forEach((charId) => {
    if (!activeCharIds.has(charId)) {
      const charElement = document.getElementById(charId);
      if (charElement) {
        charElement.remove();
      }
      delete lastCharacterData[charId];
    }
  });
}
