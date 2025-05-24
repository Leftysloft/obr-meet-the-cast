import OBR from "@owlbear-rodeo/sdk";
import { ID } from "./constants.js";
import "../css/style.css";

let cachedItems = [];

export async function setupSheetList(element) {
  const renderList = async (items) => {
    const sheetItems = [];
    // console.log("sheetItems", sheetItems);

    const roomMetadata = await OBR.room.getMetadata();
    const settings = roomMetadata?.[`${ID}/settings`] ?? {};
    // const showInspiration = settings?.showInspiration ?? false;
    // console.log("Parsed Settings Object:", settings);
    // console.log("Inspiration", showInspiration);

    for (const item of items) {
      const metadata = item.metadata[`${ID}/metadata`];
      if (metadata) {
        sheetItems.push({
          url: metadata.url,
          character_id: metadata.character_id,
          name: item.text.plainText,
          visible: metadata.visible,
          id: item.id,
          ownerId: item.createdUserId,
          // inspiration: showInspiration,
        });
      }
    }

    const players = await OBR.party.getPlayers();
    const playerIdSet = new Set(players.map((p) => p.id));

    for (const sheetItem of sheetItems) {
      if (playerIdSet.has(sheetItem.ownerId)) {
        //   console.log(
        //     `✅ Owner (feature) enabled for owner: ${sheetItem.ownerId}`
        //   );
        //   sheetItem.featureEnabled = true;
        // } else {
        //   console.log(
        //     `❌ Owner (feature) disabled for owner: ${sheetItem.ownerId}`
        //   );
        sheetItem.featureEnabled = false;
      }
    }

    const sortedItems = sheetItems.sort((a, b) => a.name.localeCompare(b.name));
    const changedItems = [];

    sortedItems.forEach((item) => {
      const cachedItem = cachedItems.find((i) => i.id === item.id);
      if (cachedItem) {
        if (
          item.url !== cachedItem.url ||
          item.character_id !== cachedItem.character_id ||
          item.visible !== cachedItem.visible //||
          // item.inspiration !== cachedItem.inspiration
        ) {
          changedItems.push(item);
          // console.log("Changed Items", changedItems);
        }
      } else {
        changedItems.push(item);
      }
    });

    const ids = sortedItems.map((s) => s.id);
    cachedItems.forEach((cachedItem) => {
      if (!ids.includes(cachedItem.id)) {
        const node = document.querySelector(`[data-id="${cachedItem.id}"]`);
        if (node) node.remove();
      }
    });

    cachedItems = sortedItems;

    const playerRole = await OBR.player.getRole();

    changedItems.forEach((urlItem) => {
      const node = document.querySelector(`[data-id="${urlItem.id}"]`);

      if (node) {
        if (!urlItem.visible && playerRole === "PLAYER") {
          element.removeChild(node);
        }

        // const embed = node.querySelector(".embed");
        // if (embed) {
        //   const inspirationParam = showInspiration ? "true" : "false";
        //   embed.src = `https://lefty469.pythonanywhere.com/character_server?id=${urlItem.character_id}&show_inspiration=${inspirationParam}`;
        //   // console.log("Updated embed URL with inspiration param:", embed.src);
        // }

        const sheetLink = node.querySelector(".sheet-url");
        const newSheetLink = sheetLink.cloneNode(true);
        newSheetLink.addEventListener("click", function () {
          sheetFunction(`${urlItem.url}`);
        });
        sheetLink.parentNode.replaceChild(newSheetLink, sheetLink);
      } else {
        const newNode = document.createElement("li");
        if (playerRole === "GM" || urlItem.visible) {
          newNode.dataset.id = urlItem.id;
          newNode.classList.add("character-container");

          const nameContainer = document.createElement("span");
          nameContainer.textContent = urlItem.name;
          nameContainer.classList.add("name-container");

          const contentContainer = document.createElement("div");
          contentContainer.classList.add("content-container");

          // const portraitContainer = document.createElement("div");
          // portraitContainer.classList.add("character-portrait-container");

          // const portrait = document.createElement("embed");
          // portrait.setAttribute("width", 160);
          // portrait.setAttribute("height", 75);
          // portrait.classList.add("embed");
          // portrait.setAttribute(
          //   "src",
          //   `https://lefty469.pythonanywhere.com/character_server?id=${
          //     urlItem.character_id
          //   }&show_inspiration=${showInspiration ? "true" : "false"}`
          // );
          // portraitContainer.appendChild(portrait);

          const iconContainer = document.createElement("div");
          iconContainer.classList.add("icon-container");

          const editIcon = document.createElement("img");
          editIcon.setAttribute("src", "fa-pen-to-square.svg");
          editIcon.setAttribute(
            "title",
            "Click here to set your notes page (URL)"
          );
          editIcon.setAttribute("width", 10);
          editIcon.setAttribute("height", 10);
          editIcon.addEventListener("click", function () {
            const url = window.prompt(
              "Paste the link to your notebook here, then click the arrow next to your image",
              urlItem.url
            );
            if (url) {
              editSheetFunction(`${urlItem.id}`, url);
            }
          });
          iconContainer.appendChild(editIcon);

          if (playerRole === "GM") {
            const visibilityCheckbox = document.createElement("input");
            visibilityCheckbox.id = urlItem.id;
            visibilityCheckbox.setAttribute("type", "checkbox");
            visibilityCheckbox.setAttribute("title", "Enable Player View");
            if (urlItem.visible) {
              visibilityCheckbox.setAttribute("checked", true);
            }
            visibilityCheckbox.addEventListener("change", function () {
              visibileFunction(urlItem.id);
            });
            iconContainer.appendChild(visibilityCheckbox);
          }

          const linkIcon = document.createElement("img");
          linkIcon.setAttribute("src", "fa-circle-right.svg");
          linkIcon.classList.add("sheet-url");
          linkIcon.setAttribute("title", "View your notes page");
          linkIcon.setAttribute("width", 10);
          linkIcon.setAttribute("height", 10);
          linkIcon.addEventListener("click", function () {
            sheetFunction(`${urlItem.url}`);
          });
          iconContainer.appendChild(linkIcon);

          // contentContainer.appendChild(portraitContainer);
          contentContainer.appendChild(iconContainer);

          newNode.appendChild(nameContainer);
          newNode.appendChild(contentContainer);
          element.appendChild(newNode);
        }
      }
    });
  };

  OBR.scene.items.onChange(renderList);
  OBR.room.onMetadataChange(async (meta) => {
    const settings = meta?.[`${ID}/settings`] ?? {};
    const showInspiration = settings?.showInspiration ?? false;
    // console.log("🌀 Metadata Changed — showInspiration:", showInspiration);
    const items = await OBR.scene.items.getItems();
    renderList(items);
  });
}

export async function visibileFunction(uuid) {
  const vis = document.getElementById(uuid).checked;
  OBR.scene.items.updateItems(
    await OBR.scene.items.getItems([uuid]),
    (items) => {
      for (let item of items) {
        let meta = item.metadata[`${ID}/metadata`];
        meta.visible = vis;
        item.metadata[`${ID}/metadata`] = meta;
      }
    }
  );
}

export function sheetFunction(url) {
  if (url != "") {
    const windowFeatures = "left=100,top=100,width=600,height=800";
    window.open(`${url}`, "mozillaWindow", windowFeatures);
  } else {
    window.confirm(
      "YOU MUST FIRST SET THE URL!!!\nPlease click on the notepad icon to set your page URL"
    );
  }
}

export async function editSheetFunction(uuid, url) {
  OBR.scene.items.updateItems(
    await OBR.scene.items.getItems([uuid]),
    (items) => {
      for (let item of items) {
        let meta = item.metadata[`${ID}/metadata`];
        meta.url = url;
        item.metadata[`${ID}/metadata`] = meta;
      }
    }
  );
}
