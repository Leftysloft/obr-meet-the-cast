import OBR from "@owlbear-rodeo/sdk";

export function showRollPopover(label, content, name = "Unknown") {
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
