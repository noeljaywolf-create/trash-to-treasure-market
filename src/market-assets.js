let characterCount = 0;
const sphereGeometries = new Map();
const capsuleGeometries = new Map();
const torusGeometries = new Map();
let torsoGeometry;

function sharedSphere(THREE, parent, name, radius, position, material, scale = [1, 1, 1], segments = 14) {
  const key = `${segments}`;
  if (!sphereGeometries.has(key)) sphereGeometries.set(key, new THREE.SphereGeometry(1, segments, Math.max(8, segments - 3)));
  const mesh = new THREE.Mesh(sphereGeometries.get(key), material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.scale.set(radius * scale[0], radius * scale[1], radius * scale[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function sharedCapsule(THREE, radius, length, capSegments, radialSegments) {
  const key = `${radius}:${length}:${capSegments}:${radialSegments}`;
  if (!capsuleGeometries.has(key)) {
    capsuleGeometries.set(key, new THREE.CapsuleGeometry(radius, length, capSegments, radialSegments));
  }
  return capsuleGeometries.get(key);
}

function sharedTorus(THREE, radius, tube, radialSegments, tubularSegments, arc = Math.PI * 2) {
  const key = `${radius}:${tube}:${radialSegments}:${tubularSegments}:${arc}`;
  if (!torusGeometries.has(key)) {
    torusGeometries.set(key, new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments, arc));
  }
  return torusGeometries.get(key);
}

export function createMarketPerson({ THREE, parent, position = [0, 0, 0], shirt = '#7b4938', pants = '#403a32', skin = '#85583f', hair = '#241d19', apron = false, bag = false, role = 'shopper', mat, box, cylinder }) {
  const index = characterCount++;
  const group = new THREE.Group();
  group.name = `${role} 3D character`;
  group.position.set(...position);
  const skinMat = mat(`skin-${skin}`, skin, 0.88);
  const hairMat = mat(`hair-${hair}`, hair, 0.94);
  const pantsMat = mat(`pants-${pants}`, pants, 0.94);
  const shirtMat = typeof shirt === 'string' ? mat(`shirt-${shirt}`, shirt, 0.88) : shirt;
  const shoeMat = mat('shoe-leather', '#332c26', 0.78);
  const body = new THREE.Group();
  group.add(body);

  if (!torsoGeometry) {
    torsoGeometry = new THREE.LatheGeometry([
      new THREE.Vector2(0.2, 0), new THREE.Vector2(0.25, 0.05),
      new THREE.Vector2(0.29, 0.2), new THREE.Vector2(0.3, 0.4),
      new THREE.Vector2(0.25, 0.57), new THREE.Vector2(0.13, 0.65)
    ], 18);
  }
  const torso = new THREE.Mesh(torsoGeometry, shirtMat);
  torso.name = 'tailored shirt with natural silhouette';
  torso.position.y = 0.84;
  torso.castShadow = true;
  torso.receiveShadow = true;
  body.add(torso);

  const collar = new THREE.Mesh(sharedTorus(THREE, 0.105, 0.022, 7, 18), mat('shirt-collar', '#d2bd94', 0.86));
  collar.name = 'stitched shirt collar';
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 1.48, 0);
  body.add(collar);
  box(body, 'shirt hem seam', [0.39, 0.025, 0.035], [0, 0.9, 0.255], mat('shirt-hem-stitch', '#d0b98b', 0.9), { castShadow: false });

  if (apron) {
    const apronMat = mat('market apron canvas', '#c4ad83', 0.96);
    box(body, 'market apron bib', [0.35, 0.38, 0.045], [0, 1.25, 0.258], apronMat);
    box(body, 'market apron skirt', [0.43, 0.42, 0.055], [0, 0.98, 0.26], apronMat);
    box(body, 'apron waist tie', [0.47, 0.055, 0.065], [0, 1.15, 0.29], mat('apron-tie', '#a88d66', 0.95));
    box(body, 'apron pocket', [0.18, 0.12, 0.035], [0, 1.02, 0.302], mat('apron-pocket', '#887457', 0.95));
    for (const side of [-1, 1]) {
      box(body, 'apron shoulder strap', [0.055, 0.24, 0.04], [side * 0.115, 1.39, 0.25], apronMat, { rotation: [0, 0, side * -0.12] });
    }
  } else {
    box(body, 'shirt front placket', [0.025, 0.34, 0.018], [0, 1.18, 0.29], mat('shirt-placket', '#d7c6a2', 0.9), { castShadow: false });
    for (let button = 0; button < 3; button++) {
      sharedSphere(THREE, body, 'shirt button', 0.018, [0, 1.09 + button * 0.1, 0.304], mat('shirt-button', '#493e31', 0.45), [1, 1, 0.45], 8);
    }
  }

  box(body, 'woven market belt', [0.47, 0.065, 0.49], [0, 0.85, 0], mat('belt-leather', '#51402f', 0.82));
  box(body, 'belt buckle', [0.075, 0.07, 0.035], [0, 0.85, 0.253], mat('belt-buckle', '#aa9362', 0.43, 0.48));
  cylinder(body, 'neck', 0.083, 0.095, 0.18, [0, 1.54, 0], skinMat, 14);
  sharedSphere(THREE, body, 'head', 0.19, [0, 1.76, 0], skinMat, [0.91, 1.13, 0.9], 20);
  sharedSphere(THREE, body, 'chin', 0.095, [0, 1.65, 0.055], skinMat, [0.85, 0.58, 0.9], 14);

  const hairStyle = index % 4;
  sharedSphere(THREE, body, hairStyle === 0 ? 'short natural hair' : 'textured hair cap', 0.175, [0, 1.89, -0.015], hairMat, [1.05, 0.67, 1], 18);
  if (hairStyle === 1 || hairStyle === 3) {
    const locks = hairStyle === 1 ? 5 : 3;
    for (let lock = 0; lock < locks; lock++) {
      const angle = (lock / locks) * Math.PI * 2;
      const detail = sharedSphere(THREE, body, hairStyle === 1 ? 'natural hair curl' : 'braided hair detail', hairStyle === 1 ? 0.045 : 0.035,
        [Math.cos(angle) * 0.16, 1.83 + (lock % 2) * 0.045, Math.sin(angle) * 0.12 - 0.01],
        hairMat, [0.85, 1.2, 0.85], 10);
      detail.rotation.z = Math.cos(angle) * 0.35;
    }
  } else if (hairStyle === 2) {
    const wrapMat = mat(`headwrap-${index}`, index % 8 ? '#b76545' : '#b99b62', 0.94);
    const wrap = new THREE.Mesh(sharedTorus(THREE, 0.155, 0.045, 8, 24), wrapMat);
    wrap.name = 'fabric headwrap';
    wrap.rotation.x = Math.PI / 2;
    wrap.position.set(0, 1.88, 0);
    body.add(wrap);
    sharedSphere(THREE, body, 'headwrap knot', 0.075, [0.13, 1.96, -0.025], wrapMat, [1.15, 0.78, 0.8], 12);
  }

  for (const side of [-1, 1]) {
    sharedSphere(THREE, body, 'ear', 0.043, [side * 0.17, 1.75, 0], skinMat, [0.72, 1, 0.75], 12);
    sharedSphere(THREE, body, 'eye white', 0.027, [side * 0.067, 1.79, 0.166], mat('eye-white', '#efe4cf', 0.6), [1, 0.88, 0.56], 12);
    sharedSphere(THREE, body, 'eye iris', 0.012, [side * 0.067, 1.79, 0.183], mat('eye-iris', '#30231b', 0.5), [1, 1, 0.58], 10);
    box(body, 'eyebrow', [0.055, 0.012, 0.018], [side * 0.067, 1.835, 0.168], hairMat, { rotation: [0, 0, side * 0.08], castShadow: false });
  }
  sharedSphere(THREE, body, 'nose bridge', 0.033, [0, 1.74, 0.176], skinMat, [0.72, 1.28, 0.84], 12);
  sharedSphere(THREE, body, 'nose tip', 0.035, [0, 1.71, 0.197], skinMat, [0.9, 0.72, 0.85], 12);
  box(body, 'natural lip line', [0.068, 0.012, 0.012], [0, 1.665, 0.165], mat('lip-detail', '#683b34', 0.86), { castShadow: false });

  const limbs = { legs: [], arms: [], hands: [] };
  for (const side of [-1, 1]) {
    const legPivot = new THREE.Group();
    legPivot.position.set(side * 0.12, 0.86, 0);
    body.add(legPivot);
    const trouserLeg = new THREE.Mesh(sharedCapsule(THREE, 0.092, 0.54, 5, 10), pantsMat);
    trouserLeg.name = 'shaped trouser leg';
    trouserLeg.position.y = -0.37;
    trouserLeg.castShadow = true;
    trouserLeg.receiveShadow = true;
    legPivot.add(trouserLeg);
    sharedSphere(THREE, legPivot, 'knee seam', 0.096, [0, -0.56, 0], pantsMat, [0.93, 1, 0.9], 12);
    box(legPivot, 'leather shoe', [0.18, 0.11, 0.32], [0, -0.8, 0.075], shoeMat);
    box(legPivot, 'shoe sole', [0.185, 0.025, 0.33], [0, -0.86, 0.075], mat('shoe-sole', '#211e1a', 0.96));
    limbs.legs.push(legPivot);

    const armPivot = new THREE.Group();
    armPivot.position.set(side * 0.28, 1.38, 0);
    body.add(armPivot);
    const sleeve = new THREE.Mesh(sharedCapsule(THREE, 0.079, 0.23, 4, 10), shirtMat);
    sleeve.name = 'short sleeve';
    sleeve.position.set(0, -0.16, 0);
    sleeve.rotation.z = side * -0.12;
    sleeve.castShadow = true;
    armPivot.add(sleeve);
    sharedSphere(THREE, armPivot, 'elbow joint', 0.063, [0, -0.37, 0], skinMat, [0.95, 1, 0.9], 10);
    const forearm = new THREE.Mesh(sharedCapsule(THREE, 0.051, 0.24, 4, 9), skinMat);
    forearm.name = 'forearm';
    forearm.position.set(0, -0.54, 0.01);
    forearm.castShadow = true;
    armPivot.add(forearm);
    const cuff = new THREE.Mesh(sharedTorus(THREE, 0.055, 0.012, 5, 12), mat('shirt-cuff', '#d0b98b', 0.9));
    cuff.name = 'sleeve cuff';
    cuff.rotation.x = Math.PI / 2;
    cuff.position.set(0, -0.285, 0);
    armPivot.add(cuff);
    const hand = sharedSphere(THREE, armPivot, 'hand', 0.073, [0, -0.72, 0.025], skinMat, [0.76, 1.1, 0.78], 14);
    sharedSphere(THREE, armPivot, 'thumb', 0.033, [side * -0.055, -0.71, 0.07], skinMat, [0.8, 1.1, 0.8], 10);
    limbs.arms.push(armPivot);
    limbs.hands.push(hand);
  }

  if (bag) {
    const bagMat = mat('reusable-shopping-bag', '#826e50', 0.97);
    const bagGroup = new THREE.Group();
    bagGroup.name = 'reusable market shopping bag';
    bagGroup.position.set(0.35, 0.75, 0.08);
    group.add(bagGroup);
    box(bagGroup, 'reusable bag body', [0.25, 0.32, 0.12], [0, 0, 0], bagMat);
    box(bagGroup, 'bag reinforced base', [0.24, 0.035, 0.125], [0, -0.15, 0], mat('bag-base', '#594b37', 0.95));
    for (const side of [-1, 1]) {
      const handle = new THREE.Mesh(sharedTorus(THREE, 0.065, 0.014, 6, 14, Math.PI), mat('basket-handle', '#c69a62'));
      handle.name = 'shopping bag handle';
      handle.rotation.z = Math.PI;
      handle.position.set(side * 0.07, 0.18, 0);
      bagGroup.add(handle);
    }
    group.userData.bag = bagGroup;
  }

  group.userData.limbs = limbs;
  group.userData.body = body;
  group.userData.baseHeight = 1.98;
  group.userData.role = role;
  if (parent) parent.add(group);
  return { group, limbs };
}
