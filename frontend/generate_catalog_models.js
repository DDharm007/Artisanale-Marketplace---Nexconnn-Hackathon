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

async function main() {
  const THREE = await import('three');
  const { GLTFExporter } = await import('three/examples/jsm/exporters/GLTFExporter.js');

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

  // ─────────────────────────────────────────────────────────────────────────
  // 1. SOY WAX CANDLES (Trio of Ribbed & Fluted Soy Pillar Candles on Tray)
  // ─────────────────────────────────────────────────────────────────────────
  {
    const scene = new THREE.Scene();
    scene.name = 'SoyWaxCandles';

    const group = new THREE.Group();

    const trayMat = new THREE.MeshStandardMaterial({
      color: 0xd8cfc2,
      roughness: 0.72,
      metalness: 0.04,
    });

    const creamWaxMat = new THREE.MeshStandardMaterial({
      color: 0xf4efe4,
      roughness: 0.58,
      metalness: 0.01,
    });

    const warmIvoryWaxMat = new THREE.MeshStandardMaterial({
      color: 0xede3d2,
      roughness: 0.62,
      metalness: 0.01,
    });

    const sandWaxMat = new THREE.MeshStandardMaterial({
      color: 0xe3d5c0,
      roughness: 0.60,
      metalness: 0.02,
    });

    const wickMat = new THREE.MeshStandardMaterial({
      color: 0x262320,
      roughness: 0.9,
    });

    // Travertine Stone Coaster Tray
    const trayProfile = [
      new THREE.Vector2(0.0, -0.52),
      new THREE.Vector2(1.15, -0.52),
      new THREE.Vector2(1.22, -0.48),
      new THREE.Vector2(1.22, -0.38),
      new THREE.Vector2(1.16, -0.36),
      new THREE.Vector2(1.12, -0.43),
      new THREE.Vector2(0.0, -0.43),
    ];
    const trayGeo = new THREE.LatheGeometry(trayProfile, 72);
    trayGeo.computeVertexNormals();
    group.add(new THREE.Mesh(trayGeo, trayMat));

    // Helper for ribbed / fluted soy pillar candle
    function createFlutedPillar(radius, height, flutes, mat, x, z) {
      const pillarGroup = new THREE.Group();
      pillarGroup.position.set(x, -0.43 + height / 2, z);

      const radialSegs = 96;
      const heightSegs = 32;
      const geo = new THREE.CylinderGeometry(radius, radius, height, radialSegs, heightSegs, false);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const vx = pos.getX(i);
        const vy = pos.getY(i);
        const vz = pos.getZ(i);
        const dist = Math.hypot(vx, vz);
        if (dist > 0.02) {
          const angle = Math.atan2(vz, vx);
          const fluteWave = Math.cos(angle * flutes) * 0.024;
          const topSoften = 1.0 - Math.pow(Math.max(0, (vy + height / 2) / height), 6) * 0.4;
          const newR = dist + fluteWave * topSoften;
          pos.setX(i, (vx / dist) * newR);
          pos.setZ(i, (vz / dist) * newR);
        }
        // Subtle recessed wax well at top
        if (vy > height / 2 - 0.02 && dist < radius * 0.78) {
          pos.setY(i, vy - 0.03 * (1 - dist / (radius * 0.78)));
        }
      }
      geo.computeVertexNormals();
      pillarGroup.add(new THREE.Mesh(geo, mat));

      // Cotton Wick
      const wickGeo = new THREE.CylinderGeometry(0.016, 0.018, 0.12, 12);
      const wickMesh = new THREE.Mesh(wickGeo, wickMat);
      wickMesh.position.y = height / 2 + 0.04;
      wickMesh.rotation.z = 0.08;
      pillarGroup.add(wickMesh);

      return pillarGroup;
    }

    // 1. Tall Fluted Pillar (Back Left)
    group.add(createFlutedPillar(0.36, 1.32, 18, creamWaxMat, -0.34, -0.18));

    // 2. Medium Tiered Spiral/Bubble Pillar (Front Right)
    const tieredGroup = new THREE.Group();
    tieredGroup.position.set(0.42, -0.43, 0.22);
    const tierRadii = [0.36, 0.37, 0.35, 0.32];
    const tierY = [0.16, 0.42, 0.68, 0.90];
    for (let t = 0; t < tierRadii.length; t++) {
      const tGeo = new THREE.SphereGeometry(tierRadii[t], 48, 32);
      tGeo.scale(1, 0.56, 1);
      const tMesh = new THREE.Mesh(tGeo, warmIvoryWaxMat);
      tMesh.position.y = tierY[t];
      tieredGroup.add(tMesh);
    }
    const wick2 = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.12, 12), wickMat);
    wick2.position.y = 1.08;
    tieredGroup.add(wick2);
    group.add(tieredGroup);

    // 3. Compact Ribbed Votive Candle (Front Left)
    group.add(createFlutedPillar(0.31, 0.72, 14, sandWaxMat, -0.18, 0.46));

    scene.add(group);
    await exportGLB(scene, 'soy_wax_candles.glb');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 2. SCENTED JAR CANDLES (Glazed Apothecary Jar + Wooden Lid + Twin Wicks)
  // ─────────────────────────────────────────────────────────────────────────
  {
    const scene = new THREE.Scene();
    scene.name = 'ScentedJarCandle';

    const group = new THREE.Group();

    const amberCeramicMat = new THREE.MeshStandardMaterial({
      color: 0x8d5b3e,
      roughness: 0.32,
      metalness: 0.05,
    });

    const creamLabelMat = new THREE.MeshStandardMaterial({
      color: 0xf4eee1,
      roughness: 0.78,
      metalness: 0.02,
    });

    const goldTrimMat = new THREE.MeshStandardMaterial({
      color: 0xd6b875,
      roughness: 0.32,
      metalness: 0.65,
    });

    const waxPoolMat = new THREE.MeshStandardMaterial({
      color: 0xf6f2e8,
      roughness: 0.55,
      metalness: 0.01,
    });

    const walnutLidMat = new THREE.MeshStandardMaterial({
      color: 0x4a3525,
      roughness: 0.48,
      metalness: 0.04,
    });

    const wickMat = new THREE.MeshStandardMaterial({
      color: 0x22201e,
      roughness: 0.9,
    });

    // Main Jar Body
    const jarGroup = new THREE.Group();
    jarGroup.position.set(-0.22, 0, 0.08);

    const jarProfile = [
      new THREE.Vector2(0.0, -0.68),
      new THREE.Vector2(0.68, -0.68),
      new THREE.Vector2(0.75, -0.62),
      new THREE.Vector2(0.76, 0.38),
      new THREE.Vector2(0.72, 0.44),
      new THREE.Vector2(0.68, 0.48),
      new THREE.Vector2(0.68, 0.60),
      new THREE.Vector2(0.62, 0.60),
      new THREE.Vector2(0.62, 0.36),
      new THREE.Vector2(0.0, 0.36),
    ];
    const jarGeo = new THREE.LatheGeometry(jarProfile, 72);
    jarGeo.computeVertexNormals();
    jarGroup.add(new THREE.Mesh(jarGeo, amberCeramicMat));

    //Minimalist Woven Cream Label Band around the jar
    const labelGeo = new THREE.CylinderGeometry(0.764, 0.764, 0.48, 72, 1, true);
    const labelMesh = new THREE.Mesh(labelGeo, creamLabelMat);
    labelMesh.position.y = -0.12;
    jarGroup.add(labelMesh);

    // Subtle Gold Accent Borders on Label
    const topBandGeo = new THREE.CylinderGeometry(0.766, 0.766, 0.016, 72, 1, true);
    const topBand = new THREE.Mesh(topBandGeo, goldTrimMat);
    topBand.position.y = 0.12;
    jarGroup.add(topBand);

    const botBand = new THREE.Mesh(topBandGeo, goldTrimMat);
    botBand.position.y = -0.36;
    jarGroup.add(botBand);

    // Poured Soy Wax Pool inside Jar
    const waxGeo = new THREE.CylinderGeometry(0.63, 0.63, 0.14, 64);
    const waxMesh = new THREE.Mesh(waxGeo, waxPoolMat);
    waxMesh.position.y = 0.38;
    jarGroup.add(waxMesh);

    // Twin Braided Wicks
    const wick1 = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.14, 12), wickMat);
    wick1.position.set(-0.22, 0.49, 0.05);
    jarGroup.add(wick1);

    const wick2 = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.018, 0.14, 12), wickMat);
    wick2.position.set(0.22, 0.49, -0.05);
    jarGroup.add(wick2);

    group.add(jarGroup);

    // Turned Walnut Lid resting at an angle beside the jar
    const lidProfile = [
      new THREE.Vector2(0.0, 0.12),
      new THREE.Vector2(0.74, 0.12),
      new THREE.Vector2(0.77, 0.08),
      new THREE.Vector2(0.77, -0.04),
      new THREE.Vector2(0.66, -0.04),
      new THREE.Vector2(0.66, -0.14),
      new THREE.Vector2(0.0, -0.14),
    ];
    const lidGeo = new THREE.LatheGeometry(lidProfile, 64);
    lidGeo.computeVertexNormals();
    const lidMesh = new THREE.Mesh(lidGeo, walnutLidMat);
    lidMesh.position.set(0.68, -0.44, 0.18);
    lidMesh.rotation.z = -0.52;
    lidMesh.rotation.x = 0.18;
    group.add(lidMesh);

    scene.add(group);
    await exportGLB(scene, 'scented_jar_candle.glb');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 3. HANDMADE COFFEE MUGS (Wheel-Thrown Stoneware Mug + Raw Terracotta Base)
  // ─────────────────────────────────────────────────────────────────────────
  {
    const scene = new THREE.Scene();
    scene.name = 'HandmadeCoffeeMug';

    const mugGroup = new THREE.Group();

    const glazeMat = new THREE.MeshStandardMaterial({
      color: 0xe8e2d5,
      roughness: 0.42,
      metalness: 0.04,
    });

    const rawClayMat = new THREE.MeshStandardMaterial({
      color: 0xb88664,
      roughness: 0.82,
      metalness: 0.02,
    });

    const innerGlazeMat = new THREE.MeshStandardMaterial({
      color: 0x3b2d23,
      roughness: 0.25,
      metalness: 0.06,
    });

    // Upper Glazed Mug Body
    const mugProfile = [
      new THREE.Vector2(0.62, -0.46),
      new THREE.Vector2(0.74, -0.22),
      new THREE.Vector2(0.77, 0.12),
      new THREE.Vector2(0.74, 0.48),
      new THREE.Vector2(0.76, 0.68),
      new THREE.Vector2(0.73, 0.72),
      new THREE.Vector2(0.68, 0.68),
      new THREE.Vector2(0.66, 0.10),
      new THREE.Vector2(0.58, -0.42),
      new THREE.Vector2(0.0, -0.42),
    ];
    const mugGeo = new THREE.LatheGeometry(mugProfile, 72);
    // Add subtle wheel-throwing rings
    const mPos = mugGeo.attributes.position;
    for (let i = 0; i < mPos.count; i++) {
      const vx = mPos.getX(i);
      const vy = mPos.getY(i);
      const vz = mPos.getZ(i);
      const r = Math.hypot(vx, vz);
      if (r > 0.69) {
        const ring = Math.sin(vy * 34.0) * 0.006;
        mPos.setX(i, (vx / r) * (r + ring));
        mPos.setZ(i, (vz / r) * (r + ring));
      }
    }
    mugGeo.computeVertexNormals();
    mugGroup.add(new THREE.Mesh(mugGeo, glazeMat));

    // Exposed Raw Terracotta Clay Foot Base
    const footProfile = [
      new THREE.Vector2(0.0, -0.68),
      new THREE.Vector2(0.58, -0.68),
      new THREE.Vector2(0.64, -0.62),
      new THREE.Vector2(0.66, -0.44),
      new THREE.Vector2(0.56, -0.44),
      new THREE.Vector2(0.0, -0.44),
    ];
    const footGeo = new THREE.LatheGeometry(footProfile, 72);
    footGeo.computeVertexNormals();
    mugGroup.add(new THREE.Mesh(footGeo, rawClayMat));

    // Rich Dark Espresso/Cocoa Interior Surface
    const coffeeDisk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.67, 0.64, 0.06, 64),
      innerGlazeMat
    );
    coffeeDisk.position.y = 0.44;
    mugGroup.add(coffeeDisk);

    // Sculpted Ergonomic Ear Handle
    const handleCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.71, 0.48, 0),
      new THREE.Vector3(1.06, 0.50, 0),
      new THREE.Vector3(1.18, 0.16, 0),
      new THREE.Vector3(1.04, -0.22, 0),
      new THREE.Vector3(0.69, -0.32, 0),
    ]);
    const handleGeo = new THREE.TubeGeometry(handleCurve, 48, 0.085, 24, false);
    handleGeo.scale(1, 1, 1.35); // Flattened ribbon ceramic handle feel
    handleGeo.computeVertexNormals();
    mugGroup.add(new THREE.Mesh(handleGeo, glazeMat));

    // Center the mug+handle visual weight
    mugGroup.position.x = -0.14;
    scene.add(mugGroup);
    await exportGLB(scene, 'handmade_coffee_mug.glb');
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 4. CERAMIC TEA SETS (Kyusu Stoneware Teapot + 2 Yunomi Cups on Slate Tray)
  // ─────────────────────────────────────────────────────────────────────────
  {
    const scene = new THREE.Scene();
    scene.name = 'CeramicTeaSet';

    const setGroup = new THREE.Group();

    const slateTrayMat = new THREE.MeshStandardMaterial({
      color: 0x35322f,
      roughness: 0.68,
      metalness: 0.08,
    });

    const ceramicPotMat = new THREE.MeshStandardMaterial({
      color: 0xd9d2c5,
      roughness: 0.46,
      metalness: 0.04,
    });

    const woodHandleMat = new THREE.MeshStandardMaterial({
      color: 0x5c4028,
      roughness: 0.55,
      metalness: 0.03,
    });

    const teaLiquidMat = new THREE.MeshStandardMaterial({
      color: 0x6f7d44,
      roughness: 0.22,
      metalness: 0.05,
    });

    // Round Slate Serving Tray
    const trayProfile = [
      new THREE.Vector2(0.0, -0.52),
      new THREE.Vector2(1.42, -0.52),
      new THREE.Vector2(1.48, -0.46),
      new THREE.Vector2(1.48, -0.38),
      new THREE.Vector2(1.40, -0.38),
      new THREE.Vector2(1.38, -0.44),
      new THREE.Vector2(0.0, -0.44),
    ];
    const trayGeo = new THREE.LatheGeometry(trayProfile, 72);
    trayGeo.computeVertexNormals();
    setGroup.add(new THREE.Mesh(trayGeo, slateTrayMat));

    // Teapot Sub-Group
    const potGroup = new THREE.Group();
    potGroup.position.set(-0.32, -0.44, -0.12);

    const potProfile = [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.48, 0.0),
      new THREE.Vector2(0.68, 0.18),
      new THREE.Vector2(0.74, 0.42),
      new THREE.Vector2(0.64, 0.68),
      new THREE.Vector2(0.44, 0.78),
      new THREE.Vector2(0.42, 0.84),
      new THREE.Vector2(0.0, 0.84),
    ];
    const potGeo = new THREE.LatheGeometry(potProfile, 64);
    potGeo.computeVertexNormals();
    potGroup.add(new THREE.Mesh(potGeo, ceramicPotMat));

    // Teapot Lid & Finial Knob
    const lidGeo = new THREE.CylinderGeometry(0.38, 0.41, 0.07, 48);
    const lidMesh = new THREE.Mesh(lidGeo, ceramicPotMat);
    lidMesh.position.y = 0.85;
    potGroup.add(lidMesh);

    const knobGeo = new THREE.SphereGeometry(0.09, 32, 24);
    knobGeo.scale(1.1, 0.75, 1.1);
    const knobMesh = new THREE.Mesh(knobGeo, woodHandleMat);
    knobMesh.position.y = 0.93;
    potGroup.add(knobMesh);

    // Curved Pouring Spout
    const spoutCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.58, 0.36, 0),
      new THREE.Vector3(-0.88, 0.56, 0),
      new THREE.Vector3(-1.02, 0.80, 0),
    ]);
    const spoutGeo = new THREE.TubeGeometry(spoutCurve, 32, 0.085, 20, false);
    spoutGeo.computeVertexNormals();
    potGroup.add(new THREE.Mesh(spoutGeo, ceramicPotMat));

    // Overhead Bentwood / Bamboo Arch Handle
    const archCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.36, 0.76, 0),
      new THREE.Vector3(-0.42, 1.28, 0),
      new THREE.Vector3(0.0, 1.44, 0),
      new THREE.Vector3(0.42, 1.28, 0),
      new THREE.Vector3(0.36, 0.76, 0),
    ]);
    const archGeo = new THREE.TubeGeometry(archCurve, 48, 0.042, 16, false);
    archGeo.computeVertexNormals();
    potGroup.add(new THREE.Mesh(archGeo, woodHandleMat));

    potGroup.rotation.y = 0.35;
    setGroup.add(potGroup);

    // Helper for Yunomi Teacup
    function createYunomiCup(x, z) {
      const cupGroup = new THREE.Group();
      cupGroup.position.set(x, -0.44, z);

      const cupProfile = [
        new THREE.Vector2(0.0, 0.0),
        new THREE.Vector2(0.22, 0.0),
        new THREE.Vector2(0.28, 0.08),
        new THREE.Vector2(0.31, 0.32),
        new THREE.Vector2(0.30, 0.48),
        new THREE.Vector2(0.26, 0.48),
        new THREE.Vector2(0.25, 0.12),
        new THREE.Vector2(0.0, 0.12),
      ];
      const cupGeo = new THREE.LatheGeometry(cupProfile, 48);
      cupGeo.computeVertexNormals();
      cupGroup.add(new THREE.Mesh(cupGeo, ceramicPotMat));

      const teaDisk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.26, 0.25, 0.04, 36),
        teaLiquidMat
      );
      teaDisk.position.y = 0.36;
      cupGroup.add(teaDisk);

      return cupGroup;
    }

    // Two Yunomi Cups on the right side of the tray
    setGroup.add(createYunomiCup(0.68, 0.32));
    setGroup.add(createYunomiCup(0.82, -0.34));

    scene.add(setGroup);
    await exportGLB(scene, 'ceramic_tea_set.glb');
  }

  console.log('All 4 catalog 3D models generated successfully!');
}

main().catch(console.error);
