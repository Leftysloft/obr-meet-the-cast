import OBR from "@owlbear-rodeo/sdk";
import { ID } from "./constants";
import "./style.css";

export async function setupSheetList(element) {
  const renderList = async (items) => {
    // Get the url of any item with
    // our gsheet metadata
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

    // Create new list nodes for each url item
    const nodes = [];
    for (const urlItem of sortedItems) {
      const playerRole = await OBR.player.getRole();
      if (!urlItem.visible) {
        // console.log('vis undefined');
        urlItem.visible = false;
      }

      // console.log('role-vis:'+playerRole+"-"+urlItem.visible);
      if (playerRole == "GM" || urlItem.visible) {
        const node = document.createElement("ul");
        node.textContent = `${urlItem.name}`;
        //        console.log(urlItem.id);

        const anode = document.createElement("character-portrait");

        //  Display a character in an iframe (works?)
        const fnode = document.createElement("embed");
        fnode.setAttribute("width", 75);
        fnode.setAttribute("height", 75);
        fnode.setAttribute(
          "src",
          "https://lefty469.pythonanywhere.com/character_server?id=" +
            urlItem.character_id
        );
        anode.appendChild(fnode);

        //TODO TRY TO CREAT A SUBNODE FOR ICONS
        const bnode = document.createElement("icon");

        const enode = document.createElement("img");
        enode.setAttribute("src", "fa-pen-to-square.svg");
        enode.setAttribute("title", "Click here to set your notes page (URL)");
        enode.setAttribute("width", 20);
        enode.setAttribute("height", 30);
        enode.addEventListener("click", function () {
          const url = window.prompt(
            "Paste the link to your notebook here, then click the arrow next to your image",
            urlItem.url
          );
          if (url) {
            editSheetFunction(`${urlItem.id}`, url);
          }
        });
        bnode.appendChild(enode);

        if (playerRole == "GM") {
          // Creates checkbox for player visibility
          const cnode = document.createElement("input");
          cnode.id = urlItem.id;
          cnode.setAttribute("type", "checkbox");
          cnode.setAttribute("title", "Enable Player View");
          if (urlItem.visible) {
            cnode.setAttribute("checked", true);
          }
          cnode.addEventListener("change", function () {
            visibileFunction(urlItem.id);
          });
          bnode.appendChild(cnode);
        }

        // Creates image for link to url page
        const inode = document.createElement("img");
        inode.setAttribute("src", "fa-circle-right.svg");
        inode.setAttribute("title", "View your notes page");
        inode.setAttribute("width", 20);
        inode.setAttribute("height", 30);
        inode.addEventListener("click", function () {
          sheetFunction(`${urlItem.url}`);
        });
        bnode.appendChild(inode);

        anode.appendChild(bnode);

        node.appendChild(anode);
        nodes.push(node);
      }
    }

    element.replaceChildren(...nodes);
  };
  OBR.scene.items.onChange(renderList);
}

// Set link (circle right) visible to players
export async function visibileFunction(uuid) {
  const vis = document.getElementById(uuid).checked;
  console.log("uuid", uuid);
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

//opens character's notebook
export function sheetFunction(url) {
  if (url != "") {
    console.log("sheetfunction", url);
    const windowFeatures = "left=100,top=100,width=600,height=800";
    window.open(`${url}`, "mozillaWindow", windowFeatures);
  } else {
    window.confirm(
      "YOU MUST FIRST SET THE URL!!!\nPlease click on the notepad icon to set your page URL"
    );
  }
}
// Edit sheet url
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
