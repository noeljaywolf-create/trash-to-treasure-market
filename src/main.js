import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { buildEcosystem } from './ecosystem.js';
import { createMarketPerson } from './market-assets.js';
import './style.css';

const mount = document.querySelector('#world');
const scene = new THREE.Scene();
scene.background = new THREE.Color('#d7c8aa');
scene.fog = new THREE.Fog('#d7c8aa', 120, 245);

const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 280);
const isMobileViewport = innerWidth <= 600;
const overviewTarget = isMobileViewport ? new THREE.Vector3(0, 1.1, 0) : new THREE.Vector3(0, 0, -13);
const initialCamera = isMobileViewport ? new THREE.Vector3(24, 21, 32) : new THREE.Vector3(45, 74, 78);
camera.position.copy(initialCamera);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.14;
mount.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.copy(innerWidth <= 600 ? new THREE.Vector3(0, 1.1, 0) : overviewTarget);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.minDistance = 13;
controls.maxDistance = 190;
controls.maxPolarAngle = Math.PI * 0.47;
controls.minPolarAngle = Math.PI * 0.2;
controls.panSpeed = 0.7;
controls.rotateSpeed = 0.48;

scene.add(new THREE.HemisphereLight('#fff0d5', '#63715b', 2.15));
const sun = new THREE.DirectionalLight('#fff0d4', 3.2);
sun.position.set(-14, 28, 17);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.left = -28;
sun.shadow.camera.right = 70;
sun.shadow.camera.top = 64;
sun.shadow.camera.bottom = -64;
sun.shadow.camera.left = -70;
sun.shadow.normalBias = 0.035;
scene.add(sun);
const fill = new THREE.DirectionalLight('#d4dfd1', 0.7);
fill.position.set(13, 12, -16);
scene.add(fill);

const mats = {};
const mat = (name, color, roughness = 0.86, metalness = 0) => {
  if (!mats[name]) mats[name] = new THREE.MeshStandardMaterial({ color, roughness, metalness });
  return mats[name];
};
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const cylGeo = (radiusTop, radiusBottom, height, segments = 12) => new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments);

function box(parent, name, size, position, material, options = {}) {
  const mesh = new THREE.Mesh(boxGeo, material);
  mesh.name = name;
  mesh.scale.set(...size);
  mesh.position.set(...position);
  mesh.castShadow = options.castShadow ?? true;
  mesh.receiveShadow = options.receiveShadow ?? true;
  if (options.rotation) mesh.rotation.set(...options.rotation);
  if (options.userData) Object.assign(mesh.userData, options.userData);
  parent.add(mesh);
  return mesh;
}
function cylinder(parent, name, radiusTop, radiusBottom, height, position, material, segments = 12, rotation = null) {
  const mesh = new THREE.Mesh(cylGeo(radiusTop, radiusBottom, height, segments), material);
  mesh.name = name;
  mesh.position.set(...position);
  if (rotation) mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function sphere(parent, name, radius, position, material, scale = [1, 1, 1], segments = 14) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, segments, Math.max(8, segments - 3)), material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

const ground = new THREE.Mesh(new THREE.PlaneGeometry(110, 110), mat('earth', '#b5a789'));
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.13;
ground.receiveShadow = true;
scene.add(ground);

function makePavers() {
  const stoneColors = ['#b9ad91', '#c4b79a', '#a89d83', '#d0c3a5', '#b1a68b'];
  const pavers = stoneColors.map(() => []);
  for (let z = -13; z < 12.9; z += 1.15) {
    const offset = (Math.round(z * 10) % 2) * 0.52;
    for (let x = -17; x < 17; x += 1.05) {
      const colorIndex = (Math.round(x * 3 + z * 7) % stoneColors.length + stoneColors.length) % stoneColors.length;
      pavers[colorIndex].push([x + offset + (Math.random() - 0.5) * 0.04, z + (Math.random() - 0.5) * 0.04]);
    }
  }
  const transform = new THREE.Object3D();
  pavers.forEach((tiles, index) => {
    const instances = new THREE.InstancedMesh(boxGeo, mat(`paver-${stoneColors[index]}`, stoneColors[index]), tiles.length);
    instances.name = 'sun-worn paving';
    instances.receiveShadow = true;
    instances.castShadow = false;
    tiles.forEach(([x, z], tileIndex) => {
      transform.position.set(x, -0.04, z);
      transform.scale.set(1.01, 0.08, 1.1);
      transform.updateMatrix();
      instances.setMatrixAt(tileIndex, transform.matrix);
    });
    instances.instanceMatrix.needsUpdate = true;
    scene.add(instances);
  });
}
makePavers();

const brandTexture = (title, subtitle, bg, fg = '#f6edce') => {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 140;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 512, 140);
  ctx.fillStyle = 'rgba(255,255,255,.13)';
  ctx.fillRect(0, 0, 14, 140);
  ctx.fillRect(498, 0, 14, 140);
  ctx.fillStyle = fg;
  ctx.font = '600 45px Georgia';
  ctx.textAlign = 'center';
  ctx.fillText(title, 256, 69);
  ctx.font = '18px monospace';
  ctx.fillStyle = 'rgba(255,255,255,.78)';
  ctx.fillText(subtitle, 256, 108);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: texture, roughness: 0.7 });
};

const wovenPattern = (() => {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#9b543c';
  ctx.fillRect(0, 0, 128, 128);
  for (let y = 0; y < 128; y += 16) {
    for (let x = 0; x < 128; x += 16) {
      ctx.fillStyle = (x + y) % 32 === 0 ? '#dda64f' : '#273f32';
      ctx.beginPath();
      ctx.moveTo(x + 8, y + 1); ctx.lineTo(x + 15, y + 8); ctx.lineTo(x + 8, y + 15); ctx.lineTo(x + 1, y + 8); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(246,224,166,.55)';
      ctx.fillRect(x + 7, y + 5, 2, 6);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return new THREE.MeshStandardMaterial({ map: texture, roughness: 0.95 });
})();

function sign(parent, title, subtitle, color, position, size = [4.1, 0.84]) {
  const board = box(parent, `${title} sign`, [size[0], size[1], 0.12], position, mat(`${title}-signboard`, color));
  const face = new THREE.Mesh(new THREE.PlaneGeometry(size[0] - 0.1, size[1] - 0.1), brandTexture(title, subtitle, color));
  face.position.set(position[0], position[1], position[2] + 0.067);
  parent.add(face);
  return board;
}

const interactiveTargets = [];
const hitMaterial = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false });
const people = [];

function registerVendor(position, shirt, skin, rotation = 0, apron = false) {
  const person = makePerson({ shirt, pants: '#493b34', skin, hair: '#241d19', apron });
  person.group.position.set(position[0], 0, position[1]);
  person.group.rotation.y = rotation;
  scene.add(person.group);
  people.push({
    ...person, path: [], speed: 0, phase: Math.random() * Math.PI * 2,
    role: 'vendor', pauseUntil: 0, cycle: null
  });
  return person.group;
}

