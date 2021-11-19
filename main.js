import * as THREE from "https://cdn.skypack.dev/three@0.132.2/build/three.module.js";
import VRControl from "./VRControl.js";

import { OrbitControls } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/controls/OrbitControls.js";
import { DRACOLoader } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/GLTFLoader.js";
import { VRButton } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/webxr/VRButton.js";
import ThreeMeshUI from "https://cdn.skypack.dev/three-mesh-ui";

let camera,
  scene,
  renderer,
  dolly,
  controls,
  vrControl,
  isMoving = false,
  model;

// rerender the scene according to the refresh rate of machine.
const animate = () => {
  renderer.setAnimationLoop(function () {
    ThreeMeshUI.update();
    renderer.render(scene, camera);
  });
};

init();

function makeTextPanel() {
  const container = new ThreeMeshUI.Block({ // empty block
    width: 1.2,
    height: 0.5,
    padding: 0.05,
    justifyContent: "center",
    alignContent: "left",
    fontFamily:
      "https://unpkg.com/three-mesh-ui/examples/assets/Roboto-msdf.json",
    fontTexture:
      "https://unpkg.com/three-mesh-ui/examples/assets/Roboto-msdf.png",
  });

  container.position.set(0, 2, -2);
  container.rotation.x = -0.3;
  scene.add(container);

  container.add(
    new ThreeMeshUI.Text({
      content: "Please Take off your shoes.",
      fontSize: 0.099,
    }),
  );
}

// add a function to keep moving the camera in the direction it is facing
function moveCamera() {
  if (!isMoving) return;
  const direction = new THREE.Vector3(); // empty direction
  camera.getWorldDirection(direction);  // gives the direction which camera is viewing
  dolly.position.add(direction.multiplyScalar(0.1));
}

function init() {
  scene = new THREE.Scene(); // blank scene
  scene.background = new THREE.Color(0xa0a0a0);  // background color is set
  camera = new THREE.PerspectiveCamera( // fov , aspect ratio, near , far
    35,
    window.innerWidth / window.innerHeight,
    1,
    500
  );
  camera.name = "camera"; // camera name
  camera.position.set(0, 40, 0); // camera position
  scene.add(camera); // camera is inserted in scene


  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444); // one of the form of light (sky color, ground color)
  hemiLight.position.set(0, 100, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff); // directional light
  dirLight.position.set(-0, 40, 50);
  dirLight.castShadow = true; // for making shadow
  dirLight.shadow.camera.top = 50;
  dirLight.shadow.camera.bottom = -25;
  dirLight.shadow.camera.left = -25;
  dirLight.shadow.camera.right = 25;
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.far = 200;
  dirLight.shadow.mapSize.set(1024, 1024);
  scene.add(dirLight);

  const dracoLoader = new DRACOLoader(); // loader that is supposed to be pass to gltf loader
  dracoLoader.setDecoderPath(  // source code of loader
    `https://cdn.skypack.dev/three@0.134.0/examples/js/libs/draco/gltf/`
  );

  const loader = new GLTFLoader(); // that load the model
  loader.setDRACOLoader(dracoLoader);

  loader.load("temple.glb", function (gltf) { // file name
    model = gltf.scene.children[0];
    model.name = "model";
    model.scale.set(0.01, 0.01, 0.01); // scale {sx,sy,sz}
    model.position.set(-20, 0, -10); // model position
    scene.add(model);
  });

  document.addEventListener("keydown", onKeyDown, false);
  function onKeyDown(event) {
    switch (event.keyCode) {
      case 37: // left
        dolly.position.x -= 1;
        break;
      case 38: // up
        dolly.position.z -= 1;
        break;
      case 39: // right
        dolly.position.x += 1;
        break;
      case 40: // down
        dolly.position.z += 1;
        break;
    }
  }

  const ground = new THREE.Mesh( // ground
    new THREE.PlaneGeometry(1000, 1000), // plane geometry
    new THREE.MeshPhongMaterial({ color: 0x00ff00, depthWrite: false }) // meshphongmaterial
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = 11;
  ground.receiveShadow = true;
  scene.add(ground);

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.xr.enabled = true; // vr is enabled in project
  document.body.appendChild(VRButton.createButton(renderer)); // vr button
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement); // drag and panning
  controls.addEventListener("change", () => {
    ThreeMeshUI.update();
    renderer.render(scene, camera);
  });
  controls.target.set(0, 20, 0);
  controls.update();

  // vrcontrol button
  vrControl = VRControl(renderer, camera, scene);
  scene.add(vrControl.controllerGrips[0], vrControl.controllers[0]);

  vrControl.controllers[0].addEventListener("selectstart", () => {
    isMoving = true;
  });
  vrControl.controllers[0].addEventListener("selectend", () => {
    isMoving = false;
  });

  // This helps move the camera
  dolly = new THREE.Group();
  dolly.position.set(0, 0, 0);
  dolly.name = "dolly";
  scene.add(dolly);
  dolly.add(camera);

  setInterval(moveCamera, 100); // every 100 milisecond

  window.addEventListener("resize", onWindowResize);

  makeTextPanel(); // makes text panel
  animate();
}

// change aspect ration according to window size
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

  ThreeMeshUI.update();
  renderer.render(scene, camera);
}
