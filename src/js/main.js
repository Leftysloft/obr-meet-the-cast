// main.js
import "../css/style.css";
import OBR from "@owlbear-rodeo/sdk";
import { setupContextMenu } from "./contextMenu.js";
import { setupSettings } from "./settings/settings.js";
import { ID } from "./constants.js";
import { fetchCharacterData } from "./characterData.js";

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

  OBR.scene.onReadyChange(async (ready) => {
    if (ready) {
      await initialize();
    }
  });

  // If scene is already ready when we get here, initialize immediately
  if (OBR.scene.isReady()) {
    await initialize();
  }

  if (OBR.broadcast?.onMessage) {
    OBR.broadcast.onMessage("rodeo.owlbear.charStats.rollResult", (event) => {
      const { label, content, name } = event.data;
      showRollPopover(label, content, name);
    });

    OBR.broadcast.onMessage("rodeo.owlbear.charSkills.rollResult", (event) => {
      const { label, content, name } = event.data;
      showRollPopover(label, content, name);
    });
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
        loadCharacterDetails(charId, data, freshItem);
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

  // Clean up polling intervals and UI elements for removed characters
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

  // Determine player role and whether to show character details
  const isGM = (await OBR.player.getRole()) === "GM";
  const showToPlayers =
    item.metadata?.[`${ID}/metadata`]?.showToPlayers ?? false;
  const shouldShow = isGM || showToPlayers;

  // Remove the character's card if it shouldn't be shown
  if (!shouldShow) {
    const existingDiv = document.getElementById(charId);
    if (existingDiv) {
      existingDiv.remove();
      delete lastCharacterData[charId];
    }
    return;
  }

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

    if (isGM) {
      // Add checkbox for GM to toggle player visibility
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
      });

      checkbox.appendChild(input);
      checkbox.appendChild(document.createTextNode("Enable Player View"));
      characterDiv.appendChild(checkbox);
    }
  }

  // Update character info only if changed
  if (!lastData || lastData.name !== data.name)
    characterDiv.querySelector(".char-name").textContent = data.name;

  characterDiv.querySelector(".char-name").style.cursor = "pointer";

  characterDiv.querySelector(".char-name").onclick = async () => {
    const modalId = `${ID}/modal/${charId}`;

    const playerId = await OBR.player.getId();
    const role = await OBR.player.getRole();

    const metadata = await OBR.room.getMetadata();
    const settings = metadata?.[`${ID}/settings`] ?? {};
    const accessSetting = settings.statBlockAccess ?? "gmOwner";

    // Find owner of character item
    const items = await OBR.scene.items.getItems();
    const charItem = items.find(
      (item) => item.metadata?.[`${ID}/metadata`]?.character_id === charId
    );

    if (!charItem) {
      console.warn("Character item not found.");
      return;
    }

    const ownerId = charItem.createdUserId;
    const isGM = role === "GM";
    const isOwner = playerId === ownerId;

    // Check access permissions
    const allowed =
      accessSetting === "all" ||
      (accessSetting === "gmOwner" && (isGM || isOwner));

    if (!allowed) {
      console.warn("Stat block access denied.");
      return;
    }

    // Open stat block popover if allowed
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
  if (!lastData || lastData.image_url !== data.image_url) {
    if (data.image_url) {
      charImg.src = data.image_url;
      charImg.alt = `${data.name}'s portrait`;
    } else {
      charImg.src =
        "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
      charImg.alt = "No image available";
      const wrapper = charImg.parentElement;
      wrapper.style.position = "relative";

      const existingOverlay = wrapper.querySelector(".no-image-overlay");
      if (existingOverlay) existingOverlay.remove();

      const noImageOverlay = document.createElement("div");
      noImageOverlay.textContent = "No Image";
      noImageOverlay.style.position = "absolute";
      noImageOverlay.style.top = "50%";
      noImageOverlay.style.left = "50%";
      noImageOverlay.style.transform = "translate(-50%, -50%)";
      noImageOverlay.style.color = "#999";
      noImageOverlay.style.fontWeight = "bold";
      noImageOverlay.style.pointerEvents = "none";
      noImageOverlay.classList.add("no-image-overlay");

      wrapper.appendChild(noImageOverlay);
    }
  }

  charImg.style.cursor = "pointer";

  const charLink = characterDiv.querySelector(".char-link");
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