function makeContainerShop(x, title, subtitle, bodyColor, accentColor, products, index) {
  const root = new THREE.Group();
  root.position.set(x, 0, -7.2);
  root.userData = { kind: 'shop', title, description: `${subtitle} · A repurposed shipping container, opened to the market.` };
  scene.add(root);
  const width = 8.8, height = 3.15, depth = 3.2, front = depth / 2;
  const hitArea = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), hitMaterial);
  hitArea.position.y = height / 2;
  hitArea.userData = root.userData;
  root.add(hitArea);
  interactiveTargets.push(hitArea);
  const metal = mat(`${title}-metal`, bodyColor, 0.75, 0.12);
  const dark = mat('container-shadow', '#25302a');
  const inner = mat('shop-interior', '#39382e');
  // The wall panels remain visible above, below and beside the serving window.
  box(root, 'container rear wall', [width, height, 0.14], [0, 1.65, -front], metal);
  box(root, 'container front sill', [width, 0.58, 0.16], [0, 0.31, front], metal);
  box(root, 'container front header', [width, 0.55, 0.16], [0, 2.94, front], metal);
  box(root, 'container front left panel', [2.28, 2.08, 0.16], [-3.26, 1.63, front], metal);
  box(root, 'container front right panel', [2.28, 2.08, 0.16], [3.26, 1.63, front], metal);
  box(root, 'container side left', [0.14, height, depth], [-width / 2, 1.65, 0], metal);
  box(root, 'container side right', [0.14, height, depth], [width / 2, 1.65, 0], metal);
  box(root, 'container roof', [width, 0.18, depth], [0, 3.25, 0], mat(`${title}-roof`, '#65645a', 0.68, 0.25));
  box(root, 'serving window shadow', [4.42, 2.02, 0.09], [0, 1.62, front - 0.03], dark, { castShadow: false });
  box(root, 'window interior', [4.1, 1.79, 0.06], [0, 1.62, front + 0.025], inner, { castShadow: false });
  box(root, 'counter ledge', [4.75, 0.13, 0.72], [0, 1.04, front + 0.25], mat('counter-wood', '#79513a', 0.76));
  box(root, 'counter face', [4.48, 0.76, 0.16], [0, 0.64, front + 0.56], mat('counter-front', '#5f4935'));
  box(root, 'counter inset', [4.0, 0.52, 0.035], [0, 0.65, front + 0.65], mat('counter-detail', accentColor));
  for (let t = -3; t <= 3; t++) {
    box(root, 'container corrugation', [0.12, 0.17, 0.1], [t * 1.1, 3.22, front], mat(`ridge-${bodyColor}`, bodyColor, 0.7, 0.18), { castShadow: false });
  }
  for (const z of [-1.25, -0.85, -0.45, -0.05, 0.35, 0.75, 1.15]) {
    box(root, 'corrugated side rib', [0.11, 3.05, 0.12], [-width / 2 - 0.03, 1.63, z], mat(`ridge-${bodyColor}`, bodyColor, 0.72, 0.22), { castShadow: false });
    box(root, 'corrugated side rib', [0.11, 3.05, 0.12], [width / 2 + 0.03, 1.63, z], mat(`ridge-${bodyColor}`, bodyColor, 0.72, 0.22), { castShadow: false });
  }
  for (let xrib = -4.15; xrib <= 4.16; xrib += 0.32) {
    if (Math.abs(xrib) < 2.24) continue;
    box(root, 'front corrugation', [0.105, 2.04, 0.05], [xrib, 1.63, front + 0.095], mat(`ridge-${bodyColor}`, bodyColor, 0.7, 0.18), { castShadow: false });
  }
  // Corner castings, locking bars and weathered lower rail sell the container form.
  for (const side of [-1, 1]) {
    box(root, 'corner post', [0.22, 3.18, 0.2], [side * 4.28, 1.63, front + 0.03], mat('corner-steel', '#8d8977', 0.7, 0.35));
    box(root, 'door locking bar', [0.07, 2.44, 0.08], [side * 4.03, 1.69, -front - 0.1], mat('door-bar', '#a5a18e', 0.52, 0.67));
  }
  box(root, 'container base rail', [8.9, 0.17, 3.28], [0, 0.09, 0], mat('steel-base', '#595a51', 0.72, 0.3));
  sign(root, title, subtitle, accentColor, [0, 2.56, front + 0.17], [4.2, 0.68]);
  // Awning with a slight pitch and alternating cloth panels.
  const awning = new THREE.Group();
  awning.position.set(0, 2.08, front + 0.2);
  awning.rotation.x = -0.12;
  root.add(awning);
  box(awning, 'awning canopy', [5.2, 0.11, 1.06], [0, 0, 0.45], mat(`${title}-awning`, accentColor));
  for (let stripe = -2; stripe <= 2; stripe++) {
    box(awning, 'awning stripe', [0.48, 0.12, 1.07], [stripe * 1.04, 0.008, 0.45], mat(`awning-cream-${index}`, stripe % 2 ? '#f0d9a8' : accentColor), { castShadow: false });
    box(awning, 'awning valance', [0.49, 0.23, 0.09], [stripe * 1.04, -0.12, 0.95], mat(`awning-cream-${index}`, stripe % 2 ? '#f0d9a8' : accentColor), { castShadow: false });
  }
  // Shop shelves and stock are visible through the open serving hatch.
  for (let shelf = 0; shelf < 2; shelf++) {
    box(root, 'interior shelf', [3.8, 0.07, 0.42], [0, 1.62 + shelf * 0.53, -0.98], mat('shelf-wood', '#72513c'));
    for (let p = 0; p < 7; p++) {
      const color = products[(p + shelf * 2) % products.length];
      sphere(root, 'market produce', 0.19, [-1.62 + p * 0.54, 1.83 + shelf * 0.53, -0.75], mat(`produce-${color}`, color), [0.9, 1.08, 0.9], 12);
    }
  }
  // Exposed produce crates and crates stacked at the container corners.
  const crateMat = mat('crate-wood', '#946444');
  for (let side = -1; side <= 1; side += 2) {
    for (let row = 0; row < 2; row++) {
      const cx = side * (3.15 + (row === 1 ? 0.5 : 0));
      const cz = front + 0.85 + row * 0.18;
      box(root, 'produce crate', [1.05, 0.63, 0.8], [cx, 0.34 + row * 0.56, cz], crateMat);
      box(root, 'crate open top', [0.84, 0.035, 0.62], [cx, 0.68 + row * 0.56, cz], mat('crate-inside', '#3d3328'), { castShadow: false });
      for (let fruit = 0; fruit < 4; fruit++) {
        sphere(root, 'fruit display', 0.22, [cx - 0.3 + fruit * 0.2, 0.82 + row * 0.56, cz], mat(`crate-fruit-${products[fruit % products.length]}`, products[fruit % products.length]), [1, 0.9, 1], 12);
      }
      for (let plank = -1; plank <= 1; plank++) box(root, 'crate plank', [0.055, 0.62, 0.82], [cx + plank * 0.34, 0.34 + row * 0.56, cz], mat('crate-detail', '#b17b51'), { castShadow: false });
    }
  }
  registerVendor(
    [x, -6.15],
    index === 1 ? wovenPattern : mat(`vendor-shirt-${index}`, ['#425b46', '#9d4c38', '#536c70'][index]),
    ['#6b4030', '#8b5740', '#58372d'][index],
    0,
    index !== 1
  );
  return root;
}

const shopInfo = [
  [-10.2, 'MVURA', 'FRESH PRODUCE', '#53764f', '#b98a4a', ['#df9f37', '#c54e35', '#698d42', '#e3bd4d']],
  [0, 'MUSIKA', 'FAMILY GROCER', '#a34d3b', '#d9a249', ['#dfb946', '#8c4a36', '#78964f', '#c97540']],
  [10.2, 'CHENJERAI', 'REPAIR & REUSE', '#526d71', '#8b9b76', ['#7a9883', '#d5a25f', '#b65e44', '#7192a1']]
];
const shops = shopInfo.map((entry, index) => makeContainerShop(...entry, index));

