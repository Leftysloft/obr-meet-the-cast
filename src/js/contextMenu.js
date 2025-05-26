import OBR from "@owlbear-rodeo/sdk";
import { ID } from "./constants.js";

export async function setupContextMenu() {
  if ((await OBR.player.getRole()) != "GM") {
    return;
  }

  // Creates the icon in the context menu, limited to CHARACTER layer.
  OBR.contextMenu.create({
    id: `${ID}/context-menu`,
    icons: [
      {
        icon: "/fa-circle-check.svg",
        label: "Add To Character Sheet",
        filter: {
          every: [
            { key: "layer", value: "CHARACTER" },
            { key: ["metadata", `${ID}/metadata`], value: undefined },
          ],
        },
      },
      {
        icon: "/fa-circle-xmark.svg",
        label: "Remove From Character Sheet",
        filter: {
          every: [{ key: "layer", value: "CHARACTER" }],
        },
      },
    ],
    onClick(context) {
      const addToURLS = context.items.every(
        (item) => item.metadata[`${ID}/metadata`] === undefined
      );

      if (addToURLS) {
        let userInput = window.prompt(
          "Enter your D&D Beyond character ID or full URL (e.g., https://www.dndbeyond.com/characters/########)."
        );

        // Extract character ID using regex
        const match = userInput?.match(/(\d+)(?!.*\d)/); // grabs last group of digits
        const character_id = match ? match[1] : null;

        if (character_id) {
          OBR.scene.items.updateItems(context.items, (items) => {
            for (let item of items) {
              item.metadata[`${ID}/metadata`] = {
                character_id: character_id,
                url: "",
                visible: false,
              };
            }
          });
        } else {
          window.alert(
            "Invalid input. Please enter a valid character ID or URL."
          );
        }
      } else {
        OBR.scene.items.updateItems(context.items, (items) => {
          for (let item of items) {
            delete item.metadata[`${ID}/metadata`];
          }
        });
      }
    },
  });
}
