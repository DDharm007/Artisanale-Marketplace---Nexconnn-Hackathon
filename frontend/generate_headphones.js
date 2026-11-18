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

async function generateHeadphones() {
  const THREE = await import('./node_modules/three/build/three.module.js');
  const { GLTFExporter } = await import('./node_modules/three/examples/jsm/exporters/GLTFExporter.js');

  const scene = new THREE.Scene();
  scene.name = "AuraStudioProHeadphones";

  // --- Premium PBR Materials ---
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0x141416,
    roughness: 0.38,
    metalness: 0.15,
  });

  const leatherMaterial = new THREE.MeshStandardMaterial({
    color: 0x18181c,
    roughness: 0.72,
    metalness: 0.05,
  });

  const titaniumMaterial = new THREE.MeshStandardMaterial({
    color: 0x9ca3af,
    roughness: 0.25,
    metalness: 0.92,
  });

  const chromeAccentMaterial = new THREE.MeshStandardMaterial({
    color: 0xe4e4e7,
    roughness: 0.1,
    metalness: 0.98,
  });

  const grilleMaterial = new THREE.MeshStandardMaterial({
    color: 0x0f0f11,
    roughness: 0.85,
    metalness: 0.2,
  });

  const powerAccentMaterial = new THREE.MeshStandardMaterial({
    color: 0xf97316,
    roughness: 0.3,
    metalness: 0.1,
  });

  const ledMaterial = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.8,
  });

  const rootGroup = new THREE.Group();
  rootGroup.name = "HeadphonesRoot";

  // ==========================================
  // 1. HEADBAND
  // ==========================================
  // Curved Headband Arc
  const headbandCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.15, 0.4, 0),
    new THREE.Vector3(-0.95, 1.05, 0),
    new THREE.Vector3(-0.55, 1.48, 0),
    new THREE.Vector3(0, 1.6, 0),
    new THREE.Vector3(0.55, 1.48, 0),
    new THREE.Vector3(0.95, 1.05, 0),
    new THREE.Vector3(1.15, 0.4, 0),
  ]);

  // Headband Outer Frame
  const bandShape = new THREE.Shape();
  const bw = 0.16; // width
  const bh = 0.045; // thickness
  bandShape.moveTo(-bw, -bh);
  bandShape.lineTo(bw, -bh);
  bandShape.absarc(bw, 0, bh, -Math.PI / 2, Math.PI / 2, false);
  bandShape.lineTo(-bw, bh);
  bandShape.absarc(-bw, 0, bh, Math.PI / 2, -Math.PI / 2, false);

  const bandGeometry = new THREE.ExtrudeGeometry(bandShape, {
    extrudePath: headbandCurve,
    steps: 64,
    bevelEnabled: false,
  });
  const headbandMesh = new THREE.Mesh(bandGeometry, bodyMaterial);
  headbandMesh.castShadow = true;
  rootGroup.add(headbandMesh);

  // Inner Headband Cushion (Memory Foam)
  const cushionCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.75, 1.2, 0),
    new THREE.Vector3(-0.45, 1.43, 0),
    new THREE.Vector3(0, 1.54, 0),
    new THREE.Vector3(0.45, 1.43, 0),
    new THREE.Vector3(0.75, 1.2, 0),
  ]);

  const cushionShape = new THREE.Shape();
  const cw = 0.14;
  const ch = 0.055;
  cushionShape.moveTo(-cw, 0);
  cushionShape.quadraticCurveTo(-cw, -ch, 0, -ch * 1.2);
  cushionShape.quadraticCurveTo(cw, -ch, cw, 0);
  cushionShape.lineTo(-cw, 0);

  const cushionGeometry = new THREE.ExtrudeGeometry(cushionShape, {
    extrudePath: cushionCurve,
    steps: 48,
    bevelEnabled: false,
  });
  const cushionMesh = new THREE.Mesh(cushionGeometry, leatherMaterial);
  rootGroup.add(cushionMesh);

  // ==========================================
  // 2. SLIDERS & GIMBALS (Left & Right)
  // ==========================================
  [-1, 1].forEach((side) => {
    const sideName = side === -1 ? "Left" : "Right";
    const sideGroup = new THREE.Group();
    sideGroup.name = `${sideName}Assembly`;

    // Telescoping Slider Stem (Brushed Titanium)
    const sliderGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.42, 24);
    const sliderMesh = new THREE.Mesh(sliderGeo, titaniumMaterial);
    sliderMesh.position.set(side * 1.18, 0.22, 0);
    sliderMesh.rotation.z = side * 0.18;
    sideGroup.add(sliderMesh);

    // Slider Click Notch Markings
    for (let i = 0; i < 5; i++) {
      const notchGeo = new THREE.BoxGeometry(0.02, 0.008, 0.095);
      const notchMesh = new THREE.Mesh(notchGeo, chromeAccentMaterial);
      notchMesh.position.set(side * 1.18, 0.12 + i * 0.05, 0);
      notchMesh.rotation.z = side * 0.18;
      sideGroup.add(notchMesh);
    }

    // Gimbal / Yoke Arm (Curved Aluminum Fork)
    const yokeCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 1.21, 0.02, 0),
      new THREE.Vector3(side * 1.22, -0.15, 0.28),
      new THREE.Vector3(side * 1.16, -0.4, 0.32),
    ]);
    const yokeGeoFront = new THREE.TubeGeometry(yokeCurve, 24, 0.032, 16, false);
    const yokeMeshFront = new THREE.Mesh(yokeGeoFront, bodyMaterial);
    sideGroup.add(yokeMeshFront);

    const yokeCurveBack = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 1.21, 0.02, 0),
      new THREE.Vector3(side * 1.22, -0.15, -0.28),
      new THREE.Vector3(side * 1.16, -0.4, -0.32),
    ]);
    const yokeGeoBack = new THREE.TubeGeometry(yokeCurveBack, 24, 0.032, 16, false);
    const yokeMeshBack = new THREE.Mesh(yokeGeoBack, bodyMaterial);
    sideGroup.add(yokeMeshBack);

    // Pivot Caps (Chrome Discs on Swivel Points)
    const capGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.025, 32);
    const capMeshFront = new THREE.Mesh(capGeo, chromeAccentMaterial);
    capMeshFront.rotation.x = Math.PI / 2;
    capMeshFront.position.set(side * 1.16, -0.4, 0.34);
    sideGroup.add(capMeshFront);

    const capMeshBack = new THREE.Mesh(capGeo, chromeAccentMaterial);
    capMeshBack.rotation.x = Math.PI / 2;
    capMeshBack.position.set(side * 1.16, -0.4, -0.34);
    sideGroup.add(capMeshBack);

    // ==========================================
    // 3. EARCUP ASSEMBLY
    // ==========================================
    const cupGroup = new THREE.Group();
    cupGroup.name = `${sideName}Earcup`;
    cupGroup.position.set(side * 1.05, -0.42, 0);
    // Ergonomic ear angle (subtle inward toe-in)
    cupGroup.rotation.y = side * 0.12;
    cupGroup.rotation.z = side * 0.1;

    // Outer Acoustic Housing Shell (Oval Cylinder with Chamfer)
    const outerCupGeo = new THREE.CylinderGeometry(0.48, 0.44, 0.28, 48);
    outerCupGeo.scale(1.0, 1.0, 1.28); // Oval shape
    const outerCupMesh = new THREE.Mesh(outerCupGeo, bodyMaterial);
    outerCupMesh.rotation.z = Math.PI / 2;
    cupGroup.add(outerCupMesh);

    // Outer Back Cap Dome with Satin Chamfer
    const capDomeGeo = new THREE.SphereGeometry(0.45, 36, 18, 0, Math.PI * 2, 0, Math.PI * 0.35);
    capDomeGeo.scale(1.0, 0.3, 1.25);
    const capDomeMesh = new THREE.Mesh(capDomeGeo, bodyMaterial);
    capDomeMesh.rotation.z = -Math.PI / 2 * side;
    capDomeMesh.position.x = side * 0.12;
    cupGroup.add(capDomeMesh);

    // Decorative Beveled Ring (Polished Chrome / Titanium)
    const bevelRingGeo = new THREE.TorusGeometry(0.46, 0.016, 16, 48);
    bevelRingGeo.scale(1.0, 1.28, 1.0);
    const bevelRingMesh = new THREE.Mesh(bevelRingGeo, chromeAccentMaterial);
    bevelRingMesh.rotation.y = Math.PI / 2;
    bevelRingMesh.position.x = side * 0.02;
    cupGroup.add(bevelRingMesh);

    // Plush Memory Foam Ear Cushion
    const cushionPadGeo = new THREE.TorusGeometry(0.42, 0.11, 24, 48);
    cushionPadGeo.scale(1.0, 1.28, 1.1); // Sculpted plush contour
    const cushionPadMesh = new THREE.Mesh(cushionPadGeo, leatherMaterial);
    cushionPadMesh.rotation.y = Math.PI / 2;
    cushionPadMesh.position.x = -side * 0.16;
    cupGroup.add(cushionPadMesh);

    // Inner Acoustic Dust Screen Grille
    const innerGrilleGeo = new THREE.CircleGeometry(0.38, 36);
    innerGrilleGeo.scale(1.0, 1.22, 1.0);
    const innerGrilleMesh = new THREE.Mesh(innerGrilleGeo, grilleMaterial);
    innerGrilleMesh.rotation.y = side === 1 ? -Math.PI / 2 : Math.PI / 2;
    innerGrilleMesh.position.x = -side * 0.19;
    cupGroup.add(innerGrilleMesh);

    // Center Driver Dome within Grille
    const driverDomeGeo = new THREE.SphereGeometry(0.12, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const driverDomeMesh = new THREE.Mesh(driverDomeGeo, titaniumMaterial);
    driverDomeMesh.rotation.y = side === 1 ? -Math.PI / 2 : Math.PI / 2;
    driverDomeMesh.position.x = -side * 0.2;
    cupGroup.add(driverDomeMesh);

    // Hardware Details on Right Cup:
    if (side === 1) {
      // Power Toggle Switch
      const powerSwitchGeo = new THREE.BoxGeometry(0.02, 0.045, 0.08);
      const powerSwitchMesh = new THREE.Mesh(powerSwitchGeo, powerAccentMaterial);
      powerSwitchMesh.position.set(0.14, -0.22, 0.32);
      cupGroup.add(powerSwitchMesh);

      // Volume Rocker (+)
      const volUpGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.045, 16);
      const volUpMesh = new THREE.Mesh(volUpGeo, bodyMaterial);
      volUpMesh.rotation.z = Math.PI / 2;
      volUpMesh.position.set(0.14, -0.12, 0.36);
      cupGroup.add(volUpMesh);

      // Volume Rocker (-)
      const volDownGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.045, 16);
      const volDownMesh = new THREE.Mesh(volDownGeo, bodyMaterial);
      volDownMesh.rotation.z = Math.PI / 2;
      volDownMesh.position.set(0.14, -0.04, 0.36);
      cupGroup.add(volDownMesh);

      // USB-C Charging Port Slot
      const usbPortGeo = new THREE.BoxGeometry(0.015, 0.022, 0.06);
      const usbPortMesh = new THREE.Mesh(usbPortGeo, chromeAccentMaterial);
      usbPortMesh.position.set(0.13, -0.38, 0.12);
      cupGroup.add(usbPortMesh);

      // Status LED Dot (Glow Cyan/Blue)
      const ledGeo = new THREE.SphereGeometry(0.012, 12, 12);
      const ledMesh = new THREE.Mesh(ledGeo, ledMaterial);
      ledMesh.position.set(0.142, -0.30, 0.28);
      cupGroup.add(ledMesh);
    }

    sideGroup.add(cupGroup);
    rootGroup.add(sideGroup);
  });

  // Scale and center the entire headphones model
  rootGroup.scale.setScalar(1.0);
  rootGroup.position.set(0, -0.35, 0);
  scene.add(rootGroup);

  // Export to GLB
  const exporter = new GLTFExporter();
  exporter.parse(
    scene,
    (glbBuffer) => {
      const outputPath = path.resolve('frontend/public/assets/3d/headphones.glb');
      fs.writeFileSync(outputPath, Buffer.from(glbBuffer));
      console.log('SUCCESS! Headphones model exported to:', outputPath);
      console.log('File size:', glbBuffer.byteLength, 'bytes');
    },
    (error) => {
      console.error('Failed to export GLB:', error);
    },
    { binary: true }
  );
}

generateHeadphones();
