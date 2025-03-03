import OBR from "@owlbear-rodeo/sdk";
import { ID } from "./constants";

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
        const character_id = window.prompt(
          "Enter ONLY the character <id> number from DnDBeyond.\nNOTE: This requires the DnDBeyond character sheet to have an image set."
        );
        if (character_id >= 0 + !null)
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
        OBR.scene.items.updateItems(context.items, (items) => {
          for (let item of items) {
            delete item.metadata[`${ID}/metadata`];
          }
        });
      }
    },
  });
}
