import { createMarketPerson } from './market-assets.js';

export function buildEcosystem({ THREE, scene, mat, box, cylinder, sphere }) {
  const targets = [];
  const animated = [];
  const vehicles = [];
  const stations = [];
  const pi = Math.PI;

  function labeledPanel(parent, title, subtitle, color, position, size = [4.6, 0.88]) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 144;
    const context = canvas.getContext('2d');
    context.fillStyle = color;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = 'rgba(255,255,255,.13)';
    context.fillRect(0, 0, 12, canvas.height);
    context.textAlign = 'center';
    context.fillStyle = '#fff8e6';
    context.font = 'bold 38px sans-serif';
    context.fillText(title, 256, 66, 480);
    context.fillStyle = 'rgba(255,255,255,.8)';
    context.font = '18px monospace';
    context.fillText(subtitle, 256, 108, 480);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
    const board = box(parent, `${title} information sign`, [size[0], size[1], 0.12], position, mat(`panel-${title}`, color));
    const face = new THREE.Mesh(new THREE.PlaneGeometry(size[0] - 0.1, size[1] - 0.1), material);
    face.position.set(position[0], position[1], position[2] + 0.067);
    parent.add(face);
    return board;
  }

  function label(text, position, color = '#344b3b', width = 4) {
    const group = new THREE.Group();
    group.position.set(...position);
    scene.add(group);
    box(group, 'wayfinding signpost', [0.09, 1.4, 0.09], [0, 0.7, 0], mat('wayfinding-post', '#6b5b43'));
    labeledPanel(group, text, 'CIRCULAR ECONOMY', color, [0, 1.53, 0], [width, 0.68]);
    return group;
  }

  function station(id, name, description, position, size, color) {
    const group = new THREE.Group();
    group.position.set(position[0], 0, position[1]);
    group.userData = { kind: 'facility', view: id, title: name, description };
    scene.add(group);
    const hit = new THREE.Mesh(new THREE.BoxGeometry(size[0], size[1], size[2]), new THREE.MeshBasicMaterial({
      transparent: true, opacity: 0, depthWrite: false, colorWrite: false
    }));
    hit.position.y = size[1] / 2;
    hit.userData = group.userData;
    group.add(hit);
    targets.push(hit);
    stations.push({ id, name, description, position: new THREE.Vector3(position[0], 0, position[1]), color });
    return group;
  }

  function addStageTarget(parent, view, title, description, position, size) {
    const target = new THREE.Mesh(new THREE.BoxGeometry(...size), new THREE.MeshBasicMaterial({
      transparent: true, opacity: 0, depthWrite: false, colorWrite: false
    }));
    target.position.set(...position);
    target.userData = { kind: 'facility', view, stage: 'PROCESSING STAGE', title, description };
    parent.add(target);
    targets.push(target);
    return target;
  }

  function floorPatch(x, z, width, depth, color, name) {
    const ground = box(scene, name, [width, 0.08, depth], [x, -0.02, z], mat(name, color), { castShadow: false });
    ground.receiveShadow = true;
    return ground;
  }

  function road(points, width = 4.2, color = '#615b50') {
    for (let i = 0; i < points.length - 1; i++) {
      const a = new THREE.Vector3(points[i][0], 0.015, points[i][1]);
      const b = new THREE.Vector3(points[i + 1][0], 0.015, points[i + 1][1]);
      const delta = b.clone().sub(a);
      const segment = box(scene, 'market access road', [width, 0.035, delta.length()], [0, 0.015, 0], mat('asphalt-road', color), { castShadow: false });
      segment.position.copy(a).add(b).multiplyScalar(0.5);
      segment.rotation.y = Math.atan2(delta.x, delta.z);
      segment.receiveShadow = true;
      const shoulder = new THREE.Mesh(new THREE.BoxGeometry(width + 0.38, 0.02, delta.length()), mat('road-shoulder', '#a69a7b'));
      shoulder.position.copy(segment.position);
      shoulder.position.y = -0.012;
      shoulder.rotation.y = segment.rotation.y;
      scene.add(shoulder);
      for (let dash = 0.12; dash < 0.9; dash += 0.22) {
        const mark = box(scene, 'road centre line', [0.11, 0.015, delta.length() * 0.12], [0, 0.039, 0], mat('road-marking', '#e7d8ac'), { castShadow: false });
        mark.position.copy(a).addScaledVector(delta, dash);
        mark.position.y = 0.04;
        mark.rotation.y = segment.rotation.y;
      }
    }
  }

  function pathLine(points, color, radius = 0.055) {
    const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
    const pipe = new THREE.Mesh(new THREE.TubeGeometry(curve, points.length * 12, radius, 6, false), mat(`flow-${color}`, color, 0.36, 0.12));
    pipe.name = 'visible circular material flow';
    scene.add(pipe);
    const arrows = [];
    for (let i = 0; i < 5; i++) {
      const arrow = new THREE.Mesh(new THREE.ConeGeometry(radius * 1.8, radius * 5, 6), mat(`flow-arrow-${color}`, color, 0.34, 0.12));
      scene.add(arrow);
      arrows.push(arrow);
    }
    const beads = [];
    for (let i = 0; i < 5; i++) {
      const bead = sphere(scene, 'animated resource flow marker', radius * 2.4, [0, 0, 0], mat(`flow-marker-${color}`, color, 0.25, 0.12), [1, 1, 1], 8);
      beads.push(bead);
    }
    animated.push((delta, elapsed) => {
      beads.forEach((bead, index) => {
        const offset = (elapsed * 0.07 + index / beads.length) % 1;
        bead.position.copy(curve.getPointAt(offset));
      });
      arrows.forEach((arrow, index) => {
        const offset = 0.12 + index * 0.17;
        arrow.position.copy(curve.getPointAt(offset));
        arrow.position.y += radius * 2.6;
        arrow.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), curve.getTangentAt(offset));
      });
    });
    return curve;
  }

  function plant(x, z, scale = 1, color = '#6e8746') {
    cylinder(scene, 'field crop stem', 0.025 * scale, 0.04 * scale, 0.38 * scale, [x, 0.19 * scale, z], mat('crop-stem', '#58703d'), 7);
    for (let leaf = 0; leaf < 5; leaf++) {
      const angle = leaf * 2.4;
      const foliage = sphere(scene, 'field crop leaf', 0.13 * scale, [x + Math.cos(angle) * 0.14 * scale, 0.24 * scale + (leaf % 2) * 0.05, z + Math.sin(angle) * 0.14 * scale], mat(`crop-leaf-${color}`, color), [1.65, 0.43, 0.72], 8);
      foliage.rotation.y = angle;
    }
  }

  function crate(parent, position, produce = false) {
    const group = new THREE.Group();
    group.position.set(...position);
    parent.add(group);
    box(group, 'reusable produce crate', [0.88, 0.52, 0.72], [0, 0.26, 0], mat('returnable-crate', '#986842'));
    box(group, 'crate inset', [0.68, 0.025, 0.52], [0, 0.53, 0], mat('crate-interior', '#40372e'));
    for (let side = -1; side <= 1; side += 2) {
      box(group, 'crate side slat', [0.06, 0.42, 0.72], [side * 0.35, 0.27, 0], mat('crate-slats', '#bd8a58'), { castShadow: false });
    }
    if (produce) for (let i = 0; i < 5; i++) {
      sphere(group, 'farm harvest produce', 0.15, [-0.25 + i * 0.12, 0.63 + (i % 2) * 0.04, (i % 2) * 0.16], mat(`harvest-fruit-${i}`, ['#d29a39', '#c2583c', '#789148'][i % 3]), [1, 0.92, 0.9], 9);
    }
    return group;
  }

  function person(parent, position, shirt, role = 'worker') {
    return createMarketPerson({
      THREE, parent, position, shirt, role, skin: '#79503b', pants: '#474038',
      hair: '#261c16', mat, box, cylinder
    }).group;
  }

  function makeVehicle(name, color, route, kind = 'truck') {
    const vehicle = new THREE.Group();
    vehicle.name = name;
    scene.add(vehicle);
    const paint = mat(`vehicle-${color}`, color, 0.56, 0.22);
    const glass = mat('vehicle-glass', '#72908d', 0.27, 0.12);
    box(vehicle, 'vehicle chassis', [1.72, 0.32, 3.2], [0, 0.68, 0], mat('vehicle-chassis', '#343633'));
    box(vehicle, 'vehicle body', [1.78, 0.85, 2.12], [0, 1.16, -0.32], paint);
    box(vehicle, 'driver cab', [1.72, 1.04, 1.1], [0, 1.26, 0.98], paint);
    box(vehicle, 'front windscreen', [1.37, 0.62, 0.035], [0, 1.43, 1.55], glass);
    box(vehicle, 'left side window', [0.035, 0.54, 0.61], [-0.88, 1.46, 1.02], glass);
    box(vehicle, 'right side window', [0.035, 0.54, 0.61], [0.88, 1.46, 1.02], glass);
    box(vehicle, 'front bumper', [1.92, 0.18, 0.15], [0, 0.55, 1.67], mat('vehicle-bumper', '#9c967f', 0.5, 0.45));
    for (const side of [-1, 1]) for (const z of [-1.03, 1.05]) {
      const wheel = cylinder(vehicle, 'vehicle tyre', 0.33, 0.33, 0.19, [side * 0.92, 0.38, z], mat('vehicle-tire', '#242522', 0.91), 12, [0, 0, pi / 2]);
      cylinder(vehicle, 'wheel hub', 0.16, 0.16, 0.205, [side * 0.93, 0.38, z], mat('vehicle-hub', '#aaa185', 0.45, 0.7), 10, [0, 0, pi / 2]);
      vehicle.userData.wheels = [...(vehicle.userData.wheels || []), wheel];
    }
    for (const side of [-1, 1]) {
      box(vehicle, 'vehicle headlight', [0.28, 0.2, 0.06], [side * 0.61, 0.82, 1.65], mat('headlamp', '#e5d7a9', 0.3, 0.3));
    }
    if (kind === 'farm') {
      for (let row = 0; row < 2; row++) for (let col = -1; col <= 1; col++) crate(vehicle, [col * 0.48, 1.61, -0.95 + row * 0.78], true);
      box(vehicle, 'crate truck tailgate', [1.9, 0.65, 0.09], [0, 1.15, -1.42], mat('tailgate-wood', '#805a3b'));
    } else if (kind === 'fertiliser') {
      for (let i = 0; i < 5; i++) {
        cylinder(vehicle, 'organic liquid fertiliser transport container', 0.18, 0.2, 0.6, [-0.55 + (i % 3) * 0.55, 1.55, -0.88 + Math.floor(i / 3) * 0.8], mat('transport-fertiliser', '#bf9e58'), 9);
      }
      box(vehicle, 'fertiliser transport placard', [1.1, 0.32, 0.05], [0, 1.96, -1.38], mat('transport-label', '#596d46'));
    } else if (kind === 'organic') {
      for (let i = 0; i < 4; i++) {
        const sack = sphere(vehicle, 'organic collection sacks', 0.3, [-0.48 + (i % 2) * 0.85, 1.54, -0.8 + Math.floor(i / 2) * 0.9], mat(`organic-sack-${i}`, '#8b7854'), [1, 0.78, 1.2], 9);
        sack.rotation.z = (i % 2 ? 0.15 : -0.12);
      }
    } else {
      box(vehicle, 'recovery vehicle cargo box', [1.47, 0.74, 1.7], [0, 1.28, -0.35], mat('cargo-panel', '#657362'));
      for (let row = 0; row < 2; row++) for (let col = -1; col <= 1; col++) crate(vehicle, [col * 0.39, 1.69, -0.82 + row * 0.78], false);
    }
    const driver = person(vehicle, [0, 0, 0.92], '#6b7953', 'driver');
    driver.scale.set(0.56, 0.56, 0.56);
    vehicle.userData.driver = driver;
    const curve = new THREE.CatmullRomCurve3(route.map(([x, z]) => new THREE.Vector3(x, 0, z)), true, 'catmullrom', 0.08);
    let progress = Math.random();
    let deliveryCrate = null;
    if (name === 'produce delivery pickup') {
      let closestDistance = Infinity;
      for (let sample = 0; sample <= 300; sample++) {
        const candidate = sample / 300;
        const position = curve.getPointAt(candidate);
        const distance = Math.hypot(position.x + 3, position.z - 8);
        if (distance < closestDistance) {
          closestDistance = distance;
          progress = candidate;
        }
      }
      deliveryCrate = crate(scene, [-3, 0, 8], true);
      deliveryCrate.visible = false;
    }
    vehicles.push({ group: vehicle, curve, speed: kind === 'organic' ? 4.1 : 3.3, progress, kind, deliveryCrate, deliveryState: null, nextDelivery: 1 });
    return vehicle;
  }

  // Large shared estate, access road and clearly separated land-use zones.
  floorPatch(0, -13, 118, 63, '#b8aa89', 'shared circular economy grounds');
  road([[-54, 17], [-36, 17], [-23, 17], [-9, 17], [9, 17], [23, 17], [39, 17], [55, 17]], 4.8);
  road([[-25, 17], [-25, 9], [-25, -5], [-25, -18], [-25, -31]], 4.2);
  road([[-25, -31], [-19, -31], [-10, -31], [0, -31], [14, -31], [28, -31], [42, -31], [52, -31]], 4.2);
  road([[52, -31], [52, -19], [49, -8], [48, 4], [48, 17]], 4.2);
  road([[0, -31], [0, -18], [0, -6], [0, 7]], 3.5);
  road([[-25, -18], [-35, -18], [-45, -18], [-50, -18], [-50, -26]], 3.5);

  // Farm plots and shaded crop rows, on the western edge of the shared road.
  floorPatch(-41, -31, 25, 18, '#7f805a', 'community agricultural plots');
  for (let row = 0; row < 9; row++) {
    const z = -38.2 + row * 1.8;
    for (let col = 0; col < 14; col++) {
      const x = -52.2 + col * 1.7;
      plant(x, z, 0.78 + (col % 3) * 0.06, row % 3 ? '#6f8b49' : '#82944e');
    }
    box(scene, 'field irrigation line', [22.8, 0.035, 0.035], [-41, 0.045, z + 0.68], mat('irrigation-pipe', '#739184', 0.45, 0.3), { castShadow: false });
    for (let nozzle = 0; nozzle < 6; nozzle++) {
      cylinder(scene, 'drip irrigation emitter', 0.035, 0.035, 0.16, [-51 + nozzle * 3.9, 0.12, z + 0.68], mat('irrigation-nozzle', '#9aaf9b'), 6);
    }
  }
  station('farm', 'COMMUNITY FARM', 'Farmers apply recovered organic liquid fertiliser to crop rows. Healthy vegetables are harvested into reusable crates and returned to the market.', [-41, -31], [25, 2, 18], '#687c47');
  label('FARM TO MARKET', [-40, -22.4], '#596d43', 4.6);
  const farmWorker = person(scene, [-43, 0, -29], '#718146', 'farmer');
  const fertiliserCan = cylinder(farmWorker, 'liquid fertiliser carried to crops', 0.12, 0.14, 0.42, [0.35, 0.7, 0], mat('fertiliser-can', '#c8aa65'), 10);
  fertiliserCan.rotation.z = pi / 2;
  labeledPanel(scene, 'FERTILISER APPLICATION', 'RECOVERED BIOSLURRY · FARM TRIAL', '#687c4a', [-43, 2.45, -27.3], [5.8, 0.66]);
  const sprayCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-43.35, 1.15, -29),
    new THREE.Vector3(-44.15, 0.82, -28.65),
    new THREE.Vector3(-45, 0.24, -28.4)
  ]);
  const fertiliserDrops = [];
  for (let i = 0; i < 4; i++) {
    fertiliserDrops.push(sphere(scene, 'fertiliser applied to crop soil', 0.045, [0, 0, 0], mat('fertiliser-droplet', '#e1c66c', 0.28, 0.08), [1, 1.3, 1], 7));
  }
  animated.push((delta, elapsed) => {
    fertiliserDrops.forEach((drop, index) => {
      drop.position.copy(sprayCurve.getPointAt((elapsed * 0.32 + index / fertiliserDrops.length) % 1));
    });
  });
  for (const x of [-47, -38, -33]) crate(scene, [x, 0, -40], true);
  const harvest = person(scene, [-36, 0, -39], '#9b6848', 'harvest worker');
  harvest.rotation.y = pi / 2;

  // Biogas plant: intake/sorting, shredding, mixing, sealed digester and outputs.
  floorPatch(-11, -30.5, 25, 18, '#8a8b7b', 'organic processing yard');
  const organicFacility = station('biogas', 'BIOGAS & ORGANIC RECOVERY', 'Organic scraps are sorted for contaminants, shredded and mixed with water. The sealed anaerobic digester produces biogas, nutrient-rich bioslurry and solid digestate. Biological outputs require appropriate handling and quality checks.', [-11, -30.5], [25, 3, 17], '#60764b');
  box(organicFacility, 'organic processing shed', [9, 4.1, 5], [-7.3, 2.05, -5.3], mat('process-shed-wall', '#867b61'));
  box(organicFacility, 'processing roof', [9.6, 0.2, 5.5], [-7.3, 4.17, -5.3], mat('shed-roof', '#56584e', 0.65, 0.15));
  labeledPanel(organicFacility, 'ORGANIC PREPARATION', 'SORT · SHRED · MIX', '#5c7146', [-7.3, 3.65, -2.46], [6.8, 0.72]);
  addStageTarget(organicFacility, 'biogas', 'SORT, SHRED & MIX', 'Workers remove unsuitable contaminants, shred the organic scraps and add water to create a uniform slurry before digestion.', [-5.7, 1.65, -2.9], [7, 3, 2]);
  // Receiving hopper and enclosed slow-turning shredder.
  box(organicFacility, 'waste receiving table', [3.1, 0.18, 1.8], [-9.2, 1.35, -2.4], mat('steel-table', '#77796c', 0.48, 0.38));
  const hopper = cylinder(organicFacility, 'organic waste receiving hopper', 0.36, 0.85, 0.9, [-9.2, 1.85, -3.1], mat('hopper-metal', '#858578', 0.56, 0.52), 8);
  hopper.rotation.x = pi / 2;
  box(organicFacility, 'shredder casing', [1.55, 1.55, 1.15], [-5.7, 1.06, -2.9], mat('shredder-housing', '#4b5c53', 0.52, 0.36));
  cylinder(organicFacility, 'shredder feed drum', 0.42, 0.42, 0.95, [-5.7, 1.12, -2.25], mat('shredder-drum', '#b48a50', 0.4, 0.52), 12, [pi / 2, 0, 0]);
  const shredWheel = cylinder(organicFacility, 'shredder flywheel', 0.48, 0.48, 0.08, [-5.7, 1.06, -2.27], mat('flywheel', '#bd9a57', 0.4, 0.6), 12, [pi / 2, 0, 0]);
  animated.push((delta) => { shredWheel.rotation.z += delta * 0.7; });
  cylinder(organicFacility, 'clean process water tank', 0.52, 0.48, 1.75, [-0.05, 0.91, -2.9], mat('process-water-tank', '#668c87', 0.36, 0.24), 14);
  cylinder(organicFacility, 'water tank cover', 0.54, 0.54, 0.1, [-0.05, 1.83, -2.9], mat('water-tank-cover', '#d2c49c', 0.43, 0.3), 14);
  box(organicFacility, 'water-to-slurry pipe', [1.5, 0.09, 0.09], [-1.1, 1.64, -2.9], mat('water-pipe', '#83a99e', 0.33, 0.48));
  labeledPanel(organicFacility, 'WATER ADDITION', 'MAKE A UNIFORM SLURRY', '#557c77', [-0.05, 2.45, -2.15], [3.8, 0.52]);
  box(organicFacility, 'slurry mixing vessel', [1.7, 1.9, 1.7], [-2.1, 1.2, -2.9], mat('mixing-tank', '#748779', 0.42, 0.35));
  cylinder(organicFacility, 'mixing vessel lid', 0.88, 0.88, 0.13, [-2.1, 2.2, -2.9], mat('mixing-lid', '#515e55', 0.42, 0.4));
  cylinder(organicFacility, 'mixing shaft', 0.065, 0.065, 1.1, [-2.1, 1.87, -2.9], mat('mixing-shaft', '#d2bd85', 0.3, 0.75));
  for (const side of [-1, 1]) box(organicFacility, 'mixer paddle', [0.72, 0.09, 0.11], [-2.1 + side * 0.28, 1.58, -2.9], mat('mixer-paddle', '#c6ad70', 0.4, 0.65));
  const mixer = new THREE.Group();
  mixer.position.set(-2.1, 1.87, -2.9);
  organicFacility.add(mixer);
  animated.push((delta) => { mixer.rotation.y += delta * 0.45; });

  // Gas-tight tank and cutaway panel reveal a biological process, not a burner.
  const digester = cylinder(organicFacility, 'sealed anaerobic digester', 2.75, 2.55, 5.1, [1.2, 2.65, -6.5], mat('digester-steel', '#82918a', 0.38, 0.42), 28);
  const dome = new THREE.Mesh(new THREE.SphereGeometry(2.42, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mat('digester-dome', '#9aa397', 0.34, 0.4));
  dome.position.set(1.2, 5.2, -6.5);
  dome.castShadow = true;
  organicFacility.add(dome);
  cylinder(organicFacility, 'digester top rim', 2.76, 2.76, 0.13, [1.2, 4.9, -6.5], mat('tank-rim', '#d0c9ad', 0.38, 0.65), 28);
  for (let level = 0; level < 4; level++) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(2.58, 0.045, 6, 32), mat('tank-banding', '#d0c8b1', 0.36, 0.6));
    ring.position.set(1.2, 0.75 + level * 1.17, -6.5);
    ring.rotation.x = pi / 2;
    organicFacility.add(ring);
  }
  const cutaway = box(organicFacility, 'digester inspection window', [1.7, 2.15, 0.09], [1.2, 2.55, -3.91], mat('cutaway-frame', '#323a35', 0.32, 0.48));
  const inside = box(organicFacility, 'digester biological slurry cutaway', [1.46, 1.58, 0.05], [1.2, 2.34, -3.85], mat('digester-slurry', '#795d37', 0.34, 0.05));
  inside.material.transparent = true;
  inside.material.opacity = 0.84;
  const biologyParticles = [];
  for (let i = 0; i < 7; i++) {
    const particle = sphere(organicFacility, 'anaerobic biological activity', 0.12 + (i % 2) * 0.06, [0.62 + (i % 4) * 0.38, 1.75 + (i % 3) * 0.5, -3.79], mat(`biogas-microbe-${i}`, i % 2 ? '#c1a55f' : '#b98b4b'), [1, 0.8, 0.45], 8);
    biologyParticles.push({ particle, baseY: particle.position.y, phase: i * 0.9 });
  }
  animated.push((delta, elapsed) => {
    biologyParticles.forEach(({ particle, baseY, phase }) => {
      particle.position.y = baseY + Math.sin(elapsed * 1.5 + phase) * 0.09;
      particle.scale.setScalar(0.9 + (Math.sin(elapsed * 2 + phase) + 1) * 0.08);
    });
  });
  labeledPanel(organicFacility, 'ANAEROBIC DIGESTER', 'SEALED BIOLOGICAL PROCESS', '#607568', [1.2, 5.95, -3.75], [5.4, 0.74]);
  addStageTarget(organicFacility, 'biogas', 'SEALED ANAEROBIC DIGESTER', 'Inside the gas-tight vessel, microorganisms break down suitable organic matter without oxygen. This biological process creates biogas and digestate; it is not an ordinary combustion chamber.', [1.2, 3, -6.5], [5.8, 7, 5.8]);
  cylinder(organicFacility, 'biogas dome outlet', 0.12, 0.12, 0.75, [1.2, 5.65, -6.5], mat('gas-pipe', '#86a46e', 0.3, 0.45));
  const gasMeter = cylinder(organicFacility, 'biogas meter', 0.43, 0.43, 0.56, [3.8, 3.2, -6.5], mat('gas-meter', '#8eaa76', 0.36, 0.35), 16);
  const dial = new THREE.Mesh(new THREE.CircleGeometry(0.27, 16), mat('gas-meter-dial', '#e6d9b8', 0.44));
  dial.position.set(3.8, 3.22, -6.2);
  organicFacility.add(dial);
  pathLine([[1.2, 5.65, -6.5], [1.2, 6.05, -4.5], [3.5, 6.05, -4.5], [5.2, 4.2, -4.5], [7, 3.0, -4.5], [14, 3.0, -4.5], [20, 3.0, 2]], '#b7cd82', 0.075);
  for (let i = 0; i < 4; i++) {
    sphere(scene, 'biogas pipe flow marker', 0.1, [0, 0, 0], mat('gas-flow-marker', '#e5cc7e', 0.24, 0.1), [1, 1, 1], 8);
  }
  // Bioslurry storage and labelled filling line.
  cylinder(organicFacility, 'bioslurry storage tank', 1.16, 1.08, 2.7, [6.2, 1.39, -7.5], mat('bioslurry-tank', '#727f6c', 0.42, 0.34), 20);
  cylinder(organicFacility, 'fertiliser tank roof', 1.17, 1.17, 0.14, [6.2, 2.78, -7.5], mat('fertiliser-tank-roof', '#d0b779', 0.4, 0.45), 20);
  labeledPanel(organicFacility, 'ORGANIC LIQUID FERTILISER', 'BIOSLURRY · HANDLED SAFELY', '#667b4c', [6.2, 3.43, -6.28], [6.2, 0.76]);
  addStageTarget(organicFacility, 'biogas', 'BIOSLURRY STORAGE & FILLING', 'Nutrient-rich liquid digestate is collected in a storage tank and filled into labelled containers for appropriate handling and agricultural use.', [6.2, 1.9, -6.2], [4.5, 4, 4]);
  box(organicFacility, 'fertiliser bottling bench', [3.1, 0.16, 1.05], [6.2, 0.83, -4.5], mat('filling-bench', '#76674c'));
  for (let i = 0; i < 4; i++) {
    const bottle = cylinder(organicFacility, 'labelled liquid fertiliser container', 0.15, 0.19, 0.54, [5.15 + i * 0.68, 1.19, -4.5], mat(`fertiliser-bottle-${i}`, '#b79b5d', 0.32, 0.1), 10);
    bottle.rotation.z = (i % 2) * 0.06;
    labeledPanel(organicFacility, 'ORGANIC LIQUID FERTILISER', 'FOR SOIL APPLICATION', '#687c4a', [5.5, 2.06, -3.83], [4.7, 0.5]);
    if (i > 0) break;
  }
  pathLine([[6.2, 2.6, -7.5], [7.6, 1.2, -7.5], [9.3, 1.2, -7.5], [10, 0.5, -9], [10.5, 0.2, -16], [7, 0.15, -23], [-30, 0.15, -27], [-42, 0.15, -29]], '#d8b962', 0.052);
  pathLine([[-13.7, 0.28, 6.6], [-22, 0.28, 8], [-25, 0.28, 8], [-25, 0.28, -17], [-25, 0.28, -31], [-17, 0.28, -31], [-11, 0.28, -30.5]], '#79a24e', 0.05);
  pathLine([[-49, 0.28, -28], [-40, 0.28, -31], [-25, 0.28, -31], [-25, 0.28, -17], [-25, 0.28, 15], [-12, 0.28, 17], [-3, 0.28, 12], [-3, 0.28, 8]], '#ddc178', 0.052);

  // Covered BSF recovery zone with cautious feed/quality-control interpretation.
  floorPatch(-1, -24, 15, 7, '#887a62', 'digestate recovery and insect processing area');
  const bsfRoof = box(scene, 'shaded larvae recovery canopy', [8.8, 0.14, 5.4], [-1, 2.75, -24], mat('shade-cloth', '#596858', 0.78, 0), { castShadow: true });
  bsfRoof.material.transparent = true;
  bsfRoof.material.opacity = 0.84;
  for (let side = -1; side <= 1; side += 2) for (let end = -1; end <= 1; end += 2) box(scene, 'larvae shed posts', [0.12, 2.65, 0.12], [-1 + side * 4.2, 1.32, -24 + end * 2.45], mat('shed-post', '#70563b'));
  for (let row = 0; row < 3; row++) {
    box(scene, 'BSF larvae substrate tray', [2.4, 0.18, 0.92], [-3.35 + row * 2.35, 0.66, -24], mat('larvae-tray', '#594b3d'));
    for (let larva = 0; larva < 7; larva++) {
      const grub = sphere(scene, 'black soldier fly larvae', 0.075, [-4.25 + row * 2.35 + (larva % 4) * 0.34, 0.8, -24.24 + Math.floor(larva / 4) * 0.35], mat(`larvae-${larva}`, '#d5c795'), [1.45, 0.55, 0.6], 7);
      grub.rotation.z = (larva % 2) * 0.3;
    }
  }
  addStageTarget(scene, 'biogas', 'DIGESTATE & LARVAE RECOVERY', 'Suitable solid digestate and organic residue enter a shaded black soldier fly recovery area. Larvae and frass are collected separately; potential animal feed is processed and quality-checked before any use.', [-1, 1.4, -24], [10, 4, 6]);
  labeledPanel(scene, 'BLACK SOLDIER FLY RECOVERY', 'CONTROLLED TRIAL · QUALITY CHECKS', '#595c43', [-1, 2.25, -20.95], [6.9, 0.7]);
  box(scene, 'feed safety checkpoint table', [3.5, 0.15, 1.1], [5.7, 0.82, -24], mat('qc-bench', '#6d654f'));
  person(scene, [5.1, 0, -23.6], '#a26e47', 'quality control worker');
  labeledPanel(scene, 'LARVAE-BASED ANIMAL FEED', 'PROCESSING + QUALITY CONTROL REQUIRED', '#816a44', [5.7, 2.0, -22.9], [6.5, 0.65]);
  cylinder(scene, 'frass compost storage', 0.73, 0.73, 1.6, [8.5, 0.82, -24.5], mat('frass-compost', '#5e4936'), 16);
  labeledPanel(scene, 'FRASS COMPOST', 'NUTRIENT-RICH SOIL AMENDMENT', '#68563b', [8.5, 1.92, -23.75], [4.3, 0.58]);
  pathLine([[1.2, 0.85, -8.4], [0.5, 0.8, -14], [-1, 0.8, -20]], '#b6a36e', 0.045);

  // Plastic sorting, cleaning, repair, upcycling and final recycling are distinct bays.
  floorPatch(21, -30.5, 27, 18, '#858b84', 'plastic recovery workshop yard');
  const plasticFacility = station('plastic', 'PLASTIC REUSE & RECOVERY WORKSHOP', 'Plastic follows the resource hierarchy: reduce, reuse, repair and repurpose suitable material first. Only remaining suitable material proceeds to recycling.', [21, -30.5], [27, 3, 17], '#43858b');
  box(plasticFacility, 'plastic workshop building', [18, 4.5, 5.4], [0, 2.25, -5.9], mat('plastic-building', '#71847c'));
  box(plasticFacility, 'plastic workshop roof', [18.5, 0.22, 5.8], [0, 4.56, -5.9], mat('plastic-roof', '#4d5e59', 0.58, 0.18));
  labeledPanel(plasticFacility, 'PLASTIC RECOVERY WORKSHOP', 'KEEP MATERIALS USEFUL', '#417981', [0, 3.95, -3.13], [9, 0.76]);
  const plasticStages = [
    { x: -7.6, title: 'REDUCE', color: '#566d58' },
    { x: -4.5, title: 'SORT & WASH', color: '#426f74' },
    { x: -1.5, title: 'REUSE', color: '#4c795c' },
    { x: 1.5, title: 'REPAIR', color: '#917449' },
    { x: 4.5, title: 'REPURPOSE', color: '#8a6343' },
    { x: 7.6, title: 'RECYCLE LAST', color: '#586870' }
  ];
  for (const stage of plasticStages) {
    box(plasticFacility, `${stage.title} workbench`, [2.4, 0.15, 1.5], [stage.x, 0.83, -2.9], mat(`plastic-bench-${stage.title}`, '#786647'));
    labeledPanel(plasticFacility, stage.title, stage.title === 'RECYCLE LAST' ? 'ONLY UNSUITABLE FOR REUSE' : 'PRESERVE MATERIAL VALUE', stage.color, [stage.x, 2.0, -2.0], [2.9, 0.56]);
    person(plasticFacility, [stage.x - 0.65, 0, -1.85], ['#658378', '#829159', '#b48555', '#986d52', '#6e7c84', '#63808a'][plasticStages.indexOf(stage)], `${stage.title.toLowerCase()} worker`);
    addStageTarget(plasticFacility, 'plastic', stage.title, stage.title === 'RECYCLE LAST'
      ? 'Only suitable material that cannot reasonably be reused, repaired or repurposed proceeds to shredding, washing, drying and recycled-material production.'
      : `Workers inspect plastic and ${stage.title.toLowerCase()} suitable products to preserve material value before recycling.`, [stage.x, 1.45, -2.5], [3.0, 2.8, 2]);
  }
  for (let i = 0; i < 4; i++) {
    const bottle = cylinder(plasticFacility, 'sorted plastic bottle', 0.11, 0.14, 0.48, [-7.7 + i * 0.55, 1.17, -2.9], mat('sorted-plastic', '#8ab5a8', 0.22, 0.08), 9);
    bottle.rotation.z = i * 0.12;
  }
  for (let i = 0; i < 3; i++) {
    const planter = cylinder(plasticFacility, 'upcycled plastic planter', 0.37, 0.29, 0.5, [3.9 + i * 1.08, 1.15, -2.75], mat(`planter-${i}`, ['#548267', '#8f6248', '#497d89'][i]), 10);
    planter.material.side = THREE.DoubleSide;
    plant(21 + 3.9 + i * 1.08, -30.5 - 2.75, 0.4, '#67874c');
  }
  // Recycling is physically placed at the far end of the hierarchy.
  const shredder = box(plasticFacility, 'plastic flake shredder', [1.9, 1.65, 1.5], [9.0, 1.02, -2.9], mat('plastic-shredder', '#526267', 0.45, 0.4));
  cylinder(plasticFacility, 'plastic shredder intake', 0.48, 0.48, 0.12, [9.0, 1.26, -2.08], mat('shredder-intake', '#b4a779', 0.42, 0.4), 12, [pi / 2, 0, 0]);
  cylinder(plasticFacility, 'recycled material pellets', 0.44, 0.44, 1.15, [10.75, 0.59, -2.9], mat('recycled-plastic-pellets', '#71827a'), 14);
  for (let i = 0; i < 5; i++) sphere(plasticFacility, 'washed plastic flakes', 0.09, [9.9 + (i % 3) * 0.22, 1.8, -2.7 + (i % 2) * 0.28], mat(`plastic-flake-${i}`, i % 2 ? '#94b9ac' : '#c7ae70'), [1.4, 0.45, 0.8], 7);
  pathLine([[0, 0.3, 7], [8, 0.3, 15], [18, 0.3, 13], [22, 0.3, 3], [22, 0.3, -15], [21, 0.3, -22]], '#55aab1', 0.055);

  // Separate metal recovery shed with reuse bench followed by scrap sorting.
  floorPatch(45, -19, 18, 14, '#8a887d', 'metal recovery yard');
  const metalFacility = station('metal', 'METAL SORTING & RECOVERY', 'Suitable metal is sorted and cleaned. Useful objects are considered for reuse first; remaining recyclable cans and scrap are prepared for a separate metal-recycling route.', [45, -19], [18, 3, 13], '#a87a3d');
  box(metalFacility, 'metal workshop', [10.5, 4.2, 4.4], [0, 2.1, -3], mat('metal-shed', '#7e7b6d'));
  box(metalFacility, 'metal shop roof', [11, 0.2, 4.9], [0, 4.24, -3], mat('metal-roof', '#55564f', 0.55, 0.23));
  labeledPanel(metalFacility, 'METAL SORT & REUSE', 'RECOVER VALUE FIRST', '#96703e', [0, 3.6, -0.72], [7.6, 0.7]);
  addStageTarget(metalFacility, 'metal', 'SORT, CLEAN & REUSE', 'Empty cans and suitable scrap are sorted and cleaned. Useful objects are considered for direct reuse before remaining recyclable metal enters a separate recovery process.', [-2, 1.5, -0.6], [5.5, 3, 2.8]);
  box(metalFacility, 'metal sorting bench', [3.7, 0.17, 1.6], [-2.4, 0.9, -0.7], mat('metal-workbench', '#756a51'));
  box(metalFacility, 'metal reuse shelf', [2.7, 0.13, 0.8], [1.0, 1.3, -1.0], mat('reuse-shelf', '#80654a'));
  for (let i = 0; i < 5; i++) {
    const can = cylinder(metalFacility, 'sorted empty can', 0.12, 0.12, 0.24, [-3.5 + i * 0.5, 1.15, -0.65], mat(`metal-can-${i}`, '#b3a78a', 0.28, 0.65), 10, [0, 0, (i % 2) * 0.2]);
    can.rotation.z = (i % 2) * 0.35;
  }
  const metalFurnace = box(metalFacility, 'metal recycling furnace housing', [2.7, 2.6, 2.1], [4, 1.32, -1], mat('furnace-housing', '#474c46', 0.46, 0.35));
  box(metalFacility, 'furnace mouth', [1.2, 0.8, 0.07], [4, 1.1, 0.1], mat('furnace-mouth', '#a46942', 0.4, 0.15));
  sphere(metalFacility, 'recovered metal ingot', 0.3, [4.0, 2.85, -0.7], mat('metal-ingot', '#c5ad78', 0.25, 0.75), [1.3, 0.45, 0.8], 10);
  labeledPanel(metalFacility, 'METAL RECYCLING', 'SEPARATE MATERIAL STREAM', '#75654a', [4, 3.05, 0.11], [5.6, 0.64]);
  addStageTarget(metalFacility, 'metal', 'METAL RECYCLING', 'Remaining recyclable metal is handled in its own material stream and recovered as feedstock for new products. It is never mixed into organic processing.', [4, 1.6, -1], [4.4, 3.7, 3.8]);
  person(metalFacility, [-4.3, 0, 0], '#8f7150', 'metal sorting worker');
  person(metalFacility, [2.5, 0, 0.4], '#5b7772', 'metal recovery worker');
  pathLine([[13.7, 0.3, 6.6], [23, 0.3, 14], [34, 0.3, 17], [44, 0.3, 12], [46, 0.3, 0]], '#d1a256', 0.05);

  // Cooking point at the market uses the biogas line; the flame is a tiny safe appliance.
  const stove = new THREE.Group();
  stove.position.set(18, 0, 2);
  scene.add(stove);
  box(stove, 'market cooking counter', [3.6, 0.95, 1.5], [0, 0.48, 0], mat('cooking-counter', '#74573e'));
  box(stove, 'biogas cooking hob', [1.05, 0.16, 0.9], [0, 1.04, 0], mat('hob-top', '#45453d', 0.35, 0.4));
  cylinder(stove, 'biogas burner ring', 0.35, 0.35, 0.07, [0, 1.15, 0], mat('burner-ring', '#c2b58e', 0.32, 0.7), 16);
  const flameMat = new THREE.MeshStandardMaterial({ color: '#9dc993', emissive: '#6eaf7c', emissiveIntensity: 1.3, transparent: true, opacity: 0.8 });
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.5, 8), flameMat);
  flame.position.set(0, 1.45, 0);
  stove.add(flame);
  animated.push((delta, elapsed) => {
    flame.scale.y = 0.82 + Math.sin(elapsed * 8) * 0.14;
    flame.material.emissiveIntensity = 1.0 + Math.sin(elapsed * 6) * 0.35;
  });
  labeledPanel(scene, 'BIOGAS COOKING', 'RENEWABLE GAS AT THE MARKET', '#627d55', [18, 2.25, 3.1], [5.8, 0.68]);
  pathLine([[20, 3, -4.5], [20, 3, -1.5], [18, 2.7, 0]], '#b7cd82', 0.07);

  // Wayfinding also helps explain the three independent waste streams.
  label('ORGANIC → BIOGAS + SOIL', [-11, -20.2], '#5c7549', 5.2);
  label('PLASTIC → KEEP IN USE', [21, -20.7], '#427e83', 5.0);
  label('METAL → RECOVER + REUSE', [45, -10.2], '#957042', 5.2);
  label('MARKET · HARARE', [0, 15], '#556c4b', 4.5);

  // Crate-return rack links the harvest circuit to the delivery vehicles.
  for (let tier = 0; tier < 2; tier++) for (let slot = 0; slot < 4; slot++) {
    crate(scene, [-23.8 + slot * 1.0, tier * 0.62, 10.1], false);
  }
  labeledPanel(scene, 'RETURNABLE CRATE DEPOT', 'FARM → MARKET → FARM', '#6e684a', [-22.3, 2.15, 11.9], [6.5, 0.66]);
  const receivingWorker = person(scene, [-4.9, 0, 9.4], '#9b6848', 'produce receiving worker');
  receivingWorker.rotation.y = Math.PI / 2;

  // Vehicles follow the marked loop roads; offsets keep traffic spaced and collision-free.
  makeVehicle('produce delivery pickup', '#55724d', [
    [-49, -18], [-48, -30], [-40, -33], [-26, -31], [-25, -22], [-25, 15], [-20, 17], [-5, 17], [-3, 12], [-3, 8],
    [-3, 14], [-12, 17], [-25, 17], [-25, -10], [-25, -30], [-38, -31], [-49, -28]
  ], 'farm');
  makeVehicle('organic collection vehicle', '#69764b', [
    [6, 8], [-3, 10], [-13.7, 6.6], [-22, 8], [-25, 8], [-25, 2], [-25, -17], [-25, -29], [-17, -31], [-10, -31],
    [-25, -31], [-25, -17], [-25, 2], [-25, 8], [-22, 8], [-13.7, 6.6], [2, 10]
  ], 'organic');
  makeVehicle('plastic recovery pickup', '#46818a', [
    [5, 12], [0, 7.2], [8, 15], [15, 17], [29, 17], [43, 17], [48, 9], [48, -8], [43, -18], [30, -31], [21, -31],
    [28, -31], [48, -19], [48, -8], [48, 9], [43, 17], [29, 17], [15, 17]
  ], 'recovery');
  makeVehicle('metal can and scrap collection pickup', '#a47a42', [
    [13.7, 6.6], [23, 14], [34, 17], [48, 17], [48, 8], [48, -8], [45, -15], [45, -19],
    [48, -8], [48, 8], [48, 17], [34, 17], [23, 14]
  ], 'recovery');
  makeVehicle('bioslurry fertiliser distribution and returnable crate truck', '#9a6944', [
    [-12, -31], [-24, -31], [-37, -31], [-49, -29], [-49, -18], [-25, -17], [-25, 16], [-10, 17], [0, 16],
    [0, 8], [-3, 14], [-12, 17], [-25, 17], [-25, -17], [-25, -31], [-12, -31]
  ], 'fertiliser');

  const focusViews = {
    biogas: { camera: new THREE.Vector3(-3, 17, -7), target: new THREE.Vector3(-11, 1.2, -30.5) },
    farm: { camera: new THREE.Vector3(-20, 17, -12), target: new THREE.Vector3(-41, 0.8, -31) },
    plastic: { camera: new THREE.Vector3(39, 17, -7), target: new THREE.Vector3(21, 1.1, -30.5) },
    metal: { camera: new THREE.Vector3(59, 13, -3), target: new THREE.Vector3(45, 1.2, -19) }
  };

  function update(delta, elapsed) {
    animated.forEach(animation => animation(delta, elapsed));
    for (const vehicle of vehicles) {
      let point = vehicle.curve.getPointAt(vehicle.progress);
      const nearMarket = point.z > -13 && Math.hypot(point.x, point.z - 7) < 24;
      const deliveryPoint = Math.hypot(point.x + 3, point.z - 8) < 4.8;
      const trafficFactor = vehicle.deliveryState ? 0 : nearMarket ? 0.5 : 1;
      vehicle.progress = (vehicle.progress + delta * vehicle.speed * trafficFactor / vehicle.curve.getLength()) % 1;
      point = vehicle.curve.getPointAt(vehicle.progress);
      const tangent = vehicle.curve.getTangentAt(vehicle.progress);
      vehicle.group.position.set(point.x, 0, point.z);
      vehicle.group.rotation.y = Math.atan2(tangent.x, tangent.z);
      vehicle.group.userData.wheels.forEach(wheel => { wheel.rotation.x += delta * 3.5; });
      if (vehicle.deliveryCrate) {
        if (!vehicle.deliveryState && deliveryPoint && elapsed >= vehicle.nextDelivery) {
          vehicle.group.attach(vehicle.deliveryCrate);
          vehicle.deliveryCrate.position.set(0, 2.0, -0.5);
          vehicle.group.updateMatrixWorld(true);
          const start = vehicle.deliveryCrate.getWorldPosition(new THREE.Vector3());
          scene.attach(vehicle.deliveryCrate);
          vehicle.deliveryCrate.visible = true;
          vehicle.deliveryCrate.position.copy(start);
          vehicle.deliveryState = { phase: 'unloading', elapsed: 0, start, end: new THREE.Vector3(-4.3, 0.63, 8.6) };
        } else if (vehicle.deliveryState) {
          const activity = vehicle.deliveryState;
          activity.elapsed += delta;
          if (activity.phase === 'unloading') {
            const t = Math.min(activity.elapsed / 1.15, 1);
            vehicle.deliveryCrate.position.lerpVectors(activity.start, activity.end, t);
            vehicle.deliveryCrate.position.y += Math.sin(t * pi) * 0.6;
            if (t === 1) {
              activity.phase = 'waiting';
              activity.elapsed = 0;
              for (const child of vehicle.deliveryCrate.children) {
                if (child.name === 'farm harvest produce') child.visible = false;
              }
            }
          } else if (activity.phase === 'waiting' && activity.elapsed > 1.5) {
            activity.phase = 'returning';
            activity.elapsed = 0;
            activity.start = vehicle.deliveryCrate.position.clone();
            activity.end = vehicle.group.localToWorld(new THREE.Vector3(0, 2.0, -0.5));
            for (const child of vehicle.deliveryCrate.children) {
              if (child.name === 'farm harvest produce') child.visible = true;
            }
          } else if (activity.phase === 'returning') {
            const t = Math.min(activity.elapsed / 1.15, 1);
            vehicle.deliveryCrate.position.lerpVectors(activity.start, activity.end, t);
            vehicle.deliveryCrate.position.y += Math.sin(t * pi) * 0.5;
            if (t === 1) {
              vehicle.group.attach(vehicle.deliveryCrate);
              vehicle.deliveryCrate.position.set(0, 1.86, -0.5);
              for (const child of vehicle.deliveryCrate.children) {
                if (child.name === 'farm harvest produce') child.visible = false;
              }
              vehicle.deliveryState = null;
              vehicle.nextDelivery = elapsed + 22;
            }
          }
        }
      }
    }
  }

  return { targets, stations, focusViews, update };
}
