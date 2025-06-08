//diceRenderer.js
import { createDie } from "./diceFactory.js";
import * as THREE from "three";

export async function launchDiceOverlay() {
  if (document.getElementById("dice-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "dice-overlay";
  Object.assign(overlay.style, {
    position: "fixed",
    top: "20px",
    right: "20px",
    width: "250px",
    height: "250px",
    pointerEvents: "none",
    zIndex: 10000,
  });

  const canvas = document.createElement("canvas");
  canvas.id = "dice-canvas";
  canvas.width = 250;
  canvas.height = 250;
  overlay.appendChild(canvas);
  document.body.appendChild(overlay);

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  camera.position.z = 50;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setSize(250, 250);
  renderer.setPixelRatio(window.devicePixelRatio);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(1, 1, 1).normalize();
  scene.add(light);

  const die = await createDie("d20");

  // Scale all meshes inside the die model explicitly
  die.traverse((child) => {
    if (child.isMesh) {
      child.scale.set(0.005, 0.005, 0.005);
    }
  });

  scene.add(die);

  function animate() {
    requestAnimationFrame(animate);
    die.rotation.x += 0.01;
    die.rotation.y += 0.01;
    renderer.render(scene, camera);
  }
  animate();

  setTimeout(() => {
    if (document.body.contains(overlay)) {
      document.body.removeChild(overlay);
    }
  }, 3000);
}