// Secondary timber stalls and counters extend the market beyond the containers.
function makeProduceStall(x, z, title, color) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.userData = { kind: 'shop', title, description: 'A neighbourhood produce stand, trading fresh goods face to face.' };
  scene.add(group);
  const hitArea = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.5, 2.3), hitMaterial);
  hitArea.position.y = 1.25;
  hitArea.userData = group.userData;
  group.add(hitArea);
  interactiveTargets.push(hitArea);
  const wood = mat('stall-posts', '#6c4932');
  for (const px of [-1.65, 1.65]) for (const pz of [-0.75, 0.75]) box(group, 'market stall post', [0.13, 2.3, 0.13], [px, 1.12, pz], wood);
  box(group, 'stall countertop', [3.8, 0.16, 1.7], [0, 1.0, 0], mat('stall-counter', '#80583b'));
  box(group, 'market stall shelf', [3.85, 0.12, 1.82], [0, 0.25, 0], mat('stall-lower-shelf', '#80583b'));
  const canopy = box(group, 'stall canvas awning', [4.2, 0.14, 2.25], [0, 2.27, 0], mat(`${title}-canvas`, color), { rotation: [-0.04, 0, 0] });
  canopy.material.side = THREE.DoubleSide;
  for (let s = -2; s <= 2; s++) box(group, 'awning trim', [0.06, 0.08, 2.18], [s * 0.83, 2.35, 0], mat('stall-trim', '#f0d9a8'), { castShadow: false });
  sign(group, title, 'FRESH TODAY', color, [0, 1.95, 0.88], [2.3, 0.53]);
  const crateColors = ['#d29236', '#c65535', '#66824d', '#e4bd4e', '#826348'];
  for (let i = 0; i < 5; i++) {
    const cx = -1.48 + i * 0.74;
    box(group, 'produce tray', [0.68, 0.4, 0.77], [cx, 1.3, 0], mat(`tray-${i}`, '#80573a'));
    for (let f = 0; f < 5; f++) {
      sphere(group, 'market fruit', 0.16, [cx - 0.23 + (f % 3) * 0.22, 1.57 + (f > 2 ? 0.08 : 0), -0.2 + Math.floor(f / 3) * 0.3], mat(`stall-produce-${crateColors[(i + f) % crateColors.length]}`, crateColors[(i + f) % crateColors.length]), [0.9, 1.05, 0.88], 11);
    }
  }
  registerVendor([x, z - 0.8], mat(`stall-vendor-${title}`, color), '#754b36', 0, true);
  return group;
}
makeProduceStall(-11.6, 1.9, 'MBIRA', '#65804e');
makeProduceStall(0, 2.65, 'CHIPO', '#a45e40');
makeProduceStall(11.5, 1.75, 'TARIRO', '#60767b');

function makeBasket(parent, position, color = '#b68448') {
  const basket = new THREE.Group();
  basket.position.set(...position);
  parent.add(basket);
  const base = mat(`basket-base-${color}`, color);
  cylinder(basket, 'woven basket', 0.28, 0.24, 0.33, [0, 0.16, 0], base, 12);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.026, 6, 16, Math.PI), mat('basket-handle', '#c69a62'));
  handle.rotation.z = Math.PI;
  handle.position.y = 0.34;
  basket.add(handle);
  for (let h = -1; h <= 1; h++) box(basket, 'basket weave', [0.42, 0.025, 0.02], [0, 0.11 + h * 0.08, 0.18], mat('basket-weave', '#d5ad76'), { castShadow: false });
  return basket;
}
makeBasket(scene, [-14.7, 0, 3.5]);
makeBasket(scene, [14.5, 0, 3.9], '#9c6647');
makeBasket(scene, [4.4, 0, -1.1], '#8f774b');

function makePerson({ shirt = '#7b4938', pants = '#403a32', skin = '#85583f', hair = '#241d19', apron = false, bag = false } = {}) {
  return createMarketPerson({ THREE, shirt, pants, skin, hair, apron, bag, mat, box, cylinder });
}

function makeTree(x, z, size = 1) {
  const tree = new THREE.Group();
  tree.position.set(x, 0, z);
  scene.add(tree);
  cylinder(tree, 'tree trunk', 0.18 * size, 0.29 * size, 2.8 * size, [0, 1.4 * size, 0], mat('tree-bark', '#765438'), 9);
  const greens = ['#667d4d', '#778857', '#85925e', '#526e4a'];
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI * 0.77;
    sphere(tree, 'leaf canopy', 0.85 * size, [Math.cos(angle) * 0.55 * size, (2.65 + (i % 3) * 0.34) * size, Math.sin(angle) * 0.5 * size], mat(`leaf-${greens[i % greens.length]}`, greens[i % greens.length]), [1.15, 0.85, 1], 10);
  }
  sphere(tree, 'leaf crown', 0.88 * size, [0, 3.25 * size, 0], mat('leaf-crown', '#6f8552'), [1.08, 1.1, 1], 12);
  cylinder(tree, 'tree bed', 0.95 * size, 1.05 * size, 0.16, [0, 0.02, 0], mat('tree-bed', '#8d896b'), 18);
  for (let i = 0; i < 5; i++) {
    const angle = i * 1.2;
    sphere(tree, 'low planting', 0.19 * size, [Math.cos(angle) * 0.74 * size, 0.18, Math.sin(angle) * 0.74 * size], mat('planting-green', '#637a48'), [1, 0.6, 1]);
  }
}
makeTree(-18, -6.5, 1.4);
makeTree(18, -5.2, 1.5);
makeTree(-18.5, 7.5, 1.2);
makeTree(18, 9.5, 1.5);
makeTree(-5, 11.6, 0.76);
makeTree(6, 11.4, 0.8);

function makeSurroundings() {
  const wallMat = mat('plaster-wall', '#b7a982');
  const roofMat = mat('roof-tin', '#655c4f', 0.72, 0.26);
  // Low neighbourhood shopfronts and workshops frame the open-air market.
  for (const [x, z, w, h, color] of [
    [-24, -4, 7, 6.5, '#a99572'], [24, 0, 8, 7.5, '#ad9c78'],
    [-23, 10.5, 9, 5.2, '#c2ad84'], [23, 11.3, 8, 5.8, '#b39b74']
  ]) {
    const building = new THREE.Group();
    building.position.set(x, 0, z);
    scene.add(building);
    box(building, 'neighbourhood building', [w, h, 5], [0, h / 2, 0], mat(`building-${color}`, color));
    box(building, 'corrugated roof', [w + 0.5, 0.23, 5.5], [0, h + 0.08, 0], roofMat);
    box(building, 'shop door', [1.2, 2.5, 0.12], [0, 1.25, 2.56], mat('building-door', '#544535'));
    for (let wx = -1; wx <= 1; wx += 2) {
      box(building, 'shop window', [1.15, 1.15, 0.12], [wx * w * 0.28, 2.7, 2.56], mat('building-window', '#728276', 0.3, 0.15));
      box(building, 'window sill', [1.3, 0.1, 0.24], [wx * w * 0.28, 2.1, 2.58], mat('window-sill', '#81704f'));
    }
    for (let column = 0; column < 4; column++) {
      box(building, 'wall faded colour', [0.04, h - 0.2, 0.025], [-w / 2 + column * (w / 3), h / 2, 2.54], mat(`building-weather-${color}`, '#a3906c'), { castShadow: false });
    }
  }
  // Hand-painted market boundary wall, catching the late-morning light.
  box(scene, 'market boundary wall', [48, 2.1, 0.35], [0, 1.05, -13.1], wallMat);
  for (let x = -22; x <= 22; x += 2) box(scene, 'boundary wall joint', [0.035, 1.85, 0.03], [x, 1.05, -12.9], mat('wall-joint', '#9e906e'), { castShadow: false });
  const mural = box(scene, 'market mural', [8.5, 1.35, 0.09], [-4, 1.3, -12.87], mat('mural-green', '#4b6348'));
  const muralSign = new THREE.Mesh(new THREE.PlaneGeometry(8.35, 1.2), brandTexture('TIRIPO PAMWE', 'WE ARE HERE TOGETHER', '#4b6348'));
  muralSign.position.set(-4, 1.3, -12.81);
  scene.add(muralSign);
}
makeSurroundings();

function labelTexture(title, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 160;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 512, 160);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(8, 8, 496, 144, 16);
  ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,.15)';
  ctx.fillRect(8, 110, 496, 42);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fffdf1';
  ctx.font = 'bold 42px sans-serif';
  ctx.fillText(title, 256, 80);
  ctx.font = '18px monospace';
  ctx.fillStyle = 'rgba(255,255,255,.9)';
  ctx.fillText('SORT HERE', 256, 137);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });
}

