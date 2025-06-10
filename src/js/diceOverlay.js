import * as THREE from "three";
import * as CANNON from "cannon-es";
import { createDie } from "./diceFactory.js";

let animationFrame;
let lastTime;
let overlay;
let renderer;
let scene;
let camera;
let world;
let die, dieBody;

// Settling timer variables
let settledTime = 0;
const settleThreshold = 0.3; // seconds to wait before snapping rotation and sleeping

export async function showDiceOverlay() {
  overlay = document.getElementById("dice-overlay");
  if (overlay) {
    console.log("[Overlay] Dice Tray already open, closing it.");
    cleanup();
    return;
  }

  console.log("[Overlay] Opening Dice Tray...");

  overlay = document.createElement("div");
  overlay.id = "dice-overlay";
  Object.assign(overlay.style, {
    position: "fixed",
    bottom: "10px",
    right: "20px",
    width: "400px",
    height: "600px",
    pointerEvents: "auto",
    zIndex: 10000,
    border: "1px dashed red",
    backgroundColor: "rgba(0,0,0,0.4)",
    padding: "5px",
    boxSizing: "border-box",
  });

  const canvas = document.createElement("canvas");
  canvas.id = "dice-canvas";
  canvas.width = 400;
  canvas.height = 600;
  overlay.appendChild(canvas);

  document.body.appendChild(overlay);

  // Create roll button outside the overlay
  const rollButton = document.createElement("button");
  rollButton.id = "roll-dice-button"; // ✅ important for cleanup
  rollButton.textContent = "Roll Dice";
  rollButton.addEventListener("click", rollDie);
  Object.assign(rollButton.style, {
    position: "fixed",
    top: "200px",
    right: "30px",
    zIndex: "10001",
    padding: "10px 20px",
    fontSize: "16px",
    cursor: "pointer",
  });
  document.body.appendChild(rollButton);
  console.log("[Overlay] Roll Dice button created and added to DOM.");

  renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
  renderer.setSize(400, 600);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setClearColor(0x000000, 0);

  scene = new THREE.Scene();
  const aspect = canvas.width / canvas.height;
  camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
  camera.position.set(0, 0, 4.5);
  camera.lookAt(0, 0, 0);

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1.4);
  directionalLight.position.set(3, 3, 3);
  scene.add(ambientLight, directionalLight);

  setupPhysics();

  try {
    die = await createDie("d20");
  } catch (err) {
    console.error("[Overlay] Failed to load dice model:", err);
    cleanup();
    return;
  }

  die.traverse?.((child) => {
    if (child.isMesh) {
      child.scale.set(0.5, 0.5, 0.5);
      child.material.transparent = false;
      child.material.opacity = 1.0;
    }
  });

  scene.add(die);

  const dieShape = new CANNON.Box(new CANNON.Vec3(0.25, 0.25, 0.25));
  const startX = 0;
  const startY = 0;
  const depth = 6.0;
  const startZ = -depth / 4;

  dieBody = new CANNON.Body({
    mass: 1,
    shape: dieShape,
    position: new CANNON.Vec3(startX, startY, startZ),
    material:
      world.materials?.find((m) => m.name === "dieMaterial") ||
      new CANNON.Material("dieMaterial"),
  });

  dieBody.linearDamping = 0.4;
  dieBody.angularDamping = 0.4;
  dieBody.velocity.set(0, 0, 0);
  dieBody.angularVelocity.set(0, 0, 0);
  dieBody.quaternion.set(0, 0, 0, 1);

  world.addBody(dieBody);

  animate();
}

