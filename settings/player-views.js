console.log("Get Items", OBR.scene.items.getItems());
console.log("Get User ID", OBR.party.getPlayers());
OBR.party.getPlayers().then((players) => {
  console.log("Get All Users", players);
});
OBR.player.getId().then((id) => {
  console.log("This tab's Player ID", id);
});
OBR.party.getPlayers().then((players) => {
  const playerInfo = players.map((p) => `${p.name} (${p.id})`);
  console.log("Players:", playerInfo.join(" | "));
});

Promise.all([
  OBR.player.getId(),
  OBR.player.getName(),
  OBR.party.getPlayers(),
]).then(([myId, myName, players]) => {
  const allPlayers = [...players, { id: myId, name: myName }];
  const playerInfo = allPlayers.map((p) => `${p.name} (${p.id})`);
  console.log("Players (including me):", playerInfo.join(" | "));
});
Promise.all([
  OBR.player.getId(),
  OBR.player.getName(),
  OBR.party.getPlayers(),
]).then(([myId, myName, players]) => {
  const allPlayers = [
    ...players.map((p) => ({ name: p.name, id: p.id })),
    { name: myName, id: myId },
  ];
  console.log("All Players as Objects:", allPlayers);
});
