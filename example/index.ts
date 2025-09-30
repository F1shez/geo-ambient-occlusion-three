import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { vertexBake } from "../src/index";
import { Object3D } from "three";

document.body.style.margin = "0";
document.body.style.padding = "0";
document.body.style.overflow = "hidden";
document.body.style.height = "100vh";
document.body.style.width = "100vw";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(2, 2, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0xffffff);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const light = new THREE.HemisphereLight(0xffffff, 0xaaaaaa, 2.5);
scene.add(light);

const loader = new GLTFLoader();
loader.load(
  "./scene.glb",
  (gltf) => {
    scene.add(gltf.scene);
    setTimeout(() => {
      vertexBake(scene);
    }, 1000);
    scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const material = (obj as THREE.Mesh).material;
        if (!Array.isArray(material)) material.vertexColors = true;
      }
    });
  },
  undefined,
  (err) => {
    console.error("Error loading GLTF", err);
  }
);

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});