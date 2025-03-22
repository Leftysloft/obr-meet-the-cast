import "./style.css";
import OBR from "@owlbear-rodeo/sdk";
import { setupContextMenu } from "./contextMenu";
import { setupSheetList } from "./sheetList";
import { setupSettings } from "./settings/settings";
import { ID } from "./constants.js";

OBR.onReady(() => {
  document.querySelector("#app").innerHTML = `
    <div>
      <ul id="sheet-list"></ul>
    </div>
  `;

  // //Playing with players data
  // async function showAllPlayerRoles() {
  //   const players = await OBR.party.getPlayers();
  //   const playerLines = players.map((p) => `${p.name}: ${p.role}`);
  //   const message = playerLines.join(" • "); // or use "|", " // ", etc.
  //   OBR.notification.show(message);
  // }

  // showAllPlayerRoles();

  const usageGuide = document.getElementById("usageButton");
  usageGuide.onclick = () => {
    window.open(
      "https://github.com/Leftysloft/obr-meet-the-cast/tree/main#readme",
      "mozillaWindow",
      "left=100,top=100,width=600,height=800"
    );
  };

  const settingsButton = document.getElementById("settingsButton");
  const settingsOverlay = document.getElementById("settings-overlay");
  const backButton = document.getElementById("closeSettings");

  let settingsInitialized = false;

  settingsButton.onclick = () => {
    settingsOverlay.classList.remove("hidden");

    if (!settingsInitialized) {
      settingsInitialized = true;
    }
  };

  backButton.onclick = () => {
    settingsOverlay.classList.add("hidden");
  };

  OBR.room
    .getMetadata()
    .then((metadata) => {
      // Update this line to use the correct path for openActionEnabled
      if (metadata?.[`${ID}/openActionEnabled`]) {
        OBR.action.open();
      }
    })
    .catch((error) => {
      console.error("Error retrieving metadata. Check path.:", error);
    });

  setupContextMenu();
  setupSheetList(document.querySelector("#sheet-list"));
  setupSettings();
});
