import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const DIE_FILE_PATH = "assets/dice/green_marble_dice_set_rpg.glb";

const DIE_STRUCTURE = {
  d4: { parent: "D4_0", body: "Object_4", numbers: "Object_5" },
  d6: { parent: "D6_1", body: "Object_7", numbers: "Object_8" },
  d8: { parent: "D8_2", body: "Object_10", numbers: "Object_11" },
  d10: { parent: "D10_6", body: "Object_22", numbers: "Object_23" },
  d12: { parent: "D12_3", body: "Object_13", numbers: "Object_14" },
  d20: { parent: "D20_4", body: "Object_16", numbers: "Object_17" },
  d100: { parent: "D10_100_5", body: "Object_19", numbers: "Object_20" },
};

let cachedDiceScene = null;

function loadDiceSet() {
  return new Promise((resolve, reject) => {
    if (cachedDiceScene) {
      resolve(cachedDiceScene.clone(true));
      return;
    }

    const loader = new GLTFLoader();
    loader.load(
      DIE_FILE_PATH,
      (gltf) => {
        cachedDiceScene = gltf.scene;
        resolve(cachedDiceScene.clone(true));
      },
      undefined,
      (error) => reject(error)
    );
  });
}

function fixMaterials(mesh) {
  mesh.traverse((child) => {
    if (!child.isMesh) return;

    const materials = Array.isArray(child.material)
      ? child.material
      : [child.material];

    for (let i = 0; i < materials.length; i++) {
      let mat = materials[i];
      if (!mat) continue;

      console.log(`Material debug [${child.name}]:`, mat);

      // Enforce readable encoding and filtering
      if (mat.map) {
        mat.map.encoding = THREE.sRGBEncoding;
        mat.map.minFilter = THREE.LinearFilter;
        mat.map.magFilter = THREE.LinearFilter;
        mat.map.anisotropy = 16;
        mat.map.needsUpdate = true;
      }

      mat.transparent = false;
      mat.opacity = 1.0;
      mat.alphaTest = 0.01;
      mat.depthWrite = true;
      mat.side = THREE.DoubleSide;
      mat.colorWrite = true;

      // Make number materials darker and contrasty
      const isWhiteNumberMat =
        mat.name?.toLowerCase().includes("white") && mat.map === null;

      if (isWhiteNumberMat) {
        console.warn("⚠️ Adjusting number material for contrast:", mat.name);

        mat.color.set(0xffffff); // true white
        mat.emissive.set(0xffffff); // subtle glow to pop edges
        mat.emissiveIntensity = 0.1;
        mat.roughness = 0.5;
        mat.metalness = 0.2;
      } else {
        mat.metalness = 0;
        mat.roughness = 1;
        if ("emissive" in mat) {
          mat.emissive.set(0x000000);
          mat.emissiveIntensity = 0.0;
        }
      }
    }
  });
}

async function createDieFromSet(type) {
  const { parent, body, numbers } = DIE_STRUCTURE[type];
  const scene = await loadDiceSet();

  const parentObj = scene.getObjectByName(parent);
  if (!parentObj)
    throw new Error(`Parent "${parent}" not found for die ${type}`);

  const bodyObj = parentObj.getObjectByName(body);
  const numberObj = parentObj.getObjectByName(numbers);

  if (!bodyObj || !numberObj)
    throw new Error(`Meshes for die ${type} not found`);

  const die = new THREE.Group();
  die.add(bodyObj.clone(true));
  die.add(numberObj.clone(true));

  fixMaterials(die);
  die.scale.set(0.8, 0.8, 0.8);
  return die;
}

export async function createDie(type) {
  if (type === "d100") {
    const tens = await createDieFromSet("d100");
    const ones = await createDieFromSet("d10");

    tens.position.x = -1;
    ones.position.x = 1;
    tens.rotation.z = Math.PI / 2;

    const group = new THREE.Group();
    group.add(tens, ones);
    return group;
  }

  if (!DIE_STRUCTURE[type]) {
    console.warn(`Unknown die type "${type}", defaulting to d6`);
    type = "d6";
  }

  return createDieFromSet(type);
}