const bins = [];
function makeBin(type, title, subtitle, color, x, z, contents) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.userData = { kind: 'bin', binType: type, title: `${title} WASTE`, description: subtitle };
  scene.add(group);
  const bodyMat = mat(`bin-body-${type}`, color, 0.63, 0.18);
  const darkMat = mat(`bin-dark-${type}`, '#27352e', 0.95, 0.05);
  // A real wheeled public container: reinforcing ribs, handles and a broad top.
  const body = box(group, 'wheeled bin body', [1.35, 1.58, 1.06], [0, 0.94, 0], bodyMat, { userData: { kind: 'bin', binType: type, title: `${title} waste`, description: subtitle } });
  interactiveTargets.push(body);
  box(group, 'bin lower plinth', [1.43, 0.16, 1.12], [0, 0.2, 0], mat('bin-plinth', '#37403a'));
  box(group, 'bin rim', [1.43, 0.13, 1.12], [0, 1.76, 0], mat(`bin-rim-${type}`, color, 0.55, 0.2));
  // Empty inset visible through the opening, with waste pieces staged inside.
  box(group, 'bin opening dark interior', [1.03, 0.09, 0.75], [0, 1.81, 0], darkMat);
  const lidPivot = new THREE.Group();
  lidPivot.position.set(0, 1.84, -0.51);
  group.add(lidPivot);
  const lid = box(lidPivot, 'animated bin lid', [1.48, 0.16, 1.14], [0, 0, 0.51], mat(`bin-lid-${type}`, color, 0.5, 0.24));
  box(group, 'bin handle front', [0.38, 0.1, 0.11], [0, 1.85, 0.61], mat('bin-handle', '#d5c6a4', 0.47, 0.55));
  for (const side of [-1, 1]) {
    cylinder(group, 'bin wheel axle', 0.12, 0.12, 0.16, [side * 0.65, 0.18, -0.36], mat('wheel-rubber', '#242724'), 12, [0, 0, Math.PI / 2]);
    cylinder(group, 'bin wheel', 0.19, 0.19, 0.12, [side * 0.72, 0.18, -0.36], mat('wheel-rubber', '#242724'), 14, [0, 0, Math.PI / 2]);
    box(group, 'bin side reinforcement', [0.07, 1.25, 0.86], [side * 0.71, 0.97, 0], mat('bin-rib', '#d3c7a6'), { castShadow: false });
  }
  const label = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.33), labelTexture(title, color));
  label.position.set(0, 1.29, 0.544);
  group.add(label);
  box(group, 'bin label border', [1.1, 0.39, 0.03], [0, 1.29, 0.535], mat('label-border', '#e9dfc4'), { castShadow: false });
  label.position.z = 0.56;
  group.add(label);
  const pictogram = new THREE.Mesh(new THREE.CircleGeometry(0.21, 20), mat(`bin-icon-${type}`, '#efe7d2'));
  pictogram.position.set(0, 0.77, 0.548);
  group.add(pictogram);
  const pictogramMark = type === 'organic'
    ? new THREE.Mesh(new THREE.ShapeGeometry(new THREE.Shape().moveTo(-0.02, -0.13).quadraticCurveTo(-0.2, 0.03, 0.07, 0.15).quadraticCurveTo(0.18, 0.04, 0.02, -0.13)), mat('icon-organic', '#476342'))
    : type === 'plastic'
      ? cylinder(group, 'bottle icon', 0.055, 0.09, 0.24, [0, 0.77, 0.57], mat('icon-plastic', '#4a7880'), 8)
      : box(group, 'metal can icon', [0.14, 0.2, 0.025], [0, 0.77, 0.57], mat('icon-metal', '#997342'));
  if (pictogramMark.isObject3D && !pictogramMark.parent) {
    pictogramMark.position.set(0, 0.77, 0.57);
    group.add(pictogramMark);
  }
  const wastePieces = [];
  for (let i = 0; i < contents.length; i++) {
    const piece = contents[i] === 'fruit'
      ? sphere(group, 'visible organic waste', 0.17, [-0.28 + i * 0.17, 1.82 + (i % 2) * 0.035, -0.06 + (i % 3) * 0.1], mat(`waste-fruit-${i}`, i % 2 ? '#b54e32' : '#d49b35'), [1.3, 0.54, 0.85], 10)
      : contents[i] === 'bottle'
        ? cylinder(group, 'visible plastic bottle', 0.07, 0.11, 0.25, [-0.26 + i * 0.18, 1.85, -0.13 + (i % 3) * 0.11], mat(`waste-bottle-${i}`, i % 2 ? '#8bb3a4' : '#6e9a98', 0.23, 0.12), 9, [0, 0, Math.PI / 2.7])
        : cylinder(group, 'visible recycled can', 0.11, 0.12, 0.2, [-0.25 + i * 0.18, 1.85, -0.12 + (i % 3) * 0.1], mat(`waste-metal-${i}`, '#b9aa89', 0.32, 0.68), 12, [0, 0, Math.PI / 2.8]);
    wastePieces.push(piece);
  }
  for (let i = 0; i < 2; i++) {
    const flap = box(group, 'bin front handle', [0.09, 0.24, 0.08], [i === 0 ? -0.55 : 0.55, 1.67, 0.56], mat('bin-handle-steel', '#d7cfb9', 0.45, 0.45));
    flap.castShadow = false;
  }
  // A discreet freestanding wayfinding blade makes each station legible at a distance.
  box(group, 'bin station post', [0.07, 0.76, 0.07], [0, 2.24, -0.4], mat('sign-post', '#6c634e'));
  const blade = box(group, 'bin station blade', [1.85, 0.28, 0.08], [0, 2.6, -0.4], mat(`station-${type}`, color));
  blade.userData = { kind: 'bin', binType: type, title: `${title} waste`, description: subtitle };
  interactiveTargets.push(blade);
  const texture = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.24), brandTexture(title, 'WASTE STREAM', color));
  texture.position.set(0, 2.6, -0.35);
  texture.rotation.y = 0;
  texture.scale.set(0.38, 0.7, 1);
  group.add(texture);
  bins.push({ type, group, lidPivot, pieces: wastePieces, lastOpen: 0 });
  return group;
}
makeBin('organic', 'ORGANIC', 'Peels, spoiled produce and plant scraps → biological processing & resource recovery.', '#598147', -13.7, 6.6, ['fruit', 'fruit', 'fruit']);
makeBin('plastic', 'PLASTIC', 'Bottles, packaging and containers → collection & appropriate recycling.', '#36828b', 0, 7.2, ['bottle', 'bottle', 'bottle']);
makeBin('metal', 'METAL', 'Empty cans and suitable scrap → collection & metal recycling.', '#a66f32', 13.7, 6.6, ['metal', 'metal', 'metal']);

const ecosystem = buildEcosystem({ THREE, scene, mat, box, cylinder, sphere });
interactiveTargets.push(...ecosystem.targets);

function addWalker(config) {
  const person = makePerson(config);
  person.group.position.set(config.start[0], 0, config.start[1]);
  scene.add(person.group);
  const record = {
    ...person, path: config.path.map(point => new THREE.Vector3(point[0], 0, point[1])),
    speed: config.speed || 0.72, waypoint: 0, phase: Math.random() * Math.PI * 2,
    role: config.role || 'shopper', pauseUntil: 0, transaction: false,
    cycle: null, holding: config.holding || null
  };
  if (record.holding === 'bottle') {
    record.carried = cylinder(person.group, 'carried water bottle', 0.065, 0.075, 0.26, [0.3, 0.72, 0.16], mat('bottle-carried', '#82aaa1', 0.22, 0.1), 9, [0, 0, -0.15]);
  } else if (record.holding === 'can') {
    record.carried = cylinder(person.group, 'carried empty can', 0.09, 0.09, 0.18, [0.3, 0.73, 0.16], mat('can-carried', '#c0a76e', 0.3, 0.6), 12, [0, 0, Math.PI / 2.8]);
  } else if (record.holding === 'scraps') {
    const scraps = new THREE.Group();
    scraps.position.set(0.3, 0.72, 0.16);
    sphere(scraps, 'vegetable peel bundle', 0.1, [0, 0, 0], mat('peels-carried', '#b48e4d'), [1.4, 0.48, 0.85], 10);
    for (let leaf = 0; leaf < 3; leaf++) {
      const piece = box(scraps, 'leaf trimmings', [0.11, 0.018, 0.05], [-0.05 + leaf * 0.04, 0.055, -0.03 + leaf * 0.025], mat(`leaf-trimming-${leaf}`, leaf === 1 ? '#6d8648' : '#879750'));
      piece.rotation.y = leaf * 0.7;
    }
    person.group.add(scraps);
    record.carried = scraps;
  }
  people.push(record);
  return record;
}

