//main.js
import "../css/style.css";
import OBR from "@owlbear-rodeo/sdk";
import { setupContextMenu } from "./contextMenu.js";
import { setupSettings } from "./settings/settings.js";
import { ID } from "./constants.js";
import { fetchCharacterData } from "./characterData.js";
// import { setupLightSheetList } from "./lightSheetList.js";

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
    anchorOrigin: {
      horizontal: "CENTER",
      vertical: "TOP",
    },
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

  // ✅ Add this check FIRST
  if (await OBR.scene.isReady()) {
    await initialize();
  }

  // ✅ Still listen for changes in case the scene becomes ready later
  OBR.scene.onReadyChange(async (ready) => {
    if (ready) {
      await initialize();
    }
  });

  if (OBR.broadcast?.onMessage) {
    OBR.broadcast.onMessage((event) => {
      const { label, content, name } = event.data;
      const type = event.type;

      if (type === "rodeo.owlbear.charStats.rollResult") {
        showRollPopover(label, content, name);
      }
    });
  } else {
    console.warn("Broadcast listener unavailable");
  }
  // if (OBR.broadcast?.onMessage) {
  //   OBR.broadcast.onMessage(
  //     "rodeo.owlbear.charSkills.rollResult",
  //     handleRollResult
  //   );
  // } else {
  //   console.warn("Broadcast listener unavailable");
  // }
});

