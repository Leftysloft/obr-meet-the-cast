//main.js
import "../css/style.css";
import OBR from "@owlbear-rodeo/sdk";
import { setupContextMenu } from "./contextMenu.js";
import { setupSettings } from "./settings/settings.js";
import { ID } from "./constants.js";
import { fetchCharacterData } from "./characterData.js";
import { loadCharacterDetails } from "./characterDetails.js";

let pollingIntervals = {};
let lastCharacterData = {};
let characterWindow = null;
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

function showRollPopover(label, content, name = "Unknown") {
  const popoverId = `roll-result-${Date.now()}`;

  OBR.popover.open({
    id: popoverId,
    url: `/rollResult.html?label=${encodeURIComponent(
      label
    )}&content=${encodeURIComponent(content)}&name=${encodeURIComponent(name)}`,
    height: 150,
    width: 250,
    anchorOrigin: { horizontal: "CENTER", vertical: "TOP" },
    hidePaper: true,
  });

  setTimeout(() => {
    OBR.popover.close(popoverId);
  }, 4000);
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

    OBR.scene.items.onChange((items) => {
      handleSceneItems(items);
    });

    try {
      const metadata = await OBR.room.getMetadata();
      if (metadata?.[`${ID}/settings`]?.openActionEnabled) {
        OBR.action.open();
      }
    } catch (error) {
      console.error("Error retrieving metadata. Check path.:", error);
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

  if (OBR.broadcast?.onMessage) {
    OBR.broadcast.onMessage("rodeo.owlbear.charStats.rollResult", (event) => {
      const { label, content, name } = event.data;
      showRollPopover(label, content, name);
    });
    OBR.broadcast.onMessage("rodeo.owlbear.charSkills.rollResult", (event) => {
      const { label, content, name } = event.data;
      showRollPopover(label, content, name);
    });
  } else {
    console.warn("Broadcast listener unavailable");
  }
});

async function handleSceneItems(items) {
  const charItems = items.filter(
    (item) => item.metadata?.[`${ID}/metadata`]?.character_id
  );

  const newCharIds = charItems.map(
    (item) => item.metadata?.[`${ID}/metadata`]?.character_id
  );

  newCharIds.forEach((charId, index) => {
    const item = charItems[index];

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

  Object.keys(pollingIntervals).forEach((charId) => {
    if (!newCharIds.includes(charId)) {
      clearInterval(pollingIntervals[charId]);
      delete pollingIntervals[charId];
    }
  });

  Object.keys(lastCharacterData).forEach((charId) => {
    if (!newCharIds.includes(charId)) {
      const charElement = document.getElementById(charId);
      if (charElement) {
        charElement.remove();
      }
      delete lastCharacterData[charId];
    }
  });
}