addWalker({ start: [-15.6, -0.4], path: [[-15.6, -0.4], [-13, -0.3], [-9.6, -1.0], [-8.7, 1.5], [-12, 2.1], [-15.4, 1.7]], shirt: '#677f70', pants: '#4b463d', skin: '#674231', hair: '#251d17', speed: 0.55 });
addWalker({ start: [7.6, 1.8], path: [[7.6, 1.8], [10.8, 2.1], [13.5, 0.6], [12.4, -1.4], [8, -1.2], [6.8, 0.3]], shirt: wovenPattern, pants: '#3e3932', skin: '#84563d', hair: '#211b17', bag: true, speed: 0.62 });
addWalker({ start: [-4.7, 3.4], path: [[-4.7, 3.4], [-1.8, 3.2], [2.2, 2.4], [4.8, 3.6], [2.1, 4.3], [-2.7, 4.0]], shirt: '#bc8750', pants: '#45443b', skin: '#6f4632', hair: '#292018', bag: true, speed: 0.7 });
addWalker({ start: [15.3, -1.5], path: [[15.3, -1.5], [12.6, -0.7], [9.5, 0.3], [8.2, 2], [12, 3], [15.7, 2.1]], shirt: '#556e78', pants: '#393832', skin: '#80513a', hair: '#231b17', speed: 0.63 });
addWalker({ start: [-7.2, 5.0], path: [[-7.2, 5], [-4.1, 4.8], [-0.8, 5.2], [-3.2, 6], [-6.4, 5.9]], shirt: '#a45743', pants: '#4b4037', skin: '#613e30', hair: '#231a15', speed: 0.5 });
addWalker({ start: [4.5, -0.6], path: [[4.5, -0.6], [7, -0.6], [9, 0.6], [7.1, 1.9], [4.7, 1.2]], shirt: '#a6a17f', pants: '#353630', skin: '#8b5a40', hair: '#211914', bag: true, speed: 0.46 });
addWalker({ start: [-4.8, -1.1], path: [[-4.8, -1.1], [-7.5, -0.6], [-9.2, 1.2], [-7.8, 2.7], [-4.4, 2]], shirt: '#647a4a', pants: '#403b36', skin: '#794d38', hair: '#261f19', speed: 0.62 });
addWalker({ start: [3.8, 4.6], path: [[3.8, 4.6], [6.3, 4.0], [8.9, 4.8], [11.4, 5.2], [8.2, 5.8], [5.2, 5.2]], shirt: '#c19b59', pants: '#4b4940', skin: '#67412f', hair: '#201914', speed: 0.59 });

const produceBuyer = addWalker({
  start: [-10.2, -1.1],
  path: [[-10.2, -4.1], [-8.3, -1.8]],
  shirt: '#947c59', pants: '#3e403a', skin: '#81543d', hair: '#241b16',
  bag: true, speed: 0.58, role: 'buyer'
});
produceBuyer.sale = { phase: 'approach', timer: 0, product: null };

const sortJobs = [
  { type: 'organic', waste: 'vegetable scraps', start: [-7.8, 0.6], path: [[-7.8, 0.6], [-9, 3.2], [-11.4, 5.1], [-13.7, 6.15]], shirt: '#6b8256', skin: '#754b36', pants: '#443a32', holding: 'scraps' },
  { type: 'plastic', waste: 'plastic bottle', start: [4.2, -1.9], path: [[4.2, -1.9], [3.2, 0.6], [2.5, 3.3], [0, 6.5]], shirt: '#78959a', skin: '#8a5d44', pants: '#3d4039', holding: 'bottle' },
  { type: 'metal', waste: 'empty metal can', start: [16.4, -0.2], path: [[16.4, -0.2], [15.5, 2.2], [14.4, 4.1], [13.7, 6.15]], shirt: '#a05f45', skin: '#704630', pants: '#413b34', holding: 'can' }
];
const sorterRecords = sortJobs.map((job, index) => {
  const person = addWalker({ ...job, role: 'sorter', speed: index === 1 ? 0.9 : 0.82 });
  person.path = job.path.map(point => new THREE.Vector3(point[0], 0, point[1]));
  person.job = job;
  person.waitBefore = index * 2.7 + 1.4;
  person.wasteMesh = null;
  return person;
});

