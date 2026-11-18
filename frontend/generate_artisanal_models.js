import fs from 'fs';
import path from 'path';

globalThis.FileReader = class {
  constructor() {
    this.onloadend = null;
    this.result = null;
  }
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer();
    if (this.onloadend) this.onloadend();
  }
};

function hash3(x, y, z) {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453123;
  return h - Math.floor(h);
}

function smoothNoise(x, y, z) {
  return (
    Math.sin(x * 3.7 + Math.cos(y * 4.3)) * 0.35 +
    Math.cos(y * 7.1 + Math.sin(z * 3.9)) * 0.35 +
    Math.sin(z * 5.3 + x * 6.1) * 0.3
  ) * 0.5 + 0.5;
}

// Polynomial smooth minimum for organic sculptural blending
function smin(a, b, k) {
  const h = Math.max(k - Math.abs(a - b), 0.0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

// Tapered capsule SDF from A(ax,ay,az,ra) to B(bx,by,bz,rb)
function sdCapsule(px, py, pz, ax, ay, az, bx, by, bz, ra, rb) {
  const bax = bx - ax, bay = by - ay, baz = bz - az;
  const pax = px - ax, pay = py - ay, paz = pz - az;
  const baba = bax * bax + bay * bay + baz * baz;
  let h = (pax * bax + pay * bay + paz * baz) / baba;
  if (h < 0.0) h = 0.0;
  else if (h > 1.0) h = 1.0;
  const dx = pax - bax * h;
  const dy = pay - bay * h;
  const dz = paz - baz * h;
  const r = ra + (rb - ra) * h;
  return Math.sqrt(dx * dx + dy * dy + dz * dz) - r;
}

// Tilted ellipsoid SDF for the sculpted head
function sdTiltedEllipsoid(px, py, pz, cx, cy, cz, rx, ry, rz, rotZ, rotX) {
  let x = px - cx;
  let y = py - cy;
  let z = pz - cz;
  // Rotate around Z
  const czR = Math.cos(rotZ), szR = Math.sin(rotZ);
  const x1 = x * czR + y * szR;
  const y1 = -x * szR + y * czR;
  // Rotate around X
  const cxR = Math.cos(rotX), sxR = Math.sin(rotX);
  const y2 = y1 * cxR + z * sxR;
  const z2 = -y1 * sxR + z * cxR;

  const k0 = Math.sqrt((x1 / rx) ** 2 + (y2 / ry) ** 2 + (z2 / rz) ** 2);
  const k1 = Math.sqrt((x1 / (rx * rx)) ** 2 + (y2 / (ry * ry)) ** 2 + (z2 / (rz * rz)) ** 2);
  return k0 * (k0 - 1.0) / (k1 + 1e-6);
}

async function main() {
  const THREE = await import('./node_modules/three/build/three.module.js');
  const { GLTFExporter } = await import('./node_modules/three/examples/jsm/exporters/GLTFExporter.js');
  const { MarchingCubes } = await import('./node_modules/three/examples/jsm/objects/MarchingCubes.js');

  const outDir = path.resolve('public/assets/3d');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const exportGLB = (scene, filename) => {
    return new Promise((resolve, reject) => {
      const exporter = new GLTFExporter();
      exporter.parse(
        scene,
        (gltf) => {
          fs.writeFileSync(path.join(outDir, filename), Buffer.from(gltf));
          console.log(`Exported ${filename} (${gltf.byteLength} bytes)`);
          resolve();
        },
        (error) => reject(error),
        { binary: true }
      );
    });
  };

  // ─────────────────────────────────────────────────────────────
  // 1. MONUMENTAL RUSTIC WEATHERED CERAMIC VASE (LEFT HERO)
  // ─────────────────────────────────────────────────────────────
  {
    const scene = new THREE.Scene();
    scene.name = 'ArtisanalRusticVase';

    const rawProfile = [
      [0.0, -2.35],
      [0.82, -2.35],
      [0.88, -2.20],
      [0.98, -1.85],
      [1.12, -1.40],
      [1.26, -0.95],
      [1.37, -0.58],
      [1.34, -0.52],
      [1.39, -0.46],
      [1.35, -0.40],
      [1.41, -0.34],
      [1.50, 0.0],
      [1.60, 0.40],
      [1.67, 0.78],
      [1.71, 0.98],
      [1.75, 1.05],
      [1.72, 1.11],
      [1.62, 1.16],
      [1.25, 1.32],
      [0.96, 1.52],
      [0.84, 1.75],
      [0.81, 2.00],
      [0.84, 2.20],
      [0.93, 2.30],
      [0.95, 2.38],
      [0.89, 2.43],
      [0.78, 2.40],
      [0.74, 2.20],
      [0.70, 1.75],
    ];

    const curve2D = new THREE.SplineCurve(rawProfile.map(([r, y]) => new THREE.Vector2(r, y)));
    const points = curve2D.getPoints(220);

    const vaseGeo = new THREE.LatheGeometry(points, 160);
    vaseGeo.computeVertexNormals();

    const ceramicMaterial = new THREE.MeshStandardMaterial({
      color: 0xd8d4cc,
      roughness: 0.85,
      metalness: 0.04,
    });

    scene.add(new THREE.Mesh(vaseGeo, ceramicMaterial));
    await exportGLB(scene, 'vase.glb');
    await exportGLB(scene, 'vase_granite.glb');
  }

  // ─────────────────────────────────────────────────────────────
  // 2. STRIPED TEARDROP VASE (TOP-RIGHT VIGNETTE)
  // ─────────────────────────────────────────────────────────────
  {
    const scene = new THREE.Scene();
    scene.name = 'StripedTeardropVase';

    const points = [];
    const steps = 140;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = -1.6 + t * 3.2;
      let r;
      if (t < 0.05) {
        r = Math.sin((t / 0.05) * (Math.PI / 2)) * 0.45;
      } else {
        r = Math.sin(Math.pow(1 - t, 0.72) * Math.PI) * 0.92;
      }
      r = Math.max(0.06, r);
      points.push(new THREE.Vector2(r, y));
    }

    const tearGeo = new THREE.LatheGeometry(points, 120);
    const pos = tearGeo.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const angle = Math.atan2(z, x);

      const wave = Math.sin(angle * 3.0 + y * 2.0) * 0.04;
      const stripeVal = Math.sin((y + wave) * 9.5) * 0.5 + 0.5;
      const secondaryStripe = Math.cos((y - wave) * 21.0) * 0.5 + 0.5;
      const fineGrain = hash3(x * 18.0, y * 25.0, z * 18.0) * 0.12;

      const midMask = Math.sin(((y + 1.6) / 3.2) * Math.PI);
      const tanMix = Math.min(1, Math.max(0, (stripeVal * 0.7 + secondaryStripe * 0.3) * midMask + fineGrain - 0.1));

      const whiteR = 0.95, whiteG = 0.94, whiteB = 0.92;
      const tanR = 0.72, tanG = 0.56, tanB = 0.43;

      colors[i * 3] = whiteR * (1 - tanMix) + tanR * tanMix;
      colors[i * 3 + 1] = whiteG * (1 - tanMix) + tanG * tanMix;
      colors[i * 3 + 2] = whiteB * (1 - tanMix) + tanG * tanMix * 0.8;
    }

    tearGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    tearGeo.computeVertexNormals();

    const tearMat = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.48,
      metalness: 0.05,
    });

    scene.add(new THREE.Mesh(tearGeo, tearMat));
    await exportGLB(scene, 'teardrop.glb');
  }

  // ─────────────────────────────────────────────────────────────
  // 3. ORGANIC SDF MARCHING-CUBES THINKER SCULPTURE (CARD 1)
  // ─────────────────────────────────────────────────────────────
  {
    const scene = new THREE.Scene();
    scene.name = 'SeatedThinkerSculpture';

    // Evaluate a continuous Signed Distance Field on a 96^3 grid for a watertight,
    // liquid-smooth modernist seated thinker figure with the hollow chest opening!
    const res = 96;
    const dummyMat = new THREE.MeshStandardMaterial({ color: 0xa69586, roughness: 0.88, metalness: 0.02 });
    const mc = new MarchingCubes(res, dummyMat, false, false, 450000);
    mc.isolation = 80;

    function sculptureSDF(x, y, z) {
      const k = 0.055; // Smooth blending radius at joints

      // 1. Tilted oval head resting on right/left hand
      let d = sdTiltedEllipsoid(x, y, z, 0.03, 0.56, 0.06, 0.105, 0.155, 0.115, 0.24, -0.16);

      // 2. Neck & sculpted shoulder bridge
      d = smin(d, sdCapsule(x, y, z, 0.05, 0.43, 0.02, 0.09, 0.30, -0.02, 0.052, 0.072), 0.045);
      d = smin(d, sdCapsule(x, y, z, -0.11, 0.27, -0.01, 0.22, 0.24, -0.02, 0.068, 0.082), k);

      // 3. Sweeping Right-Side Torso Arch (leaves the iconic modernist hollow cutout in the chest!)
      d = smin(d, sdCapsule(x, y, z, 0.19, 0.25, -0.03, 0.25, -0.02, -0.06, 0.088, 0.098), k);
      d = smin(d, sdCapsule(x, y, z, 0.25, -0.02, -0.06, 0.12, -0.38, -0.07, 0.098, 0.108), k);

      // 4. Seated Hips Base
      d = smin(d, sdCapsule(x, y, z, 0.12, -0.38, -0.07, -0.08, -0.42, -0.05, 0.108, 0.096), k);

      // 5. Left Leg (viewer's left — raised bent knee)
      d = smin(d, sdCapsule(x, y, z, -0.08, -0.42, -0.05, -0.19, -0.02, 0.18, 0.092, 0.076), k);
      d = smin(d, sdCapsule(x, y, z, -0.19, -0.02, 0.18, -0.03, -0.55, 0.18, 0.074, 0.054), 0.04);
      d = smin(d, sdCapsule(x, y, z, -0.03, -0.55, 0.18, 0.09, -0.58, 0.27, 0.052, 0.042), 0.04);

      // 6. Right Leg (viewer's right — folded low across the ground)
      d = smin(d, sdCapsule(x, y, z, 0.12, -0.40, -0.05, 0.27, -0.45, 0.16, 0.092, 0.076), k);
      d = smin(d, sdCapsule(x, y, z, 0.27, -0.45, 0.16, -0.18, -0.55, 0.12, 0.074, 0.048), 0.04);

      // 7. Left Arm (viewer's left — elbow on raised knee, forearm supporting head)
      d = smin(d, sdCapsule(x, y, z, -0.12, 0.27, -0.01, -0.20, 0.01, 0.17, 0.058, 0.050), 0.045);
      d = smin(d, sdCapsule(x, y, z, -0.20, 0.01, 0.17, -0.03, 0.44, 0.09, 0.050, 0.044), 0.04);

      // 8. Right Arm (viewer's right — sweeping down to rest on the ankle/shin)
      d = smin(d, sdCapsule(x, y, z, 0.22, 0.23, -0.02, 0.33, -0.07, 0.06, 0.060, 0.052), 0.045);
      d = smin(d, sdCapsule(x, y, z, 0.33, -0.07, 0.06, 0.02, -0.44, 0.18, 0.050, 0.044), 0.04);

      return d;
    }

    const field = mc.field;
    let ptr = 0;
    for (let iz = 0; iz < res; iz++) {
      const z = (iz / (res - 1)) * 2 - 1;
      for (let iy = 0; iy < res; iy++) {
        const y = (iy / (res - 1)) * 2 - 1;
        for (let ix = 0; ix < res; ix++) {
          const x = (ix / (res - 1)) * 2 - 1;
          const d = sculptureSDF(x, y, z);
          field[ptr++] = 80.0 - d * 240.0;
        }
      }
    }

    mc.update();
    const vCount = mc.count;
    const positions = new Float32Array(mc.positionArray.buffer, 0, vCount * 3).slice();
    const normals = new Float32Array(mc.normalArray.buffer, 0, vCount * 3).slice();
    const uvs = new Float32Array(vCount * 2);

    // Compute clean cylindrical/triplanar UVs and analytical SDF normals
    const eps = 0.004;
    for (let i = 0; i < vCount; i++) {
      const px = positions[i * 3];
      const py = positions[i * 3 + 1];
      const pz = positions[i * 3 + 2];

      // Analytical gradient normal for silky-smooth C2 shading
      const gx = sculptureSDF(px + eps, py, pz) - sculptureSDF(px - eps, py, pz);
      const gy = sculptureSDF(px, py + eps, pz) - sculptureSDF(px, py - eps, pz);
      const gz = sculptureSDF(px, py, pz + eps) - sculptureSDF(px, py, pz - eps);
      const len = Math.hypot(gx, gy, gz) || 1;
      normals[i * 3] = gx / len;
      normals[i * 3 + 1] = gy / len;
      normals[i * 3 + 2] = gz / len;

      // Seamless UV mapping
      uvs[i * 2] = (Math.atan2(pz, px) / (Math.PI * 2) + 0.5) * 2.0 + py * 0.3;
      uvs[i * 2 + 1] = (py + 0.7) * 1.4;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

    const mesh = new THREE.Mesh(geo, dummyMat);
    scene.add(mesh);

    await exportGLB(scene, 'sculpture.glb');
    await exportGLB(scene, 'sculpture_v3.glb');
  }

  // ─────────────────────────────────────────────────────────────
  // 4. CREAMY TWISTED KNOT "BUBBLE CANDLE" (CARD 2)
  // ─────────────────────────────────────────────────────────────
  {
    const scene = new THREE.Scene();
    scene.name = 'TwistedKnotCandle';

    const candleGroup = new THREE.Group();

    // Tightly wound, plump doughy knot matching the reference photo's twisted knot candle
    const knotGeo = new THREE.TorusKnotGeometry(0.62, 0.355, 240, 64, 2, 3);
    knotGeo.rotateX(Math.PI * 0.34);
    knotGeo.rotateZ(Math.PI * 0.16);
    knotGeo.scale(1.06, 0.90, 1.06);
    knotGeo.computeVertexNormals();

    const soyWaxMat = new THREE.MeshStandardMaterial({
      color: 0xeae0cc,
      roughness: 0.62,
      metalness: 0.01,
    });

    const knotMesh = new THREE.Mesh(knotGeo, soyWaxMat);
    candleGroup.add(knotMesh);

    // Curved natural cotton wick emerging from the top center
    const wickCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.02, 0.76, 0.0),
      new THREE.Vector3(-0.03, 0.92, 0.02),
      new THREE.Vector3(-0.06, 1.02, 0.03),
    ]);
    const wickGeo = new THREE.TubeGeometry(wickCurve, 16, 0.024, 12, false);
    const wickMat = new THREE.MeshStandardMaterial({ color: 0xd6cab4, roughness: 0.9 });
    candleGroup.add(new THREE.Mesh(wickGeo, wickMat));

    scene.add(candleGroup);
    await exportGLB(scene, 'candle.glb');
    await exportGLB(scene, 'candle_v3.glb');
  }

  // ─────────────────────────────────────────────────────────────
  // 5. SET OF CANDLES IN OPEN WHITE VESSEL WITH ANGLED BLACK LID (CARD 3)
  // ─────────────────────────────────────────────────────────────
  {
    const scene = new THREE.Scene();
    scene.name = 'SetOfCandlesVessel';

    const whiteBodyMat = new THREE.MeshStandardMaterial({
      color: 0xededf0,
      roughness: 0.45,
      metalness: 0.04,
    });

    const innerRimMat = new THREE.MeshStandardMaterial({
      color: 0x76767c,
      roughness: 0.38,
      metalness: 0.35,
    });

    const blackLidMat = new THREE.MeshStandardMaterial({
      color: 0x202024,
      roughness: 0.46,
      metalness: 0.15,
    });

    const waxMat = new THREE.MeshStandardMaterial({
      color: 0xf4f1ea,
      roughness: 0.68,
      metalness: 0.02,
    });

    const wickMat = new THREE.MeshStandardMaterial({
      color: 0x282828,
      roughness: 0.9,
    });

    const vesselGroup = new THREE.Group();

    // Container sub-group shifted slightly right so the whole composition is balanced
    const tubGroup = new THREE.Group();
    tubGroup.position.set(0.38, 0, 0.12);

    // Hollow white cylindrical body with recessed silver-grey neck lip
    const tubProfile = [
      new THREE.Vector2(0.0, -0.44),
      new THREE.Vector2(1.18, -0.44),
      new THREE.Vector2(1.20, -0.40),
      new THREE.Vector2(1.20, 0.18),
      new THREE.Vector2(1.12, 0.18),
      new THREE.Vector2(1.12, 0.28),
      new THREE.Vector2(1.06, 0.28),
      new THREE.Vector2(1.06, 0.05),
      new THREE.Vector2(0.0, 0.05),
    ];
    const tubGeo = new THREE.LatheGeometry(tubProfile, 72);
    tubGeo.computeVertexNormals();
    tubGroup.add(new THREE.Mesh(tubGeo, whiteBodyMat));

    // Metallic inner collar ring
    const collarGeo = new THREE.CylinderGeometry(1.125, 1.125, 0.11, 72, 1, true);
    const collarMesh = new THREE.Mesh(collarGeo, innerRimMat);
    collarMesh.position.y = 0.23;
    tubGroup.add(collarMesh);

    // 4 visible round candle tins inside the open container + wicks
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      const cx = Math.cos(angle) * 0.52;
      const cz = Math.sin(angle) * 0.52;

      const tinRimGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.16, 40);
      const tinRim = new THREE.Mesh(tinRimGeo, innerRimMat);
      tinRim.position.set(cx, 0.17, cz);
      tubGroup.add(tinRim);

      const waxDiskGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.17, 40);
      const waxDisk = new THREE.Mesh(waxDiskGeo, waxMat);
      waxDisk.position.set(cx, 0.18, cz);
      tubGroup.add(waxDisk);

      const wickGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.08, 8);
      const wick = new THREE.Mesh(wickGeo, wickMat);
      wick.position.set(cx, 0.28, cz);
      tubGroup.add(wick);
    }

    vesselGroup.add(tubGroup);

    // Matte black circular lid propped on the upper-left rim (with hollow underside!)
    const lidProfile = [
      new THREE.Vector2(0.0, 0.12),
      new THREE.Vector2(1.22, 0.12),
      new THREE.Vector2(1.24, 0.09),
      new THREE.Vector2(1.24, -0.12),
      new THREE.Vector2(1.16, -0.12),
      new THREE.Vector2(1.16, 0.04),
      new THREE.Vector2(0.0, 0.04),
    ];
    const lidGeo = new THREE.LatheGeometry(lidProfile, 72);
    lidGeo.computeVertexNormals();
    const lidMesh = new THREE.Mesh(lidGeo, blackLidMat);

    // Positioned to the back-left leaning at ~20 deg so all 4 candles inside remain clearly visible!
    lidMesh.position.set(-0.62, 0.34, -0.18);
    lidMesh.rotation.z = 0.32;
    lidMesh.rotation.x = 0.10;
    vesselGroup.add(lidMesh);

    scene.add(vesselGroup);
    await exportGLB(scene, 'vessel.glb');
    await exportGLB(scene, 'vessel_v3.glb');
  }

  console.log('All upgraded v3 artisanal 3D models generated successfully!');
}

main().catch(console.error);
