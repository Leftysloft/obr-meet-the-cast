// characterDetails.js
import OBR from "@owlbear-rodeo/sdk";
import { ID } from "./constants.js";

let lastCharacterData = {};
let characterWindow = null;
let showInspiration = true;

export function setInspirationVisibility(enabled) {
  showInspiration = enabled;
  document.querySelectorAll(".char-inspiration").forEach((el) => {
    el.style.display = enabled ? "" : "none";
  });
}

export function removeCharacterCard(charId) {
  const charElement = document.getElementById(charId);
  if (charElement) {
    charElement.remove();
  }
  delete lastCharacterData[charId];
}

export async function loadCharacterDetails(charId, data, item) {
  const container = document.getElementById("details-tab");
  if (!container) return;

  const isGM = (await OBR.player.getRole()) === "GM";
  const showToPlayers =
    item.metadata?.[`${ID}/metadata`]?.showToPlayers ?? false;
  const shouldShow = isGM || showToPlayers;

  if (!shouldShow) {
    removeCharacterCard(charId);
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

  const charNameEl = characterDiv.querySelector(".char-name");
  if (!lastData || lastData.name !== data.name)
    charNameEl.textContent = data.name;

  charNameEl.style.cursor = "pointer";
  charNameEl.onclick = () => openStatBlock(charId, data.name);

  if (!lastData || lastData.class !== data.class)
    characterDiv.querySelector(".char-class").innerHTML = `${data.class}`;

  if (!lastData || lastData.inspiration !== data.inspiration) {
    const inspirationElement = characterDiv.querySelector(".char-inspiration");
    inspirationElement.innerHTML = "<strong>Inspiration:</strong>&nbsp;&nbsp;";
    const star = document.createElement("span");
    star.classList.add(
      "inspiration-star",
      data.inspiration ? "filled" : "outlined"
    );
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
      charImg.src =
        "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
      charImg.alt = "No image available";

      const noImageOverlay = document.createElement("div");
      noImageOverlay.textContent = "No Image";
      noImageOverlay.classList.add("no-image-overlay");
      Object.assign(noImageOverlay.style, {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        color: "#999",
        fontWeight: "bold",
        pointerEvents: "none",
      });

      const wrapper = charImg.parentElement;
      wrapper.style.position = "relative";
      wrapper.querySelector(".no-image-overlay")?.remove();
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

async function openStatBlock(charId, name) {
  const modalId = `${ID}/modal/${charId}`;
  const playerId = await OBR.player.getId();
  const role = await OBR.player.getRole();
  const metadata = await OBR.room.getMetadata();
  const accessSetting =
    metadata?.[`${ID}/settings`]?.statBlockAccess ?? "gmOwner";

  const items = await OBR.scene.items.getItems();
  const charItem = items.find(
    (item) => item.metadata?.[`${ID}/metadata`]?.character_id === charId
  );
  if (!charItem) return;

  const ownerId = charItem.createdUserId;
  const allowed =
    accessSetting === "all" ||
    (accessSetting === "gmOwner" && (role === "GM" || playerId === ownerId));
  if (!allowed) return;

  OBR.popover.open({
    id: modalId,
    url: `/charStats.html?charId=${charId}&name=${encodeURIComponent(
      name
    )}&modalId=${encodeURIComponent(modalId)}`,
    width: 450,
    height: 900,
    marginThreshold: 25,
    anchorOrigin: { horizontal: "RIGHT", vertical: "TOP" },
    transformOrigin: { horizontal: "RIGHT", vertical: "TOP" },
    anchorReference: "ELEMENT",
  });
}