function updateWalking(person, delta, elapsed) {
  const group = person.group;
  const limbs = person.limbs;
  const cycle = person.cycle;
  if (cycle?.phase === 'approach') {
    const target = cycle.path[cycle.waypoint];
    const dx = target.x - group.position.x, dz = target.z - group.position.z;
    const distance = Math.hypot(dx, dz);
    if (distance < 0.13) {
      cycle.waypoint++;
      if (cycle.waypoint >= cycle.path.length) cycle.phase = 'opening';
    } else {
      const step = Math.min(distance, person.speed * delta);
      group.position.x += dx / distance * step;
      group.position.z += dz / distance * step;
      group.rotation.y = Math.atan2(dx, dz);
      animateGait(person, elapsed, 1);
    }
    return;
  }
  if (cycle?.phase === 'opening') {
    cycle.timer += delta;
    cycle.bin.lidPivot.rotation.x = THREE.MathUtils.damp(cycle.bin.lidPivot.rotation.x, -1.12, 5.5, delta);
    if (cycle.timer > 0.64) {
      cycle.phase = 'drop';
      cycle.timer = 0;
      cycle.bin.lastOpen = elapsed;
      if (person.carried) person.carried.visible = false;
      const wasteMat = cycle.type === 'organic' ? mat('scraps-tossed', '#9a6133') : cycle.type === 'plastic' ? mat('bottle-tossed', '#8ebcb0', 0.2, 0.1) : mat('can-tossed', '#c0a76e', 0.3, 0.6);
      cycle.wasteMesh = cycle.type === 'organic'
        ? sphere(scene, 'sorting interaction: vegetable scraps', 0.13, [group.position.x, 1.7, group.position.z], wasteMat, [1.25, 0.7, 1], 10)
        : cylinder(scene, `sorting interaction: ${cycle.waste}`, cycle.type === 'plastic' ? 0.06 : 0.1, cycle.type === 'plastic' ? 0.08 : 0.11, 0.22, [group.position.x, 1.7, group.position.z], wasteMat, 9, [0, 0, Math.PI / 3]);
    }
    animateGait(person, elapsed, 0);
    return;
  }
  if (cycle?.phase === 'drop') {
    cycle.timer += delta;
    const t = Math.min(cycle.timer / 0.95, 1);
    if (cycle.wasteMesh) {
      const bin = cycle.bin;
      cycle.wasteMesh.position.set(
        THREE.MathUtils.lerp(group.position.x, bin.group.position.x, t),
        THREE.MathUtils.lerp(1.72 + Math.sin(t * Math.PI) * 0.72, 1.82, t),
        THREE.MathUtils.lerp(group.position.z, bin.group.position.z, t)
      );
      cycle.wasteMesh.rotation.x += delta * 3;
    }
    if (t >= 1) {
      if (cycle.wasteMesh) scene.remove(cycle.wasteMesh);
      const bin = cycle.bin;
      const deposited = bin.pieces.length;
      const px = -0.34 + (deposited % 4) * 0.21;
      const pz = -0.22 + ((deposited * 3) % 4) * 0.12;
      const py = 1.82 + Math.floor(deposited / 4) * 0.06;
      const stored = bin.type === 'organic'
        ? sphere(bin.group, 'collected organic scraps', 0.13, [px, py, pz], mat('stored-organic', '#a1783e'), [1.2, 0.55, 0.85], 10)
        : cylinder(bin.group, `collected ${bin.type} recycling`, bin.type === 'plastic' ? 0.065 : 0.095, bin.type === 'plastic' ? 0.08 : 0.1, 0.2, [px, py, pz], mat(`stored-${bin.type}`, bin.type === 'plastic' ? '#85aaa1' : '#c1aa7d', 0.3, bin.type === 'metal' ? 0.55 : 0.08), 10, [0, 0, Math.PI / 2.8]);
      stored.name = `accumulated ${bin.type} waste`;
      bin.pieces.push(stored);
      cycle.bin.lastOpen = elapsed;
      cycle.phase = 'closing';
      cycle.timer = 0;
    }
    return;
  }
  if (cycle?.phase === 'closing') {
    cycle.bin.lidPivot.rotation.x = THREE.MathUtils.damp(cycle.bin.lidPivot.rotation.x, 0, 4.8, delta);
    cycle.timer += delta;
    if (cycle.timer > 0.58) {
      cycle.phase = 'depart';
      cycle.waypoint = cycle.path.length - 2;
    }
    animateGait(person, elapsed, 0);
    return;
  }
  if (cycle?.phase === 'depart') {
    const target = cycle.path[Math.max(0, cycle.waypoint)];
    const dx = target.x - group.position.x, dz = target.z - group.position.z;
    const distance = Math.hypot(dx, dz);
    if (distance < 0.16) {
      cycle.waypoint--;
      if (cycle.waypoint < 0) {
        person.cycle = null;
        person.waitBefore = elapsed + 10 + Math.random() * 7;
        if (person.carried) person.carried.visible = true;
      }
    } else {
      const step = Math.min(distance, person.speed * delta);
      group.position.x += dx / distance * step;
      group.position.z += dz / distance * step;
      group.rotation.y = Math.atan2(dx, dz);
      animateGait(person, elapsed, 1);
    }
    return;
  }

  if (elapsed < person.waitBefore) {
    animateGait(person, elapsed, 0);
    return;
  }
  if (!person.cycle && person.role === 'sorter') {
    const bin = bins.find(item => item.type === person.job.type);
    person.cycle = { phase: 'approach', path: person.path, waypoint: 1, timer: 0, bin, type: person.job.type, waste: person.job.waste };
  }
  if (person.role === 'vendor') {
    const wave = Math.sin(elapsed * 1.4 + person.phase) * 0.13;
    limbs.arms[1].rotation.x = -0.2 + Math.max(0, wave);
    limbs.arms[0].rotation.x = -0.15 + Math.max(0, -wave) * 0.35;
    limbs.arms[1].rotation.z = -0.2;
    limbs.arms[0].rotation.z = 0.2;
    person.group.userData.body.position.y = Math.sin(elapsed * 1.1 + person.phase) * 0.025;
    return;
  }
  if (person.role === 'buyer' && person.sale) {
    const sale = person.sale;
    if (sale.phase === 'approach') {
      const target = person.path[0];
      const dx = target.x - group.position.x, dz = target.z - group.position.z;
      const distance = Math.hypot(dx, dz);
      if (distance < 0.16) {
        group.rotation.y = Math.PI;
        sale.phase = 'payment';
        sale.timer = 0;
      } else {
        const step = Math.min(distance, person.speed * delta);
        group.position.x += dx / distance * step;
        group.position.z += dz / distance * step;
        group.rotation.y = Math.atan2(dx, dz);
        animateGait(person, elapsed, 1);
      }
      return;
    }
    if (sale.phase === 'payment') {
      sale.timer += delta;
      person.limbs.arms[0].rotation.x = -0.9 + Math.sin(elapsed * 3) * 0.1;
      person.limbs.arms[1].rotation.x = -0.8;
      if (sale.timer > 1.05) {
        sale.from = new THREE.Vector3(-10.2, 1.24, -5.35);
        sale.to = new THREE.Vector3(group.position.x - 0.3, 0.76, group.position.z - 0.25);
        sale.product = sphere(scene, 'fresh produce being handed to customer', 0.14, sale.from.toArray(), mat('handoff-fruit', '#d99932'), [1, 0.95, 1], 12);
        sale.phase = 'handoff';
        sale.timer = 0;
      }
      return;
    }
    if (sale.phase === 'handoff') {
      sale.timer += delta;
      const t = Math.min(sale.timer / 0.9, 1);
      sale.product.position.lerpVectors(sale.from, sale.to, t);
      sale.product.position.y += Math.sin(t * Math.PI) * 0.32;
      if (t >= 1) {
        scene.remove(sale.product);
        sale.heldProduce = sphere(group, 'purchased produce', 0.14, [0.3, 0.76, 0.16], mat('purchased-fruit', '#d99932'), [1, 0.95, 1], 12);
        sale.phase = 'leaving';
      }
      return;
    }
    if (sale.phase === 'leaving') {
      const target = person.path[1];
      const dx = target.x - group.position.x, dz = target.z - group.position.z;
      const distance = Math.hypot(dx, dz);
      if (distance < 0.18) {
        person.role = 'shopper';
        person.sale = null;
        person.path = [target, new THREE.Vector3(-6.3, 0, -0.2)];
        person.waypoint = 1;
      } else {
        const step = Math.min(distance, person.speed * delta);
        group.position.x += dx / distance * step;
        group.position.z += dz / distance * step;
        group.rotation.y = Math.atan2(dx, dz);
        animateGait(person, elapsed, 1);
      }
      return;
    }
  }
  if (person.pauseUntil > elapsed) {
    animateGait(person, elapsed, 0);
    if (person.transaction) {
      person.limbs.arms[0].rotation.x = -0.9 + Math.sin(elapsed * 2) * 0.2;
      person.limbs.arms[1].rotation.x = -0.55;
    }
    return;
  }
  const target = person.path[person.waypoint];
  if (!target) { person.waypoint = 0; return; }
  const dx = target.x - group.position.x, dz = target.z - group.position.z;
  const distance = Math.hypot(dx, dz);
  if (distance < 0.22) {
    person.waypoint = (person.waypoint + 1) % person.path.length;
    if (person.role !== 'sorter' && Math.random() < 0.2) {
      person.pauseUntil = elapsed + 1.5 + Math.random() * 2.1;
      person.transaction = Math.random() < 0.4;
      if (person.transaction) person.group.rotation.y = Math.atan2(dx, dz);
    }
  } else {
    const step = Math.min(distance, person.speed * delta);
    group.position.x += dx / distance * step;
    group.position.z += dz / distance * step;
    group.rotation.y = Math.atan2(dx, dz);
    animateGait(person, elapsed, 1);
  }
}

function animateGait(person, elapsed, amount) {
  const swing = Math.sin(elapsed * 6.7 * person.speed + person.phase);
  person.limbs.legs[0].rotation.x = swing * 0.36 * amount;
  person.limbs.legs[1].rotation.x = -swing * 0.36 * amount;
  person.limbs.arms[0].rotation.x = -swing * 0.25 * amount;
  person.limbs.arms[1].rotation.x = swing * 0.25 * amount;
  person.limbs.arms[0].rotation.z = 0.12;
  person.limbs.arms[1].rotation.z = -0.12;
  person.group.userData.body.position.y = Math.abs(swing) * 0.025 * amount;
}

const stationStory = {
  organic: {
    eyebrow: '01 / ORGANIC RETURN',
    title: 'Feed the soil,<br />not the landfill.',
    body: 'Peels, spoiled produce and plant trimmings are kept apart for biological processing, such as composting and resource recovery.',
    outcome: 'Healthier soil. Nutrients returned to the cycle.'
  },
  plastic: {
    eyebrow: '02 / PLASTIC RECOVERY',
    title: 'Keep plastic<br />in circulation.',
    body: 'Clean bottles, containers and suitable packaging are collected separately for sorting and appropriate recycling.',
    outcome: 'Useful materials recovered, not dumped.'
  },
  metal: {
    eyebrow: '03 / METAL RECOVERY',
    title: 'Metal is worth<br />another round.',
    body: 'Empty cans and suitable scrap are gathered for metal recycling, recovering valuable material for new products.',
    outcome: 'Local collection creates local value.'
  }
};

