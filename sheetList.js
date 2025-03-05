import OBR from "@owlbear-rodeo/sdk";
import { ID } from "./constants";
import "./style.css";

let cachedItems = [];

export async function setupSheetList(element) {
  const renderList = async (items) => {
    const sheetItems = [];

    for (const item of items) {
      const metadata = item.metadata[`${ID}/metadata`];
      if (metadata) {
        sheetItems.push({
          url: metadata.url,
          character_id: metadata.character_id,
          name: item.text.plainText,
          visible: metadata.visible,
          id: item.id,
        });
      }
    }

    // Sort alphabetically
    const sortedItems = sheetItems.sort((a, b) => a.name.localeCompare(b.name));
    const changedItems = [];

    sortedItems.forEach((item) => {
      const cachedItem = cachedItems.find((i) => i.id === item.id);
      if (cachedItem) {
        if (
          item.url !== cachedItem.url ||
          item.character_id !== cachedItem.character_id ||
          item.visible !== cachedItem.visible
        ) {
          changedItems.push(item);
        }
      } else {
        changedItems.push(item);
      }
    });

    // Remove nodes that are no longer in the sortedItems Array
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
        if (!urlItem.visible) {
          if (playerRole === "PLAYER") {
            element.removeChild(node);
          }
        }

        const embed = node.querySelector(".embed-view");
        if (embed) {
          embed.src =
            "http://lefty469.pythonanywere.com/character_server?id=" + urlItem.character_id;
        }

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

          // Name container
          const nameContainer = document.createElement("span");
          nameContainer.textContent = urlItem.name;
          nameContainer.classList.add("name-container");

          // Create a new container to hold both portrait and icons
          const contentContainer = document.createElement("div");
          contentContainer.classList.add("content-container");

          // Character portrait
          const portraitContainer = document.createElement("div");
          portraitContainer.classList.add("character-portrait-container");

          const portrait = document.createElement("embed");
          portrait.setAttribute("width", 160);
          portrait.setAttribute("height", 75);
          // portrait.classList.add("embed-view");
          portrait.setAttribute(
            "src",
            "http://lefty469/pythonanywhere.com:5000/character_server?id=" + urlItem.character_id
          );
          portraitContainer.appendChild(portrait);

          // Icon container
          const iconContainer = document.createElement("div");
          iconContainer.classList.add("icon-container");

          // Edit Icon
          const editIcon = document.createElement("img");
          editIcon.setAttribute("src", "fa-pen-to-square.svg");
          editIcon.setAttribute(
            "title",
            "Click here to set your notes page (URL)"
          );
          editIcon.setAttribute("width", 15);
          editIcon.setAttribute("height", 15);
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
            // Visibility Checkbox
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

          // Link Icon
          const linkIcon = document.createElement("img");
          linkIcon.setAttribute("src", "fa-circle-right.svg");
          linkIcon.classList.add("sheet-url");
          linkIcon.setAttribute("title", "View your notes page");
          linkIcon.setAttribute("width", 15);
          linkIcon.setAttribute("height", 15);
          linkIcon.addEventListener("click", function () {
            sheetFunction(`${urlItem.url}`);
          });
          iconContainer.appendChild(linkIcon);

          // Append portrait and icons to the content container
          contentContainer.appendChild(portraitContainer);
          contentContainer.appendChild(iconContainer);

          // Append elements in proper order
          newNode.appendChild(nameContainer);
          newNode.appendChild(contentContainer);
          element.appendChild(newNode);
        }
      }
    });
  };
  OBR.scene.items.onChange(renderList);
}
