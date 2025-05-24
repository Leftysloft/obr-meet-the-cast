import OBR from "@owlbear-rodeo/sdk";
import { ID } from "./constants.js";

export function setupLightSheetList(container) {
  if (!container) return;

  // Clear existing content
  container.innerHTML = "<h4>Sheet Metadata (Extras)</h4>";

  const list = document.createElement("ul");
  list.id = "light-sheet-list";
  container.appendChild(list);

  OBR.scene.items.getItems().then((items) => {
    const filtered = items
      .map((item) => {
        const metadata = item.metadata?.[`${ID}/metadata`] || {};
        return {
          url: metadata.url,
          character_id: metadata.character_id,
          visible: metadata.visible,
          id: item.id,
          ownerId: item.createdUserId,
        };
      })
      .filter((entry) => entry.character_id); // Only entries with character_id

    filtered.forEach((entry) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div><strong>ID:</strong> ${entry.id}</div>
        <div><strong>Character ID:</strong> ${entry.character_id}</div>
        <div><strong>Owner:</strong> ${entry.ownerId}</div>
        <div><strong>Visible:</strong> ${entry.visible}</div>
        <div><a href="${entry.url}" target="_blank">Character Sheet</a></div>
        <hr />
      `;
      list.appendChild(li);
    });
  });
}