function showStory(key, object = null) {
  let data;
  if (key === 'idea') {
    data = { eyebrow: 'THE IDEA', title: 'TRASH TO TREASURE —<br/>A CLEANER, CIRCULAR MARKET', body: 'Organic waste goes to biological processing and resource recovery; plastics to collection and appropriate recycling; metals to collection and metal recycling. Sorting at the source keeps the market clean, reduces uncontrolled dumping, recovers valuable materials, creates economic opportunities and supports a healthier environment.', outcome: 'Separate at the source. Keep value in the community.' };
  } else if (key === 'activity') {
    data = { eyebrow: 'MARKET LIFE', title: 'Trade is in motion.', body: 'Neighbours shop, vendors share the day’s harvest and market workers keep goods moving through this lively corner of Harare.', outcome: 'A real market, with room for circular ideas.' };
  } else if (key === 'facility') {
    data = { eyebrow: object.stage || 'CIRCULAR ECONOMY', title: object.title, body: object.description, outcome: object.outcome || 'Explore the facility to follow the material flow.' };
  } else if (key === 'presentation') {
    data = object;
  } else if (object?.kind === 'shop') {
    data = { eyebrow: 'MEET THE MARKET', title: `${object.title}`, body: object.description, outcome: 'Locally run. Reimagined for a circular future.' };
  } else {
    data = stationStory[key];
  }
  if (!data) return;
  document.querySelector('#storyEyebrow').textContent = data.eyebrow;
  document.querySelector('#storyTitle').innerHTML = data.title;
  document.querySelector('#storyBody').textContent = data.body;
  document.querySelector('#storyOutcome').innerHTML = `<span aria-hidden="true">↗</span><span>${data.outcome}</span>`;
}

const focusTargets = {
  overview: { camera: initialCamera.clone(), target: overviewTarget.clone() },
  market: { camera: new THREE.Vector3(24, 21, 32), target: new THREE.Vector3(0, 1.1, 0) },
  shops: { camera: new THREE.Vector3(17, 12, 18), target: new THREE.Vector3(0, 1.4, -5.7) },
  bins: { camera: new THREE.Vector3(21, 15, 22), target: new THREE.Vector3(0, 1.1, 6.4) },
  'bin-organic': { camera: new THREE.Vector3(-19, 9, 13), target: new THREE.Vector3(-13.7, 1.2, 6.6) },
  'bin-plastic': { camera: new THREE.Vector3(2, 8, 17), target: new THREE.Vector3(0, 1.1, 7.2) },
  'bin-metal': { camera: new THREE.Vector3(21, 9, 13), target: new THREE.Vector3(13.7, 1.2, 6.6) },
  ...ecosystem.focusViews
};
let cameraTween = null;
let presentationTour = null;
let activeView = 'market';
const presentationStops = [
  { view: 'farm', eyebrow: '01 / GOODS ARRIVE', title: 'From nearby farms<br/>to the market.', body: 'Fresh harvest travels in returnable crates along marked access roads. Delivery vehicles bring produce and supplies to the container shops.', outcome: 'A local supply chain begins with farmers.' },
  { view: 'shops', eyebrow: '02 / MARKET LIFE', title: 'Trade creates<br/>community value.', body: 'Vendors arrange the harvest, serve customers and trade face-to-face. Repaired shipping containers give small businesses a practical home.', outcome: 'People, products and livelihoods in motion.' },
  { view: 'bins', eyebrow: '03 / SORT AT SOURCE', title: 'Three streams.<br/>Three next steps.', body: 'Organic scraps, plastic packaging and metal cans are kept separate at the point where they are discarded.', outcome: 'Correct sorting protects material value.' },
  { view: 'biogas', eyebrow: '04 / ORGANIC RECOVERY', title: 'Scraps become<br/>useful resources.', body: 'Organic waste is sorted, shredded and mixed before entering a sealed anaerobic digester. The biological process generates biogas, bioslurry and solid digestate.', outcome: 'A managed biological process, not a burner.' },
  { view: 'market', eyebrow: '05 / BIOGAS USE', title: 'Renewable gas<br/>returns to market.', body: 'Biogas is collected, metered and distributed through a dedicated pipe to a market cooking station.', outcome: 'Recovered gas serves a useful local purpose.' },
  { view: 'farm', eyebrow: '06 / FERTILISER TO FARM', title: 'Nutrients return<br/>to the soil.', body: 'Nutrient-rich bioslurry is stored and labelled for appropriate handling, then taken to nearby growers for crop application.', outcome: 'Resource recovery supports local farming.' },
  { view: 'farm', eyebrow: '07 / HARVEST AGAIN', title: 'Grow, harvest,<br/>return in crates.', body: 'Farmers care for vegetable rows, use irrigation and harvest produce into reusable crates that travel back to market.', outcome: 'The organic loop comes full circle.' },
  { view: 'plastic', eyebrow: '08 / KEEP PLASTIC USEFUL', title: 'Reduce, reuse,<br/>repair, repurpose.', body: 'Suitable plastics are inspected, cleaned, reused, repaired or upcycled into practical items before recycling is considered.', outcome: 'Recycling is the last option, not the first.' },
  { view: 'metal', eyebrow: '09 / METAL RECOVERY', title: 'Reuse first.<br/>Recycle separately.', body: 'Suitable metal objects are recovered for reuse; remaining recyclable cans and scrap follow a distinct metal recovery route.', outcome: 'Metal never enters the organic system.' },
  { view: 'overview', eyebrow: '10 / RESOURCES RETURN', title: 'Keep value<br/>in the community.', body: 'Farm produce, renewable biogas, recovered nutrients and useful materials connect neighbours through one circular economy.', outcome: 'Waste is not always the end of a product’s life.' }
];

function focus(view) {
  const next = focusTargets[view];
  if (!next) return;
  activeView = view;
  document.body.classList.toggle('focused-scene', view !== 'overview');
  cameraTween = { fromCamera: camera.position.clone(), toCamera: next.camera.clone(), fromTarget: controls.target.clone(), toTarget: next.target.clone(), start: performance.now(), duration: 1100 };
  document.querySelectorAll('.focus-button').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  document.querySelectorAll('.waste-item').forEach(button => button.classList.toggle('selected', button.dataset.focus === view));
  if (view === 'shops') showStory('shop', { kind: 'shop', title: 'RECLAIMED CONTAINERS', description: 'Weathered steel shipping containers are repaired and opened into neighbourhood shops, with their original ribs, corner posts and working doors still in view.' });
  else if (view.startsWith('bin-')) showStory(view.slice(4));
  else if (ecosystem.stations.some(item => item.id === view)) {
    const info = ecosystem.stations.find(item => item.id === view);
    showStory('facility', { kind: 'facility', title: info.name, description: info.description });
  } else if (stationStory[view]) showStory(view);
  else showStory('presentation', {
    eyebrow: 'TRASH TO TREASURE · HARARE',
    title: 'A market with a second life.',
    body: 'Explore the stalls, meet the traders and follow each material to its next use.',
    outcome: 'EVOKE ZIMBABWE · CIRCULAR FUTURES'
  });
}

function stopPresentation() {
  if (!presentationTour) return;
  presentationTour = null;
  tourButton.classList.remove('active');
  tourButton.innerHTML = 'PRESENT <span aria-hidden="true">▶</span>';
  tourButton.setAttribute('aria-label', 'Start circular economy presentation');
}
document.querySelectorAll('.focus-button').forEach(button => button.addEventListener('click', () => {
  stopPresentation();
  focus(button.dataset.view);
}));
document.querySelectorAll('.waste-item').forEach(button => button.addEventListener('click', () => {
  stopPresentation();
  focus(button.dataset.focus);
}));
document.querySelector('#resetCamera').addEventListener('click', () => { stopPresentation(); focus('overview'); });
const tourButton = document.querySelector('#tourButton');
tourButton.addEventListener('click', () => {
  if (presentationTour) {
    stopPresentation();
    return;
  }
  presentationTour = { index: -1, nextAt: 0 };
  tourButton.classList.add('active');
  tourButton.innerHTML = 'STOP <span aria-hidden="true">■</span>';
  tourButton.setAttribute('aria-label', 'Stop circular economy presentation');
});