function setupPhysics() {
  world = new CANNON.World();
  world.gravity.set(0, 0, -9.82);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 10;

  const floorMaterial = new CANNON.Material("floorMaterial");
  const dieMaterial = new CANNON.Material("dieMaterial");

  const floorDieContactMaterial = new CANNON.ContactMaterial(
    floorMaterial,
    dieMaterial,
    { friction: 0.5, restitution: 0.7 }
  );
  world.addContactMaterial(floorDieContactMaterial);

  const wallMaterial = floorMaterial;
  const depth = 6.0;
  const boxWidth = 2.4;
  const boxHeight = 3.8;
  const wallThickness = 0.2;

  const bounds = [
    {
      pos: [-boxWidth / 2, 0, 0],
      size: [wallThickness, boxHeight / 2, depth / 2],
      rot: [0, 0, 0],
    },
    {
      pos: [boxWidth / 2, 0, 0],
      size: [wallThickness, boxHeight / 2, depth / 2],
      rot: [0, 0, 0],
    },
    {
      pos: [0, -boxHeight / 2, 0],
      size: [boxWidth / 2, wallThickness, depth / 2],
      rot: [0, 0, 0],
    },
    {
      pos: [0, boxHeight / 2, 0],
      size: [boxWidth / 2, wallThickness, depth / 2],
      rot: [0, 0, 0],
    },
    {
      pos: [0, 0, -depth / 2],
      size: [boxWidth / 2, boxHeight / 2, wallThickness],
      rot: [0, 0, 0],
    },
    {
      pos: [0, 0, depth / 2],
      size: [boxWidth / 2, boxHeight / 2, wallThickness],
      rot: [0, 0, 0],
    },
  ];

  for (const { pos, size, rot } of bounds) {
    const shape = new CANNON.Box(new CANNON.Vec3(...size));
    const body = new CANNON.Body({
      mass: 0,
      material: wallMaterial,
      shape,
      position: new CANNON.Vec3(...pos),
    });
    body.quaternion.setFromEuler(...rot);
    world.addBody(body);
  }
}

function animate() {
  animationFrame = requestAnimationFrame(animate);
  const time = performance.now() / 1000;
  const delta = lastTime ? time - lastTime : 1 / 60;
  lastTime = time;

  if (!dieBody) return;

  world.step(1 / 60, delta, 3);

  const velocityMag = dieBody.velocity.length();
  const angularVelocityMag = dieBody.angularVelocity.length();

  if (velocityMag < 0.05 && angularVelocityMag < 0.05) {
    settledTime += delta;
    if (settledTime > settleThreshold) {
      dieBody.sleep(); // Only sleep, no snapping
    }
  } else {
    settledTime = 0;
    if (dieBody.sleepState === CANNON.Body.SLEEPING) {
      dieBody.wakeUp();
    }
  }

  die.position.copy(dieBody.position);
  die.quaternion.copy(dieBody.quaternion);

  renderer.render(scene, camera);
}

function rollDie() {
  if (!dieBody) return;

  dieBody.wakeUp();
  settledTime = 0;

  const boxWidth = 2.4;
  const boxHeight = 3.8;
  const depth = 6.0;

  dieBody.position.set(
    (Math.random() - 0.5) * boxWidth,
    (Math.random() - 0.5) * boxHeight,
    -depth / 4
  );

  dieBody.velocity.set(
    (Math.random() - 0.5) * 20,
    (Math.random() - 0.5) * 20,
    6 + Math.random() * 20
  );
  dieBody.angularVelocity.set(
    (Math.random() - 0.5) * 30,
    (Math.random() - 0.5) * 30,
    (Math.random() - 0.5) * 30
  );

  dieBody.quaternion.set(0, 0, 0, 1);
}

function cleanup() {
  console.log("[Overlay] Cleaning up...");
  cancelAnimationFrame(animationFrame);

  if (overlay && document.body.contains(overlay)) {
    document.body.removeChild(overlay);
  }

  // ✅ REMOVE ROLL DICE BUTTON
  const rollButton = document.getElementById("roll-dice-button");
  if (rollButton && document.body.contains(rollButton)) {
    console.log("[Cleanup] Removing Roll Dice button.");
    document.body.removeChild(rollButton);
  } else {
    console.warn("[Cleanup] Roll Dice button not found.");
  }

  animationFrame = null;
  lastTime = null;
  die = null;
  dieBody = null;
  renderer = null;
  scene = null;
  camera = null;
  world = null;
  settledTime = 0;
}