async function handleSceneItems(items) {
  console.log("Handling scene items:", items); //Debug not loading error with no console errors
  const charItems = items.filter(
    (item) => item.metadata?.[`${ID}/metadata`]?.character_id
  );

  const newCharIds = charItems.map(
    (item) => item.metadata?.[`${ID}/metadata`]?.character_id
  );

  newCharIds.forEach((charId, index) => {
    const item = charItems[index];
    const lastData = lastCharacterData[charId];

    // Always fetch and reload if item metadata may have changed
    fetchCharacterData(charId).then(async (data) => {
      console.log("Fetched character data for", charId, data); //debug load failure with no error in console.

      const freshItems = await OBR.scene.items.getItems();
      const freshItem = freshItems.find((i) => i.id === item.id);
      if (data && freshItem) {
        loadCharacterDetails(charId, data, freshItem); // <- now using fresh item
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
            loadCharacterDetails(charId, data, freshItem);
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

async function loadCharacterDetails(charId, data, item) {
  const container = document.getElementById("details-tab");
  if (!container) return;

  const isGM = (await OBR.player.getRole()) === "GM";
  const showToPlayers =
    item.metadata?.[`${ID}/metadata`]?.showToPlayers ?? false;
  const shouldShow = isGM || showToPlayers;
  const existingDiv = document.getElementById(charId); // <-- this was missing!

  // If the card exists but should no longer be shown, remove it
  if (!shouldShow) {
    if (existingDiv) {
      existingDiv.remove();
      delete lastCharacterData[charId];
    }
    return;
  }

  // If player and checkbox not enabled, do not show
  if (!isGM && !showToPlayers) return;

  let characterDiv = document.getElementById(charId);
  const lastData = lastCharacterData[charId];

  if (!characterDiv) {
    characterDiv = document.createElement("div");
    characterDiv.classList.add("character-details");
    characterDiv.id = charId;
    container.appendChild(characterDiv);

    characterDiv.innerHTML = `
      <div class="char-header">
        <h4 class="char-name"></h4>
        <h3 class="char-class"></h3>
      </div>
      <div class="char-body">
        <div class="left-column">
          <a class="char-link" href="https://www.dndbeyond.com/characters/${charId}" target="_blank">
            <img class="char-img" />
          </a>
          <div class="healthbar"><div class="healthbar-fill"></div></div>
        </div>
        <div class="right-column">
          <p class="char-hp"></p>
          <p class="char-ac"></p>
          <p class="char-inspiration" style="display: ${
            showInspiration ? "" : "none"
          }"></p>
        </div>
      </div>
    `;

    // GM-only checkbox for show/hide to players
    if (isGM) {
      const checkbox = document.createElement("label");
      checkbox.style.display = "block";
      checkbox.style.marginTop = "4px";

      const input = document.createElement("input");
      input.type = "checkbox";
      input.checked = showToPlayers;
      input.style.marginRight = "4px";

      input.addEventListener("change", async () => {
        const newMetadata = {
          ...item.metadata,
          [`${ID}/metadata`]: {
            ...item.metadata?.[`${ID}/metadata`],
            showToPlayers: input.checked,
          },
        };

        await OBR.scene.items.updateItems([item.id], (items) => {
          for (const i of items) {
            i.metadata = newMetadata;
          }
        });

        // ✅ Diagnostic check to confirm the update persisted
        const updatedItems = await OBR.scene.items.getItems();
        const updatedItem = updatedItems.find((i) => i.id === item.id);

        // console.log(
        //   "Updated item metadata:",
        //   updatedItem.metadata?.[`${ID}/metadata`]
        // );
      });

      checkbox.appendChild(input);
      checkbox.appendChild(document.createTextNode("Enable Player View"));
      characterDiv.appendChild(checkbox);
    }
  }

  const charNameEl = characterDiv.querySelector(".char-name");
  if (!lastData || lastData.name !== data.name)
    charNameEl.textContent = data.name;

  charNameEl.style.cursor = "pointer"; // indicate clickable

  charNameEl.onclick = async () => {
    const modalId = `${ID}/modal/${charId}`;

    // Get current player's ID
    const playerId = await OBR.player.getId();

    // Get current player's role ("GM" or "Player")
    const role = await OBR.player.getRole();

    // Get room metadata (includes your settings)
    const metadata = await OBR.room.getMetadata();
    const settings = metadata?.[`${ID}/settings`] ?? {};

    // Determine stat block access setting ("gmOwner" or "all")
    const accessSetting = settings.statBlockAccess ?? "gmOwner";

    // Get the item representing this character to find its owner ID
    const items = await OBR.scene.items.getItems();
    const charItem = items.find((item) => {
      // Assuming character_id stored in metadata matches charId
      return item.metadata?.[`${ID}/metadata`]?.character_id === charId;
    });

    if (!charItem) {
      console.warn("Character item not found.");
      return;
    }

    const ownerId = charItem.createdUserId;

    // Check if current player is GM
    const isGM = role === "GM";

    // Check if current player is the owner of this character
    const isOwner = playerId === ownerId;

    // Access logic:
    // If setting is "all" => everyone can view
    // If setting is "gmOwner" => only GM or owner can view
    const allowed =
      accessSetting === "all" ||
      (accessSetting === "gmOwner" && (isGM || isOwner));

    if (!allowed) {
      console.warn("Stat block access denied.");
      return;
    }

    // If allowed, open the stat block popup
    OBR.popover.open({
      id: modalId,
      url: `/charStats.html?charId=${charId}&name=${encodeURIComponent(
        data.name
      )}&modalId=${encodeURIComponent(modalId)}`,
      width: 450,
      height: 900,
      marginThreshold: 25,
      anchorOrigin: { horizontal: "RIGHT", vertical: "TOP" },
      transformOrigin: { horizontal: "RIGHT", vertical: "TOP" },
      anchorReference: "ELEMENT",
    });
  };

  if (!lastData || lastData.class !== data.class)
    characterDiv.querySelector(".char-class").innerHTML = `${data.class}`;

  if (!lastData || lastData.inspiration !== data.inspiration) {
    const inspirationElement = characterDiv.querySelector(".char-inspiration");
    inspirationElement.innerHTML = " <strong>Inspiration:</strong>&nbsp;&nbsp;";
    const star = document.createElement("span");
    star.classList.add("inspiration-star");
    star.classList.add(data.inspiration ? "filled" : "outlined");
    star.textContent = "★";
    inspirationElement.appendChild(star);
  }

  if (!lastData || lastData.ac !== data.ac)
    characterDiv.querySelector(
      ".char-ac"
    ).innerHTML = `<strong>AC:</strong> ${data.ac}`;

  const charImg = characterDiv.querySelector(".char-img");
  const charLink = characterDiv.querySelector(".char-link");
  if (!lastData || lastData.image_url !== data.image_url) {
    if (data.image_url) {
      charImg.src = data.image_url;
      charImg.alt = `${data.name}'s portrait`;
    } else {
      // No image: use transparent pixel and show "No Image" overlay
      charImg.src =
        "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="; // 1x1 transparent gif
      charImg.alt = "No image available";
      // Add "No Image" text over it
      const noImageOverlay = document.createElement("div");
      noImageOverlay.textContent = "No Image";
      noImageOverlay.style.position = "absolute";
      noImageOverlay.style.top = "50%";
      noImageOverlay.style.left = "50%";
      noImageOverlay.style.transform = "translate(-50%, -50%)";
      noImageOverlay.style.color = "#999";
      noImageOverlay.style.fontWeight = "bold";
      noImageOverlay.style.pointerEvents = "none"; // keep it clickable underneath
      noImageOverlay.classList.add("no-image-overlay");

      const wrapper = charImg.parentElement;
      wrapper.style.position = "relative";
      // Remove any existing overlay first
      const existingOverlay = wrapper.querySelector(".no-image-overlay");
      if (existingOverlay) existingOverlay.remove();
      wrapper.appendChild(noImageOverlay);
    }
  }

  charImg.style.cursor = "pointer";

  charLink.onclick = (event) => {
    event.preventDefault();
    const url = `https://www.dndbeyond.com/characters/${charId}`;
    if (characterWindow && !characterWindow.closed) {
      characterWindow.location.href = url;
      characterWindow.focus();
    } else {
      characterWindow = window.open(
        url,
        "dndCharacterSheet",
        "width=400,height=800,top=100,left=100,resizable=yes,scrollbars=yes"
      );
    }
  };

  if (
    !lastData ||
    lastData.hp.current !== data.hp.current ||
    lastData.hp.max !== data.hp.max
  ) {
    characterDiv.querySelector(
      ".char-hp"
    ).innerHTML = `<strong>HP:</strong> ${data.hp.current} / ${data.hp.max}`;
    const healthBarFill = characterDiv.querySelector(".healthbar-fill");
    const targetPercentage = (data.hp.current / data.hp.max) * 100;
    smoothTransitionHealthBar(healthBarFill, targetPercentage);
  }

  // lastCharacterData[charId] = { ...data };
  lastCharacterData[charId] = data;
}

function smoothTransitionHealthBar(healthBarFill, targetPercentage) {
  let currentWidth = parseFloat(healthBarFill.style.width) || 0;
  const step = 0.5;
  const interval = setInterval(() => {
    if (Math.abs(currentWidth - targetPercentage) < step) {
      clearInterval(interval);
      healthBarFill.style.width = `${targetPercentage}%`;
    } else {
      currentWidth += (targetPercentage - currentWidth) * 0.2;
      healthBarFill.style.width = `${currentWidth}%`;
    }
  }, 100);
}