const locationPinDefinitions = [
  {
    view: 'shops', label: 'CONTAINER SHOPS', note: 'VENDORS · TRADE',
    position: [-10.2, 3.2, -4.7],
    story: { eyebrow: 'MARKET LIFE · CONTAINER SHOPS', title: 'Trading is in motion.', body: 'Reclaimed shipping containers are now neighbourhood shops, where local traders sell produce, groceries and repair services.', outcome: 'Local trade keeps livelihoods and value in the community.' }
  },
  {
    view: 'shops', label: 'FRESH PRODUCE', note: 'HARVEST · BUYING',
    position: [0, 3.0, 1.7],
    story: { eyebrow: 'MARKET LIFE · FRESH PRODUCE', title: 'From harvest to hand.', body: 'Customers browse fresh goods, compare produce and buy directly from market vendors.', outcome: 'Reusable crates help keep produce moving.' }
  },
  { view: 'bin-organic', label: 'ORGANIC SORTING', note: 'PEELS · VEGETABLE SCRAPS', position: [-13.7, 3.45, 6.6] },
  { view: 'bin-plastic', label: 'PLASTIC SORTING', note: 'BOTTLES · PACKAGING', position: [0, 3.45, 7.2] },
  { view: 'bin-metal', label: 'METAL SORTING', note: 'CANS · SCRAP', position: [13.7, 3.45, 6.6] },
  { view: 'farm', label: 'COMMUNITY FARM', note: 'GROW · HARVEST', position: [-41, 5.2, -31] },
  { view: 'biogas', label: 'BIOGAS & ORGANICS', note: 'SORT · DIGEST · RECOVER', position: [-11, 5.2, -30.5] },
  { view: 'plastic', label: 'PLASTIC WORKSHOP', note: 'REDUCE · REUSE · REPAIR', position: [21, 5.2, -30.5] },
  { view: 'metal', label: 'METAL RECOVERY', note: 'SORT · REUSE · RECYCLE', position: [45, 4.7, -19] }
];
const locationPins = locationPinDefinitions.map(definition => {
  const pin = document.createElement('button');
  pin.className = 'location-pin';
  pin.type = 'button';
  pin.setAttribute('aria-label', `${definition.label}: ${definition.note}`);
  pin.innerHTML = `<span class="pin-marker" aria-hidden="true"></span><span class="pin-copy"><strong>${definition.label}</strong><small>${definition.note}</small></span>`;
  pin.addEventListener('click', () => {
    stopPresentation();
    focus(definition.view);
    if (definition.story) showStory('presentation', definition.story);
  });
  document.querySelector('#locationPins').appendChild(pin);
  return { element: pin, anchor: new THREE.Vector3(...definition.position), definition };
});

function updateLocationPins() {
  camera.updateMatrixWorld();
  const candidates = [];
  for (const pin of locationPins) {
    const projected = pin.anchor.clone().project(camera);
    const x = (projected.x * 0.5 + 0.5) * innerWidth;
    const y = (-projected.y * 0.5 + 0.5) * innerHeight;
    const visible = projected.z > -1 && projected.z < 1 && x > 18 && x < innerWidth - 18 && y > 72 && y < innerHeight - 170;
    pin.element.style.display = visible ? 'flex' : 'none';
    if (visible) {
      pin.element.style.left = `${x}px`;
      pin.element.style.top = `${y}px`;
      pin.element.style.transform = 'translate(-50%, -100%)';
      candidates.push({
        element: pin.element,
        x,
        y,
        priority: pin.definition.view === activeView ? 1 : 0,
        centerDistance: Math.hypot(x - innerWidth / 2, y - innerHeight / 2)
      });
    }
  }
  candidates.sort((a, b) => b.priority - a.priority || a.centerDistance - b.centerDistance);
  const visibleRects = [];
  for (const candidate of candidates) {
    const width = candidate.element.offsetWidth;
    const height = candidate.element.offsetHeight;
    const rect = {
      left: candidate.x - width / 2,
      right: candidate.x + width / 2,
      top: candidate.y - height,
      bottom: candidate.y
    };
    const overlaps = visibleRects.some(other =>
      rect.left < other.right + 8 && rect.right + 8 > other.left &&
      rect.top < other.bottom + 8 && rect.bottom + 8 > other.top
    );
    if (overlaps) candidate.element.style.display = 'none';
    else visibleRects.push(rect);
  }
}

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const tooltip = document.querySelector('#tooltip');
let pointerDown = null;
renderer.domElement.addEventListener('pointerdown', event => { pointerDown = [event.clientX, event.clientY]; });
renderer.domElement.addEventListener('pointermove', event => {
  pointer.set((event.clientX / innerWidth) * 2 - 1, -(event.clientY / innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(interactiveTargets, true);
  const interactive = hits.find(hit => hit.object.userData.stage) || hits.find(hit => hit.object.userData.kind);
  if (interactive) {
    tooltip.style.display = 'block';
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
    tooltip.textContent = interactive.object.userData.title || 'EXPLORE MARKET';
    renderer.domElement.style.cursor = 'pointer';
  } else {
    tooltip.style.display = 'none';
    renderer.domElement.style.cursor = 'grab';
  }
});
renderer.domElement.addEventListener('pointerleave', () => { tooltip.style.display = 'none'; });
renderer.domElement.addEventListener('pointerup', event => {
  if (!pointerDown || Math.hypot(event.clientX - pointerDown[0], event.clientY - pointerDown[1]) > 5) { pointerDown = null; return; }
  pointerDown = null;
  pointer.set((event.clientX / innerWidth) * 2 - 1, -(event.clientY / innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(interactiveTargets, true);
  const hit = hits.find(result => result.object.userData.stage) || hits.find(result => result.object.userData.kind);
  if (!hit) return;
  const data = hit.object.userData;
  stopPresentation();
  if (data.kind === 'bin') focus(`bin-${data.binType}`);
  else if (data.kind === 'facility') {
    focus(data.view);
    showStory('facility', data);
  } else if (data.kind === 'shop') {
    document.body.classList.add('focused-scene');
    showStory('shop', data);
    const pos = new THREE.Vector3();
    hit.object.getWorldPosition(pos);
    cameraTween = { fromCamera: camera.position.clone(), toCamera: new THREE.Vector3(pos.x + 7, 8.5, pos.z + 11), fromTarget: controls.target.clone(), toTarget: new THREE.Vector3(pos.x, 1.1, pos.z + 1), start: performance.now(), duration: 950 };
  }
});

let paused = false;
document.querySelector('#motionToggle').addEventListener('click', event => {
  paused = !paused;
  const button = event.currentTarget;
  button.classList.toggle('paused', paused);
  button.setAttribute('aria-label', paused ? 'Resume market animation' : 'Pause market animation');
  button.title = paused ? 'Resume market animation' : 'Pause market animation';
});

let clockSeconds = 9 * 3600 + 41 * 60;
setInterval(() => {
  clockSeconds += 60;
  const hours = String(Math.floor(clockSeconds / 3600) % 24).padStart(2, '0');
  const mins = String(Math.floor(clockSeconds / 60) % 60).padStart(2, '0');
  document.querySelector('#clock').textContent = `${hours}:${mins}`;
}, 60000);

const timer = new THREE.Clock();
let elapsed = 0;
function render() {
  requestAnimationFrame(render);
  const delta = Math.min(timer.getDelta(), 0.05);
  if (!paused) {
    elapsed += delta;
    ecosystem.update(delta, elapsed);
    for (const person of people) updateWalking(person, delta, elapsed);
    for (const bin of bins) {
      const activity = sorterRecords.some(record => record.cycle?.bin === bin && ['opening', 'drop', 'closing'].includes(record.cycle.phase));
      const idleOpen = elapsed - bin.lastOpen < 0.5;
      const target = activity || idleOpen ? -1.12 : 0;
      bin.lidPivot.rotation.x = THREE.MathUtils.damp(bin.lidPivot.rotation.x, target, activity ? 7 : 3.2, delta);
    }
    if (presentationTour && performance.now() >= presentationTour.nextAt) {
      presentationTour.index++;
      if (presentationTour.index >= presentationStops.length) presentationTour.index = 0;
      const stop = presentationStops[presentationTour.index];
      focus(stop.view);
      showStory('presentation', stop);
      presentationTour.nextAt = performance.now() + 6500;
    }
  }
  if (cameraTween) {
    const t = Math.min((performance.now() - cameraTween.start) / cameraTween.duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    camera.position.lerpVectors(cameraTween.fromCamera, cameraTween.toCamera, eased);
    controls.target.lerpVectors(cameraTween.fromTarget, cameraTween.toTarget, eased);
    if (t >= 1) cameraTween = null;
  }
  controls.update();
  updateLocationPins();
  renderer.render(scene, camera);
}
render();

setTimeout(() => document.querySelector('#loading').classList.add('done'), 900);
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  updateLocationPins();
});
