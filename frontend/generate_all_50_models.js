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
          resolve();
        },
        (error) => reject(error),
        { binary: true }
      );
    });
  };

  // Shared Artisan Materials Palette
  const M = {
    terracotta: new THREE.MeshStandardMaterial({ color: 0xc86d47, roughness: 0.72, metalness: 0.02 }),
    rawClay: new THREE.MeshStandardMaterial({ color: 0xb88664, roughness: 0.80, metalness: 0.02 }),
    sandstone: new THREE.MeshStandardMaterial({ color: 0xd9cfc1, roughness: 0.75, metalness: 0.02 }),
    creamGlaze: new THREE.MeshStandardMaterial({ color: 0xede8dd, roughness: 0.36, metalness: 0.04 }),
    oatmealStone: new THREE.MeshStandardMaterial({ color: 0xdfd7c8, roughness: 0.52, metalness: 0.03 }),
    sageGlaze: new THREE.MeshStandardMaterial({ color: 0x8fa089, roughness: 0.38, metalness: 0.04 }),
    cobaltGlaze: new THREE.MeshStandardMaterial({ color: 0x2f4b6e, roughness: 0.30, metalness: 0.06 }),
    ochreGlaze: new THREE.MeshStandardMaterial({ color: 0xd19c4c, roughness: 0.38, metalness: 0.05 }),
    charcoalMatte: new THREE.MeshStandardMaterial({ color: 0x282726, roughness: 0.62, metalness: 0.08 }),
    walnut: new THREE.MeshStandardMaterial({ color: 0x593d28, roughness: 0.50, metalness: 0.04 }),
    oak: new THREE.MeshStandardMaterial({ color: 0xb88e65, roughness: 0.56, metalness: 0.03 }),
    maple: new THREE.MeshStandardMaterial({ color: 0xdcc3a1, roughness: 0.52, metalness: 0.02 }),
    brass: new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.24, metalness: 0.86 }),
    agedBrass: new THREE.MeshStandardMaterial({ color: 0xb59449, roughness: 0.34, metalness: 0.78 }),
    silver: new THREE.MeshStandardMaterial({ color: 0xe2e5e8, roughness: 0.18, metalness: 0.92 }),
    emerald: new THREE.MeshStandardMaterial({ color: 0x1b6e44, roughness: 0.14, metalness: 0.12 }),
    rubyTerra: new THREE.MeshStandardMaterial({ color: 0x9e3b33, roughness: 0.22, metalness: 0.08 }),
    turquoise: new THREE.MeshStandardMaterial({ color: 0x439798, roughness: 0.28, metalness: 0.05 }),
    soyWax: new THREE.MeshStandardMaterial({ color: 0xf4efe4, roughness: 0.56, metalness: 0.01 }),
    beeswax: new THREE.MeshStandardMaterial({ color: 0xead8b1, roughness: 0.58, metalness: 0.01 }),
    roseWax: new THREE.MeshStandardMaterial({ color: 0xd7a999, roughness: 0.58, metalness: 0.01 }),
    wick: new THREE.MeshStandardMaterial({ color: 0x24201d, roughness: 0.90 }),
    linen: new THREE.MeshStandardMaterial({ color: 0xeae2d3, roughness: 0.84, metalness: 0.01 }),
    warmWool: new THREE.MeshStandardMaterial({ color: 0xdfd3c0, roughness: 0.88, metalness: 0.01 }),
    indigoFabric: new THREE.MeshStandardMaterial({ color: 0x38485c, roughness: 0.82, metalness: 0.01 }),
    rustFabric: new THREE.MeshStandardMaterial({ color: 0xa85239, roughness: 0.82, metalness: 0.01 }),
    seagrass: new THREE.MeshStandardMaterial({ color: 0xc9b086, roughness: 0.80, metalness: 0.02 }),
    leatherCognac: new THREE.MeshStandardMaterial({ color: 0x7a4424, roughness: 0.46, metalness: 0.04 }),
    leatherDark: new THREE.MeshStandardMaterial({ color: 0x472918, roughness: 0.50, metalness: 0.04 }),
    paperCream: new THREE.MeshStandardMaterial({ color: 0xf7f3e9, roughness: 0.78, metalness: 0.01 }),
    leafGreen: new THREE.MeshStandardMaterial({ color: 0x45693b, roughness: 0.48, metalness: 0.02 }),
    soil: new THREE.MeshStandardMaterial({ color: 0x3b2d23, roughness: 0.90, metalness: 0.01 }),
  };

  const makeLathe = (pts, segs = 64, mat = M.creamGlaze) => {
    const v2 = pts.map(([x, y]) => new THREE.Vector2(x, y));
    const geo = new THREE.LatheGeometry(v2, segs);
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, mat);
  };

  const makeTube = (pts, radius, mat, closed = false, segs = 48, rSegs = 20) => {
    const curve = new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z)), closed);
    const geo = new THREE.TubeGeometry(curve, segs, radius, rSegs, closed);
    geo.computeVertexNormals();
    return new THREE.Mesh(geo, mat);
  };

  // 4. TERRACOTTA POTS (Classic Ribbed Mediterranean Terracotta Planter + Saucer)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    // Drainage Saucer
    g.add(makeLathe([
      [0, -0.75], [0.76, -0.75], [0.84, -0.64], [0.80, -0.62], [0.72, -0.70], [0, -0.70]
    ], 64, M.terracotta));
    // Pot Body with Rolled Lip & Ribbed Collar
    g.add(makeLathe([
      [0, -0.70], [0.58, -0.70], [0.78, 0.34], [0.86, 0.38], [0.86, 0.62],
      [0.80, 0.64], [0.74, 0.42], [0.52, -0.62], [0, -0.62]
    ], 72, M.terracotta));
    // Decorative double relief rings
    const r1 = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.02, 16, 64), M.rawClay);
    r1.rotation.x = Math.PI / 2; r1.position.y = 0.14; g.add(r1);
    const r2 = r1.clone(); r2.scale.set(0.95, 0.95, 1); r2.position.y = -0.04; g.add(r2);
    s.add(g);
    await exportGLB(s, 'terracotta_pot.glb');
  }

  // 5. STONEWARE POTTERY (Speckled Ribbed Bottle-Neck Vessel with Glaze Drip)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    // Raw clay lower foot
    g.add(makeLathe([
      [0, -0.82], [0.52, -0.82], [0.72, -0.45], [0, -0.45]
    ], 64, M.rawClay));
    // Upper stoneware body
    const body = makeLathe([
      [0.70, -0.46], [0.86, -0.05], [0.82, 0.35], [0.42, 0.65],
      [0.32, 0.88], [0.38, 0.96], [0.34, 0.98], [0.26, 0.85], [0.32, 0.58], [0, 0.58]
    ], 72, M.oatmealStone);
    g.add(body);
    // Sage glaze collar dip
    g.add(makeLathe([
      [0.83, 0.15], [0.83, 0.36], [0.43, 0.66], [0.33, 0.88], [0.39, 0.96], [0.34, 0.97], [0.27, 0.85]
    ], 72, M.sageGlaze));
    s.add(g);
    await exportGLB(s, 'stoneware_pottery.glb');
  }

  // 6. DECORATIVE CERAMIC BOWLS (Fluted Pedestal Fruit/Centerpiece Bowl)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    // Pedestal Foot
    g.add(makeLathe([
      [0, -0.58], [0.56, -0.58], [0.48, -0.24], [0, -0.24]
    ], 64, M.rawClay));
    // Wide Fluted Bowl
    const bowl = makeLathe([
      [0, -0.26], [0.48, -0.26], [0.95, -0.05], [1.18, 0.32], [1.14, 0.36],
      [0.88, 0.02], [0.42, -0.18], [0, -0.18]
    ], 96, M.creamGlaze);
    const pos = bowl.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const r = Math.hypot(x, z);
      if (r > 0.52 && y > -0.20) {
        const a = Math.atan2(z, x);
        const f = Math.cos(a * 24) * 0.022 * ((r - 0.52) / 0.65);
        pos.setX(i, (x / r) * (r + f));
        pos.setZ(i, (z / r) * (r + f));
      }
    }
    bowl.geometry.computeVertexNormals();
    g.add(bowl);
    // Decorative ceramic spheres inside
    const sp1 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 32, 24), M.terracotta);
    sp1.position.set(-0.22, 0.02, 0.12); g.add(sp1);
    const sp2 = new THREE.Mesh(new THREE.SphereGeometry(0.19, 32, 24), M.sageGlaze);
    sp2.position.set(0.24, -0.01, -0.08); g.add(sp2);
    const sp3 = new THREE.Mesh(new THREE.SphereGeometry(0.16, 32, 24), M.ochreGlaze);
    sp3.position.set(0.05, -0.03, 0.25); g.add(sp3);
    s.add(g);
    await exportGLB(s, 'ceramic_bowl.glb');
  }

  // 7. WOODEN SCULPTURES (Carved Walnut Ribbon Mobius Sculpture on Plinth)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    // Matte Charcoal Plinth Base
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.22, 0.65), M.charcoalMatte);
    base.position.y = -0.78; g.add(base);
    // Brass Mounting Rods
    const rod1 = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.35, 16), M.brass);
    rod1.position.set(-0.18, -0.55, 0); g.add(rod1);
    const rod2 = rod1.clone(); rod2.position.set(0.18, -0.55, 0); g.add(rod2);
    // Carved Walnut Infinity / Abstract Loop
    const loopPts = [];
    for (let i = 0; i < 64; i++) {
      const t = (i / 64) * Math.PI * 2;
      const x = Math.sin(t) * 0.62 + Math.cos(2 * t) * 0.12;
      const y = Math.cos(t) * 0.72 + 0.15;
      const z = Math.sin(2 * t) * 0.28;
      loopPts.push([x, y, z]);
    }
    const loopMesh = makeTube(loopPts, 0.135, M.walnut, true, 96, 28);
    loopMesh.scale.set(1, 1, 0.78);
    g.add(loopMesh);
    s.add(g);
    await exportGLB(s, 'wooden_sculpture.glb');
  }

  // 8. CERAMIC CANDLE HOLDERS (Arched Duo Taper Candle Holder + Beeswax Tapers)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    // U-shaped Arch Ceramic Holder
    const arch = makeTube([
      [-0.48, 0.10, 0], [-0.48, -0.45, 0], [-0.25, -0.72, 0],
      [0.25, -0.72, 0], [0.48, -0.45, 0], [0.48, 0.28, 0]
    ], 0.16, M.terracotta, false, 48, 24);
    g.add(arch);
    // Brass Candle Cups
    const cup1 = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.15, 0.08, 32), M.brass);
    cup1.position.set(-0.48, 0.12, 0); g.add(cup1);
    const cup2 = cup1.clone(); cup2.position.set(0.48, 0.30, 0); g.add(cup2);
    // Tall Taper Candles
    const c1 = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.11, 0.95, 32), M.soyWax);
    c1.position.set(-0.48, 0.60, 0); g.add(c1);
    const c2 = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.11, 0.85, 32), M.beeswax);
    c2.position.set(0.48, 0.74, 0); g.add(c2);
    // Wicks
    const w1 = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.09, 8), M.wick);
    w1.position.set(-0.48, 1.11, 0); g.add(w1);
    const w2 = w1.clone(); w2.position.set(0.48, 1.20, 0); g.add(w2);
    s.add(g);
    await exportGLB(s, 'candle_holder.glb');
  }

  // 9. HANDMADE INCENSE HOLDERS (Stoneware Wave Dish + Brass Sphere + Incense Stick)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    // Long Oval Dish
    const dish = makeLathe([
      [0, -0.28], [0.85, -0.28], [0.98, -0.14], [0.94, -0.11], [0.80, -0.22], [0, -0.22]
    ], 64, M.sandstone);
    dish.scale.set(1.25, 1, 0.65);
    g.add(dish);
    // Brass Sphere Holder on one end
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.16, 32, 24), M.brass);
    sphere.position.set(-0.62, -0.09, 0);
    g.add(sphere);
    // Angled Incense Stick
    const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.45, 12), M.walnut);
    stick.position.set(0.02, 0.24, 0);
    stick.rotation.z = -1.12;
    g.add(stick);
    // Glowing Ember Tip
    const tip = new THREE.Mesh(
      new THREE.SphereGeometry(0.022, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xe25822, emissive: 0xd9381e, emissiveIntensity: 0.6 })
    );
    tip.position.set(0.67, 0.55, 0);
    g.add(tip);
    s.add(g);
    await exportGLB(s, 'incense_holder.glb');
  }

  // 10. SCULPTURAL CANDLES (Twisted Architectural Fluted Column Candle)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    const h = 1.45, r = 0.52;
    const geo = new THREE.CylinderGeometry(r * 0.88, r, h, 96, 64);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const dist = Math.hypot(x, z);
      if (dist > 0.02) {
        const twist = (y / h) * Math.PI * 1.25;
        const a = Math.atan2(z, x) + twist;
        const ribs = Math.cos(a * 12) * 0.048;
        const nr = dist + ribs;
        const origA = Math.atan2(z, x);
        pos.setX(i, Math.cos(origA) * nr);
        pos.setZ(i, Math.sin(origA) * nr);
      }
    }
    geo.computeVertexNormals();
    g.add(new THREE.Mesh(geo, M.beeswax));
    const wick = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.14, 12), M.wick);
    wick.position.y = h / 2 + 0.05;
    g.add(wick);
    s.add(g);
    await exportGLB(s, 'sculptural_candle.glb');
  }

  // 15. STONEWARE DINNER SETS (Stacked Dinner Plate, Salad Plate, and Bowl)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    // Large Dinner Plate
    g.add(makeLathe([
      [0, -0.45], [0.95, -0.45], [1.18, -0.32], [1.16, -0.28], [0.90, -0.39], [0, -0.39]
    ], 72, M.charcoalMatte));
    // Medium Salad Plate
    g.add(makeLathe([
      [0, -0.38], [0.72, -0.38], [0.90, -0.26], [0.88, -0.22], [0.68, -0.32], [0, -0.32]
    ], 72, M.oatmealStone));
    // Deep Cereal/Soup Bowl on Top
    g.add(makeLathe([
      [0, -0.31], [0.36, -0.31], [0.62, 0.08], [0.58, 0.10], [0.32, -0.24], [0, -0.24]
    ], 72, M.creamGlaze));
    // Gold/Terracotta rim accent
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.60, 0.016, 16, 64), M.terracotta);
    rim.rotation.x = Math.PI / 2; rim.position.y = 0.09; g.add(rim);
    s.add(g);
    await exportGLB(s, 'dinner_set.glb');
  }

  // 16. CERAMIC PITCHERS (Tall Pinched-Spout Stoneware Pitcher with Handle)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    const body = makeLathe([
      [0, -0.85], [0.46, -0.85], [0.68, -0.35], [0.64, 0.20], [0.44, 0.62],
      [0.48, 0.86], [0.44, 0.88], [0.38, 0.60], [0.54, 0.15], [0, -0.78]
    ], 72, M.creamGlaze);
    // Pinch spout on -X side
    const pos = body.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      if (y > 0.55 && x < -0.15) {
        const factor = (y - 0.55) / 0.35;
        const spoutPull = Math.max(0, 1 - Math.abs(z) / 0.25) * factor;
        pos.setX(i, x - spoutPull * 0.22);
        pos.setY(i, y + spoutPull * 0.08);
      }
    }
    body.geometry.computeVertexNormals();
    g.add(body);
    // Sweeping Handle on +X side
    const handle = makeTube([
      [0.43, 0.72, 0], [0.85, 0.76, 0], [0.94, 0.22, 0], [0.78, -0.30, 0], [0.60, -0.42, 0]
    ], 0.068, M.rawClay, false, 48, 20);
    g.add(handle);
    g.position.x = -0.10;
    s.add(g);
    await exportGLB(s, 'ceramic_pitcher.glb');
  }

  // 17. HANDMADE POTTERY JARS (Lidded Ginger/Canister Jar with Wooden Knob)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    // Jar Body
    g.add(makeLathe([
      [0, -0.82], [0.54, -0.82], [0.78, -0.35], [0.80, 0.28], [0.58, 0.58], [0.52, 0.66], [0, 0.66]
    ], 72, M.sageGlaze));
    // Terracotta Foot Band
    g.add(makeLathe([
      [0, -0.83], [0.55, -0.83], [0.64, -0.64], [0, -0.64]
    ], 72, M.rawClay));
    // Domed Ceramic Lid
    g.add(makeLathe([
      [0, 0.65], [0.58, 0.65], [0.54, 0.76], [0.22, 0.84], [0, 0.84]
    ], 64, M.creamGlaze));
    // Turned Walnut Finial Knob
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.11, 32, 24), M.walnut);
    knob.position.y = 0.91; g.add(knob);
    s.add(g);
    await exportGLB(s, 'pottery_jar.glb');
  }

  // 18. CERAMIC PLANTERS (Fluted Planter on Walnut Tripod Stand + Botanical Leaves)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    // 3 Walnut Legs + Crossbar
    for (let i = 0; i < 3; i++) {
      const a = (i * Math.PI * 2) / 3;
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.045, 0.95, 20), M.walnut);
      leg.position.set(Math.cos(a) * 0.62, -0.38, Math.sin(a) * 0.62);
      g.add(leg);
    }
    // White Ceramic Cylinder Pot
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.54, 0.78, 64), M.creamGlaze);
    pot.position.y = -0.12; g.add(pot);
    // Soil surface
    const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.05, 48), M.soil);
    soil.position.y = 0.26; g.add(soil);
    // Sculpted Botanical Leaves rising from pot
    const leafAngles = [0, 1.1, 2.2, 3.4, 4.5, 5.4];
    leafAngles.forEach((a, idx) => {
      const h = 0.45 + (idx % 3) * 0.16;
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 16), M.leafGreen);
      leaf.scale.set(0.55, 1.65, 0.12);
      leaf.position.set(Math.cos(a) * 0.22, 0.35 + h * 0.45, Math.sin(a) * 0.22);
      leaf.rotation.y = -a + Math.PI / 2;
      leaf.rotation.x = 0.38;
      g.add(leaf);
    });
    s.add(g);
    await exportGLB(s, 'ceramic_planter.glb');
  }

  // 19. HANDMADE EARRINGS (Brass & Terracotta Arch Statement Earrings on T-Stand)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    // Travertine Base + Brass T-Bar Stand
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.48, 0.14, 48), M.sandstone);
    base.position.y = -0.78; g.add(base);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.45, 16), M.brass);
    pole.position.y = -0.02; g.add(pole);
    const tbar = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.15, 16), M.brass);
    tbar.rotation.z = Math.PI / 2; tbar.position.y = 0.68; g.add(tbar);

    // Pair of Hanging Arch Statement Earrings (Left & Right)
    [-0.34, 0.34].forEach((x) => {
      const eg = new THREE.Group();
      eg.position.set(x, 0.68, 0);
      // Gold stud disc
      const stud = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.03, 32), M.brass);
      stud.rotation.x = Math.PI / 2; stud.position.y = -0.16; eg.add(stud);
      // Terracotta Half-Moon Slab
      const slab = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 32, 1, false, 0, Math.PI), M.terracotta);
      slab.rotation.x = Math.PI / 2; slab.rotation.z = Math.PI / 2; slab.position.y = -0.42; eg.add(slab);
      // Brass Open Arch Drop
      const arch = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.028, 16, 48, Math.PI), M.brass);
      arch.position.y = -0.68; eg.add(arch);
      g.add(eg);
    });
    s.add(g);
    await exportGLB(s, 'handmade_earrings.glb');
  }

  // 20. BRASS NECKLACES (Linen Jewelry Bust + Hammered Brass Torque & Crescent Pendant)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    // Sculpted Linen Bust Stand
    const bust = makeLathe([
      [0, -0.82], [0.34, -0.82], [0.26, -0.52], [0.68, -0.18],
      [0.64, 0.18], [0.34, 0.45], [0.28, 0.72], [0, 0.72]
    ], 64, M.charcoalMatte);
    bust.scale.set(1.05, 1, 0.58);
    g.add(bust);
    // Brass Collar Chain around the neck
    const chain = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.025, 20, 64), M.brass);
    chain.rotation.x = 1.12; chain.position.set(0, 0.22, 0.06); chain.scale.set(1, 0.85, 1);
    g.add(chain);
    // Hammered Gold Crescent Moon Pendant on Chest
    const pnd = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.042, 20, 48, Math.PI * 1.25), M.brass);
    pnd.rotation.z = -Math.PI * 1.12; pnd.rotation.x = -0.32;
    pnd.position.set(0, -0.02, 0.36);
    g.add(pnd);
    // Center Gemstone Drop
    const gem = new THREE.Mesh(new THREE.SphereGeometry(0.065, 24, 24), M.emerald);
    gem.position.set(0, -0.04, 0.38);
    g.add(gem);
    s.add(g);
    await exportGLB(s, 'brass_necklace.glb');
  }

  // 21. GEMSTONE RINGS (Gold Bezel Ring with Emerald-Cut Gemstone on Velvet Cone)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    // Travertine Ring Cone Display
    const cone = new THREE.Mesh(new THREE.ConeGeometry(0.44, 1.32, 64), M.sandstone);
    cone.position.set(-0.25, -0.10, -0.15);
    g.add(cone);
    // Hero Ring Tilted in Foreground
    const rg = new THREE.Group();
    rg.position.set(0.22, -0.18, 0.18);
    rg.rotation.set(0.45, -0.35, 0.18);
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.075, 32, 72), M.brass);
    rg.add(band);
    // Gold Bezel Setting on Top
    const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.14, 0.26), M.brass);
    bezel.position.y = 0.48; rg.add(bezel);
    // Faceted Emerald Gemstone
    const stone = new THREE.Mesh(new THREE.OctahedronGeometry(0.17, 1), M.emerald);
    stone.scale.set(1.15, 0.65, 0.92);
    stone.position.y = 0.54; rg.add(stone);
    g.add(rg);
    s.add(g);
    await exportGLB(s, 'gemstone_ring.glb');
  }

  // 22. BEADED BRACELETS (Natural Jade, Terracotta & Brass Beaded Bracelet Stack)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    const numBeads = 18;
    const ringR = 0.68;
    const mats = [M.sageGlaze, M.terracotta, M.sandstone, M.brass, M.turquoise, M.oatmealStone];
    for (let i = 0; i < numBeads; i++) {
      const a = (i / numBeads) * Math.PI * 2;
      const isGoldSpacer = i % 3 === 0;
      const bGeo = isGoldSpacer
        ? new THREE.CylinderGeometry(0.11, 0.11, 0.06, 24)
        : new THREE.SphereGeometry(0.135, 28, 24);
      const bead = new THREE.Mesh(bGeo, isGoldSpacer ? M.brass : mats[i % mats.length]);
      bead.position.set(Math.cos(a) * ringR, Math.sin(a) * 0.22, Math.sin(a) * ringR);
      if (isGoldSpacer) {
        bead.rotation.z = Math.PI / 2;
        bead.rotation.y = -a;
      }
      g.add(bead);
    }
    g.rotation.x = 0.35;
    s.add(g);
    await exportGLB(s, 'beaded_bracelet.glb');
  }

  // 23. POLYMER CLAY JEWELLERY (Terrazzo Geometric Slab Earrings on Arch Display Card)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    // Cream Arch Display Card
    const card = new THREE.Mesh(new THREE.BoxGeometry(1.12, 1.45, 0.04), M.paperCream);
    card.rotation.x = -0.15; g.add(card);
    // Two Geometric Polymer Clay Earrings mounted on the card
    [-0.28, 0.28].forEach((x) => {
      const eg = new THREE.Group();
      eg.position.set(x, 0.12, 0.05);
      eg.rotation.x = -0.15;
      // Top Circle Stud
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 32), M.ochreGlaze);
      top.rotation.x = Math.PI / 2; top.position.y = 0.32; eg.add(top);
      // Brass Jump Ring
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 12, 24), M.brass);
      ring.position.y = 0.18; eg.add(ring);
      // Terrazzo Arch Cutout Slab
      const arch = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.065, 20, 48, Math.PI * 1.3), M.roseWax);
      arch.rotation.z = -0.45; arch.position.y = -0.08; eg.add(arch);
      // Accent Terrazzo Dot
      const dot = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.045, 24), M.cobaltGlaze);
      dot.rotation.x = Math.PI / 2; dot.position.y = -0.34; eg.add(dot);
      g.add(eg);
    });
    s.add(g);
    await exportGLB(s, 'polymer_clay_jewellery.glb');
  }

  // 24. HANDMADE PENDANTS (Carved Sunburst Medallion Pendant on Chain)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    // V-shaped Gold Chain
    const chain = makeTube([
      [-0.65, 0.85, -0.1], [-0.22, 0.25, 0], [0, 0.12, 0.02], [0.22, 0.25, 0], [0.65, 0.85, -0.1]
    ], 0.018, M.brass, false, 48, 12);
    g.add(chain);
    // Bail Ring
    const bail = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.024, 16, 32), M.brass);
    bail.rotation.y = Math.PI / 2; bail.position.set(0, 0.06, 0.02); g.add(bail);
    // Hammered Medallion Disc
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.07, 64), M.agedBrass);
    disc.rotation.x = Math.PI / 2; disc.position.set(0, -0.48, 0.02); g.add(disc);
    // Raised Concentric Sun Ring & Turquoise Cabochon
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.025, 16, 48), M.brass);
    ring.position.set(0, -0.48, 0.06); g.add(ring);
    const cab = new THREE.Mesh(new THREE.SphereGeometry(0.18, 32, 24), M.turquoise);
    cab.scale.set(1, 1, 0.45); cab.position.set(0, -0.48, 0.06); g.add(cab);
    s.add(g);
    await exportGLB(s, 'handmade_pendant.glb');
  }

  // 25. SILVER JEWELLERY (Sculptural Sterling Silver Wave Cuff Bracelet)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    // Open Cuff Torus with Organic Wave Rim
    const cuffPts = [];
    for (let i = 0; i <= 48; i++) {
      const a = -Math.PI * 0.78 + (i / 48) * Math.PI * 1.56;
      cuffPts.push([Math.cos(a) * 0.68, Math.sin(a * 3) * 0.06, Math.sin(a) * 0.58]);
    }
    const cuff1 = makeTube(cuffPts, 0.095, M.silver, false, 64, 24);
    cuff1.scale.set(1, 2.2, 1);
    g.add(cuff1);
    // Intertwined Secondary Silver Strand
    const cuff2 = makeTube(cuffPts, 0.045, M.silver, false, 64, 16);
    cuff2.position.y = 0.14;
    g.add(cuff2);
    g.rotation.set(0.42, 0.35, -0.15);
    s.add(g);
    await exportGLB(s, 'silver_jewellery.glb');
  }

  // 26. HANDWOVEN RUGS (Textured Geometric Kilim Rug with Fringe Tassels)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    // Main Woven Rug Base tilted for clear 3D view
    const rg = new THREE.Group();
    rg.rotation.x = -0.65;
    rg.rotation.z = 0.25;
    const rug = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.95, 0.05), M.warmWool);
    rg.add(rug);
    // Raised Geometric Tufted Diamond Motifs
    [-0.45, 0, 0.45].forEach((y, idx) => {
      const dm = new THREE.Mesh(
        new THREE.BoxGeometry(0.48, 0.48, 0.07),
        idx === 1 ? M.terracotta : M.charcoalMatte
      );
      dm.rotation.z = Math.PI / 4;
      dm.position.set(0, y, 0.01);
      rg.add(dm);
    });
    // Border Stripes
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.08, 0.06), M.ochreGlaze);
    b1.position.set(0, 0.82, 0.01); rg.add(b1);
    const b2 = b1.clone(); b2.position.set(0, -0.82, 0.01); rg.add(b2);
    // Fringe Tassels at Top & Bottom
    for (let x = -0.62; x <= 0.62; x += 0.12) {
      const f1 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.18, 8), M.linen);
      f1.position.set(x, 1.06, 0); rg.add(f1);
      const f2 = f1.clone(); f2.position.set(x, -1.06, 0); rg.add(f2);
    }
    g.add(rg);
    s.add(g);
    await exportGLB(s, 'handwoven_rug.glb');
  }

  // 27. MACRAMÉ WALL HANGINGS (Wooden Dowel + Braided Knots & Layered Fringe)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    // Natural Oak Dowel Rod
    const dowel = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 1.55, 24), M.oak);
    dowel.rotation.z = Math.PI / 2; dowel.position.y = 0.62; g.add(dowel);
    // Hanging Cord Triangle at Top
    const hang = makeTube([[-0.55, 0.62, 0], [0, 1.02, 0], [0.55, 0.62, 0]], 0.016, M.linen, false, 24, 12);
    g.add(hang);
    // Vertical Macrame Cords with V-Shaped Fringe Bottom
    for (let i = -10; i <= 10; i++) {
      const x = i * 0.058;
      const len = 1.38 - Math.abs(i) * 0.055;
      const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.024, len, 12), M.warmWool);
      cord.position.set(x, 0.62 - len / 2, 0);
      g.add(cord);
    }
    // Layered Woven Diamond Knot Reliefs & Wooden Beads
    const chev1 = makeTube([[-0.56, 0.58, 0.03], [0, -0.05, 0.03], [0.56, 0.58, 0.03]], 0.042, M.linen, false, 32, 16);
    g.add(chev1);
    const chev2 = makeTube([[-0.38, 0.58, 0.04], [0, 0.18, 0.04], [0.38, 0.58, 0.04]], 0.038, M.oatmealStone, false, 32, 16);
    g.add(chev2);
    [-0.25, 0, 0.25].forEach((x) => {
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 16), M.walnut);
      bead.position.set(x, 0.25 - (x === 0 ? 0.18 : 0), 0.04);
      g.add(bead);
    });
    s.add(g);
    await exportGLB(s, 'macrame_hanging.glb');
  }

  // 28. EMBROIDERED CUSHION COVERS (Plump Throw Pillow + Tufted Botanical Arch & Tassels)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    // Plump Cushion Body
    const pillow = new THREE.Mesh(new THREE.SphereGeometry(0.88, 64, 48), M.linen);
    pillow.scale.set(1.05, 1.05, 0.42);
    const pos = pillow.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i);
      // Pinch corners slightly outward for realistic square cushion shape
      const corner = Math.pow(Math.abs(x * y), 0.7) * 0.38;
      pos.setX(i, x * (1 + corner));
      pos.setY(i, y * (1 + corner));
    }
    pillow.geometry.computeVertexNormals();
    g.add(pillow);
    // Raised Tufted Terracotta Arch & Sun Embroidery on Front
    const arch1 = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.055, 16, 48, Math.PI), M.terracotta);
    arch1.position.set(0, -0.12, 0.34); g.add(arch1);
    const arch2 = new THREE.Mesh(new THREE.TorusGeometry(0.20, 0.045, 16, 48, Math.PI), M.ochreGlaze);
    arch2.position.set(0, -0.12, 0.35); g.add(arch2);
    const sun = new THREE.Mesh(new THREE.SphereGeometry(0.12, 24, 24), M.sageGlaze);
    sun.scale.set(1, 1, 0.35); sun.position.set(0, 0.34, 0.33); g.add(sun);
    // 4 Corner Tassels
    [[-0.78, 0.78], [0.78, 0.78], [-0.78, -0.78], [0.78, -0.78]].forEach(([cx, cy]) => {
      const t = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), M.terracotta);
      t.scale.set(1.2, 0.8, 0.8); t.position.set(cx, cy, 0); g.add(t);
    });
    g.rotation.x = -0.18;
    s.add(g);
    await exportGLB(s, 'embroidered_cushion.glb');
  }

  // 29. HANDMADE TABLE RUNNERS (Rolled & Draped Woven Striped Linen Table Runner)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    // Rolled Cylinder of Fabric
    const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 1.32, 48), M.linen);
    roll.rotation.z = Math.PI / 2; roll.position.set(0, 0.12, -0.18); g.add(roll);
    // Woven Stripe Bands around the Roll
    [-0.42, 0, 0.42].forEach((x) => {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.285, 0.285, 0.08, 48), M.terracotta);
      band.rotation.z = Math.PI / 2; band.position.set(x, 0.12, -0.18); g.add(band);
    });
    // Unrolled Draped Tail cascading forward
    const tail = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.04, 1.15), M.linen);
    tail.position.set(0, -0.12, 0.28); tail.rotation.x = 0.15; g.add(tail);
    // Fringe on Front Edge
    for (let x = -0.58; x <= 0.58; x += 0.10) {
      const f = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.018, 0.16, 8), M.warmWool);
      f.rotation.x = Math.PI / 2 + 0.15; f.position.set(x, -0.21, 0.92); g.add(f);
    }
    s.add(g);
    await exportGLB(s, 'table_runner.glb');
  }

  // 30. WOVEN BASKETS (Two-Tone Coiled Seagrass Belly Basket with Handles)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    // Lower Cream/Natural Seagrass Half
    g.add(makeLathe([
      [0, -0.78], [0.55, -0.78], [0.88, -0.32], [0.92, 0.0], [0, 0.0]
    ], 72, M.creamGlaze));
    // Upper Warm Seagrass Half with Ridged Coils
    const upper = makeLathe([
      [0.91, -0.01], [0.86, 0.35], [0.68, 0.68], [0.62, 0.68], [0.78, 0.30], [0, -0.01]
    ], 72, M.seagrass);
    const pos = upper.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const r = Math.hypot(x, z);
      if (r > 0.55) {
        const coil = Math.sin(y * 42) * 0.015;
        pos.setX(i, (x / r) * (r + coil));
        pos.setZ(i, (z / r) * (r + coil));
      }
    }
    upper.geometry.computeVertexNormals();
    g.add(upper);
    // Twin Woven Loop Handles
    [-0.65, 0.65].forEach((x) => {
      const h = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.038, 16, 32, Math.PI), M.seagrass);
      h.rotation.y = Math.PI / 2; h.position.set(x, 0.66, 0); g.add(h);
    });
    s.add(g);
    await exportGLB(s, 'woven_basket.glb');
  }

  // 31. CROCHET BAGS (Textured Raffia/Cotton Crochet Tote Bag with Arched Straps)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    // Slouchy Textured Bag Body
    const bagGeo = new THREE.CylinderGeometry(0.68, 0.56, 0.98, 64, 32);
    bagGeo.scale(1.15, 1, 0.52);
    const pos = bagGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const stitch = Math.sin(x * 26) * Math.cos(y * 26) * 0.022;
      pos.setZ(i, z + (z >= 0 ? stitch : -stitch));
    }
    bagGeo.computeVertexNormals();
    const bag = new THREE.Mesh(bagGeo, M.seagrass);
    bag.position.y = -0.25; g.add(bag);
    // Contrast Terracotta Crochet Stripe Band
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.64, 0.22, 64), M.terracotta);
    stripe.scale.set(1.16, 1, 0.53); stripe.position.y = -0.22; g.add(stripe);
    // Front & Back Arched Shoulder Straps
    [-0.22, 0.22].forEach((z) => {
      const strap = makeTube([
        [-0.38, 0.22, z], [-0.36, 0.78, z * 0.5], [0, 0.92, z * 0.3], [0.36, 0.78, z * 0.5], [0.38, 0.22, z]
      ], 0.042, M.seagrass, false, 40, 16);
      g.add(strap);
    });
    s.add(g);
    await exportGLB(s, 'crochet_bag.glb');
  }

  // 32. HANDWOVEN BLANKETS (Folded Stack of 3 Chunky Woven Throws + Leather Strap)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    const colors = [M.warmWool, M.sageGlaze, M.terracotta];
    colors.forEach((mat, idx) => {
      const y = -0.45 + idx * 0.34;
      // Folded Rounded Blanket Layer
      const layer = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.28, 1.05), mat);
      layer.position.y = y;
      layer.rotation.y = (idx - 1) * 0.06;
      g.add(layer);
      // Rolled Edge Fold
      const fold = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 1.38, 32), mat);
      fold.rotation.z = Math.PI / 2; fold.position.set(0, y, 0.52);
      g.add(fold);
    });
    // Leather Carry Carrier Strap Wrapped Around Stack
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.06, 1.18), M.leatherCognac);
    strap.position.y = -0.11; g.add(strap);
    const buckle = new THREE.Mesh(new THREE.BoxGeometry(0.30, 0.08, 0.18), M.brass);
    buckle.position.set(0, 0.44, 0.25); g.add(buckle);
    s.add(g);
    await exportGLB(s, 'handwoven_blanket.glb');
  }

  // 33. LINEN TABLECLOTHS (Folded Washed Flax Tablecloth + Ceramic Napkin Ring)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    // Bottom Folded Linen Tablecloth Base
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.22, 1.12), M.linen);
    base.position.y = -0.35; g.add(base);
    const base2 = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.18, 0.98), M.oatmealStone);
    base2.position.y = -0.15; base2.rotation.y = 0.08; g.add(base2);
    // Rolled Linen Napkin on Top inside a Ceramic Ring
    const napkin = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.95, 32), M.paperCream);
    napkin.rotation.z = Math.PI / 2; napkin.rotation.y = 0.35; napkin.position.y = 0.12; g.add(napkin);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.045, 24, 48), M.terracotta);
    ring.rotation.y = Math.PI / 2 + 0.35; ring.position.y = 0.12; g.add(ring);
    s.add(g);
    await exportGLB(s, 'linen_tablecloth.glb');
  }

  // 34. ORIGINAL CANVAS PAINTINGS (Oak Floater Frame + Impasto 3D Arch Relief Painting)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    const fg = new THREE.Group();
    fg.rotation.x = -0.12;
    // Oak Floater Frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.42, 1.72, 0.12), M.oak);
    fg.add(frame);
    // Stretched Canvas Face
    const canvas = new THREE.Mesh(new THREE.BoxGeometry(1.30, 1.60, 0.13), M.paperCream);
    canvas.position.z = 0.01; fg.add(canvas);
    // 3D Impasto Relief Shapes (Terracotta Arch, Ochre Sun, Charcoal Horizon)
    const arch = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.05, 48), M.terracotta);
    arch.rotation.x = Math.PI / 2; arch.position.set(-0.12, -0.08, 0.06); fg.add(arch);
    const rect = new THREE.Mesh(new THREE.BoxGeometry(0.76, 0.56, 0.05), M.terracotta);
    rect.position.set(-0.12, -0.36, 0.06); fg.add(rect);
    const sun = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 48), M.ochreGlaze);
    sun.rotation.x = Math.PI / 2; sun.position.set(0.24, 0.36, 0.06); fg.add(sun);
    const wave = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.045, 16, 48, Math.PI), M.charcoalMatte);
    wave.position.set(0.15, -0.32, 0.07); fg.add(wave);
    g.add(fg);
    s.add(g);
    await exportGLB(s, 'canvas_painting.glb');
  }

  // 35. HANDMADE MINIATURE ART (Miniature Sculpted Bonsai Atelier Tree on Ceramic Plinth)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    // Glazed Oval Bonsai Pot
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.56, 0.28, 48), M.cobaltGlaze);
    pot.scale.set(1.2, 1, 0.85); pot.position.y = -0.62; g.add(pot);
    // Mossy Mound
    const moss = new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 24), M.leafGreen);
    moss.scale.set(1.2, 0.25, 0.85); moss.position.y = -0.48; g.add(moss);
    // Sculpted Gnarled Trunk
    const trunk = makeTube([
      [0, -0.48, 0], [-0.18, -0.10, 0.05], [0.12, 0.28, -0.05], [-0.08, 0.62, 0]
    ], 0.085, M.walnut, false, 36, 16);
    g.add(trunk);
    // Cloud Foliage Pads
    [[-0.38, 0.22, 0.08, 0.32], [0.34, 0.42, -0.06, 0.30], [-0.05, 0.72, 0, 0.38]].forEach(([x, y, z, r]) => {
      const pad = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), M.sageGlaze);
      pad.scale.set(1.35, 0.52, 1.05);
      pad.position.set(x, y, z);
      g.add(pad);
    });
    s.add(g);
    await exportGLB(s, 'miniature_art.glb');
  }

  // 36. HAND-PAINTED PLATES (Decorative Ceramic Plate with Raised Relief Motifs on Stand)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    const pg = new THREE.Group();
    pg.rotation.x = -0.25;
    // Ceramic Plate
    const plate = makeLathe([
      [0, -0.05], [0.68, -0.05], [0.95, 0.08], [0.92, 0.12], [0.64, 0.01], [0, 0.01]
    ], 72, M.creamGlaze);
    plate.rotation.x = Math.PI / 2;
    pg.add(plate);
    // Cobalt & Terracotta Concentric Rim Rings + Botanical Petals
    const r1 = new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.025, 16, 64), M.cobaltGlaze);
    r1.position.z = 0.08; pg.add(r1);
    const r2 = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.02, 16, 64), M.terracotta);
    r2.position.z = 0.03; pg.add(r2);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const petal = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 16), i % 2 === 0 ? M.cobaltGlaze : M.ochreGlaze);
      petal.scale.set(0.55, 1.4, 0.25);
      petal.position.set(Math.cos(a) * 0.28, Math.sin(a) * 0.28, 0.03);
      petal.rotation.z = a + Math.PI / 2;
      pg.add(petal);
    }
    const center = new THREE.Mesh(new THREE.SphereGeometry(0.11, 24, 24), M.terracotta);
    center.scale.set(1, 1, 0.35); center.position.z = 0.04; pg.add(center);
    g.add(pg);
    // Walnut Easel Legs
    [-0.42, 0.42].forEach((x) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.22, 0.45), M.walnut);
      leg.position.set(x, -0.82, 0.05); g.add(leg);
    });
    s.add(g);
    await exportGLB(s, 'painted_plate.glb');
  }

  // 37. WOODEN PICTURE FRAMES (Hand-Joined Walnut Frame with Linen Mat & Botanical Art)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    const fg = new THREE.Group();
    fg.rotation.x = -0.16;
    // Outer Walnut Frame Rails
    const top = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.14, 0.12), M.walnut);
    top.position.y = 0.74; fg.add(top);
    const bot = top.clone(); bot.position.y = -0.74; fg.add(bot);
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.62, 0.12), M.walnut);
    left.position.x = -0.61; fg.add(left);
    const right = left.clone(); right.position.x = 0.61; fg.add(right);
    // Cream Matboard & Inner Art Backing
    const mat = new THREE.Mesh(new THREE.BoxGeometry(1.12, 1.38, 0.06), M.paperCream);
    fg.add(mat);
    const art = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.96, 0.07), M.sandstone);
    fg.add(art);
    // Minimalist Gold Botanical Line inside Art
    const stem = makeTube([[-0.12, -0.32, 0.05], [0.04, 0, 0.05], [0.14, 0.32, 0.05]], 0.018, M.brass, false, 24, 12);
    fg.add(stem);
    g.add(fg);
    s.add(g);
    await exportGLB(s, 'wooden_frame.glb');
  }

  // 38. HANDMADE SKETCHBOOKS (Coptic-Stitched Linen Hardcover Sketchbook + Brass Pencil)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    const bg = new THREE.Group();
    bg.rotation.set(0.35, -0.32, 0.08);
    // Thick Deckle-Edge Paper Block
    const pages = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.24, 1.48), M.paperCream);
    bg.add(pages);
    // Top & Bottom Linen Hardcovers
    const topC = new THREE.Mesh(new THREE.BoxGeometry(1.16, 0.04, 1.54), M.sageGlaze);
    topC.position.y = 0.13; bg.add(topC);
    const botC = topC.clone(); botC.position.y = -0.13; bg.add(botC);
    // Exposed Coptic Spine Stitches on Left Edge
    for (let z = -0.58; z <= 0.58; z += 0.29) {
      const stitch = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.29, 12), M.terracotta);
      stitch.position.set(-0.57, 0, z); bg.add(stitch);
    }
    // Brass Drawing Pen resting diagonally on top cover
    const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 1.15, 16), M.brass);
    pen.rotation.z = Math.PI / 2; pen.rotation.y = 0.45; pen.position.set(0.08, 0.18, 0.12);
    bg.add(pen);
    g.add(bg);
    s.add(g);
    await exportGLB(s, 'handmade_sketchbook.glb');
  }

  // 39. ARTISAN PRINTS (Botanical Linocut Relief Print in Magnetic Oak Hanger Bars)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    // Heavy Cotton Rag Paper Sheet
    const sheet = new THREE.Mesh(new THREE.BoxGeometry(1.18, 1.56, 0.03), M.paperCream);
    g.add(sheet);
    // Top & Bottom Oak Poster Hanger Clamps
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.09, 0.08), M.oak);
    topBar.position.y = 0.78; g.add(topBar);
    const botBar = topBar.clone(); botBar.position.y = -0.78; g.add(botBar);
    // Hanging Cord
    const cord = makeTube([[-0.42, 0.78, 0], [0, 1.08, 0], [0.42, 0.78, 0]], 0.014, M.leatherCognac, false, 24, 12);
    g.add(cord);
    // Bold Linocut Matisse-Inspired Botanical Leaf Cutouts
    [[-0.22, -0.15, 0.25], [0.22, 0.05, -0.25], [-0.15, 0.32, 0.18], [0.18, -0.35, -0.22]].forEach(([x, y, r]) => {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.24, 24, 16), M.charcoalMatte);
      leaf.scale.set(0.65, 1.35, 0.12);
      leaf.position.set(x, y, 0.02);
      leaf.rotation.z = r;
      g.add(leaf);
    });
    const sun = new THREE.Mesh(new THREE.CylinderGeometry(0.20, 0.20, 0.04, 32), M.terracotta);
    sun.rotation.x = Math.PI / 2; sun.position.set(0, 0.44, 0.02); g.add(sun);
    s.add(g);
    await exportGLB(s, 'artisan_print.glb');
  }

  // 40. CLAY ART FIGURINES (Sculpted Modernist Ceramic Bird Figurine on Wood Base)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    // Round Walnut Base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.66, 0.12, 48), M.walnut);
    base.position.y = -0.62; g.add(base);
    // Plump Ceramic Bird Body (Lathe + Tail Pull)
    const bird = makeTube([
      [-0.55, 0.25, 0], [-0.38, 0.05, 0], [0, -0.22, 0], [0.48, -0.05, 0], [0.72, 0.35, 0]
    ], 0.36, M.creamGlaze, false, 48, 32);
    bird.scale.set(1, 1, 0.78);
    g.add(bird);
    // Sculpted Head & Brass Beak
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 32, 24), M.creamGlaze);
    head.position.set(-0.48, 0.32, 0); g.add(head);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.28, 24), M.brass);
    beak.rotation.z = Math.PI / 2 + 0.18; beak.position.set(-0.82, 0.36, 0); g.add(beak);
    // Glazed Wing Relief
    const wing = new THREE.Mesh(new THREE.SphereGeometry(0.34, 32, 24), M.terracotta);
    wing.scale.set(1.25, 0.68, 0.32); wing.position.set(0.05, -0.08, 0.24); wing.rotation.z = 0.22; g.add(wing);
    const wing2 = wing.clone(); wing2.position.z = -0.24; g.add(wing2);
    // Brass Legs
    [-0.12, 0.12].forEach((z) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.42, 12), M.brass);
      leg.position.set(-0.05, -0.42, z); g.add(leg);
    });
    s.add(g);
    await exportGLB(s, 'clay_figurine.glb');
  }

  // 41. HANDMADE LEATHER JOURNALS (Distressed Saddle-Tan Wrap-Around Leather Journal)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    const jg = new THREE.Group();
    jg.rotation.set(0.32, -0.38, 0.10);
    // Thick Deckle Vintage Pages
    const pages = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.32, 1.44), M.paperCream);
    jg.add(pages);
    // Wrap-around Cognac Leather Cover + Curved Spine
    const topL = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.045, 1.52), M.leatherCognac);
    topL.position.y = 0.17; jg.add(topL);
    const botL = topL.clone(); botL.position.y = -0.17; jg.add(botL);
    const spine = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.19, 1.52, 32, 1, false, 0, Math.PI), M.leatherCognac);
    spine.rotation.x = Math.PI / 2; spine.rotation.y = -Math.PI / 2; spine.position.x = -0.54; jg.add(spine);
    // Wrap-around Leather Tie Strap & Brass Button
    const strap = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.40, 0.14), M.leatherDark);
    jg.add(strap);
    const stud = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 24), M.brass);
    stud.position.set(0.15, 0.21, 0); jg.add(stud);
    g.add(jg);
    s.add(g);
    await exportGLB(s, 'leather_journal.glb');
  }

  // 42. WOODEN SERVING TRAYS (Carved Walnut Platter Tray with Brass Arch Handles)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    const tg = new THREE.Group();
    tg.rotation.x = 0.28;
    // Recessed Walnut Tray Body
    const outer = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.08, 0.16, 64), M.walnut);
    outer.scale.set(1.25, 1, 0.82); tg.add(outer);
    const inner = new THREE.Mesh(new THREE.CylinderGeometry(1.04, 1.02, 0.12, 64), M.oak);
    inner.scale.set(1.24, 1, 0.80); inner.position.y = 0.04; tg.add(inner);
    // Twin Brushed Brass Arch Handles on Left & Right Ends
    [-1.24, 1.24].forEach((x) => {
      const h = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.032, 16, 32, Math.PI), M.brass);
      h.rotation.y = Math.PI / 2; h.position.set(x, 0.08, 0); tg.add(h);
    });
    g.add(tg);
    s.add(g);
    await exportGLB(s, 'wooden_tray.glb');
  }

  // 43. NATURAL HANDMADE SOAPS (Stack of 3 Botanical Soap Bars Tied with Twine on Dish)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    // Slotted Oak Soap Dish
    const dish = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.12, 0.92), M.oak);
    dish.position.y = -0.52; g.add(dish);
    for (let x = -0.48; x <= 0.48; x += 0.16) {
      const slat = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.88), M.walnut);
      slat.position.set(x, -0.44, 0); g.add(slat);
    }
    // 3 Artisanal Soap Bars (Oatmeal, Rose Clay, Olive Sage)
    const soaps = [M.oatmealStone, M.roseWax, M.sageGlaze];
    soaps.forEach((mat, idx) => {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.96, 0.26, 0.64), mat);
      bar.position.y = -0.28 + idx * 0.27;
      bar.rotation.y = (idx - 1) * 0.12;
      g.add(bar);
    });
    // Jute Twine Ribbon Tied Around the Stack
    const twine = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.84, 0.68), M.seagrass);
    twine.position.y = -0.01; g.add(twine);
    s.add(g);
    await exportGLB(s, 'natural_soap.glb');
  }

  // 44. LEATHER WALLETS (Hand-Stitched Cognac Bifold Wallet with Brass Snap)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    const wg = new THREE.Group();
    wg.rotation.set(0.18, -0.35, 0.06);
    // Main Leather Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.96, 0.18), M.leatherCognac);
    wg.add(body);
    // Angled Front Card Pocket Layers
    const p1 = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.68, 0.05), M.leatherDark);
    p1.position.set(0, -0.12, 0.09); wg.add(p1);
    const p2 = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.44, 0.05), M.leatherCognac);
    p2.position.set(0, -0.24, 0.12); wg.add(p2);
    // Gold Card peeking out
    const card = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.22, 0.03), M.brass);
    card.position.set(0, 0.28, 0.08); wg.add(card);
    // Snap Tab Closure + Brass Button
    const tab = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.42, 0.06), M.leatherDark);
    tab.position.set(0.42, 0.05, 0.13); wg.add(tab);
    const snap = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.03, 24), M.brass);
    snap.rotation.x = Math.PI / 2; snap.position.set(0.42, -0.06, 0.16); wg.add(snap);
    g.add(wg);
    s.add(g);
    await exportGLB(s, 'leather_wallet.glb');
  }

  // 45. HANDMADE KEYCHAINS (Solid Brass Split Ring + Stamped Leather Fob & Wood Bead)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    // Solid Brass Keyring at Top
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.042, 24, 64), M.brass);
    ring.position.y = 0.56; g.add(ring);
    // Geometric Walnut Bead
    const bead = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), M.walnut);
    bead.position.y = 0.22; g.add(bead);
    // Looped Cognac Leather Strap Fob
    const strap = makeTube([
      [-0.14, -0.68, 0], [-0.22, -0.22, 0], [0, 0.16, 0], [0.22, -0.22, 0], [0.14, -0.68, 0]
    ], 0.075, M.leatherCognac, false, 48, 20);
    strap.scale.set(1, 1, 0.45);
    g.add(strap);
    // Brass Rivet Stud
    const rivet = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.14, 24), M.brass);
    rivet.rotation.x = Math.PI / 2; rivet.position.y = 0.02; g.add(rivet);
    s.add(g);
    await exportGLB(s, 'handmade_keychain.glb');
  }

  // 46. ARTISAN COASTERS (Stack of 4 Terrazzo & Cork Coasters in Brass Cradle)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    const mats = [M.creamGlaze, M.terracotta, M.sageGlaze, M.sandstone];
    mats.forEach((mat, i) => {
      const y = -0.38 + i * 0.18;
      // Cork Backing
      const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.76, 0.04, 64), M.oak);
      cork.position.y = y; g.add(cork);
      // Stone Coaster Top
      const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.76, 0.76, 0.09, 64), mat);
      stone.position.y = y + 0.06; g.add(stone);
      // Brass Inlay Ring
      const inlay = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.012, 12, 48), M.brass);
      inlay.rotation.x = Math.PI / 2; inlay.position.y = y + 0.105; g.add(inlay);
    });
    // Minimalist Brass U-Cradle Holder
    [-0.45, 0.45].forEach((z) => {
      const bar = makeTube([
        [-0.82, 0.32, z], [-0.82, -0.48, z], [0.82, -0.48, z], [0.82, 0.32, z]
      ], 0.028, M.brass, false, 32, 16);
      g.add(bar);
    });
    g.rotation.x = 0.22;
    s.add(g);
    await exportGLB(s, 'artisan_coasters.glb');
  }

  // 47. WOODEN PHONE STANDS (Sculpted Bent-Walnut Desk Dock with Brass Rest)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    // Curved Walnut Cradle Profile
    const stand = makeTube([
      [0, -0.68, 0.48], [0, -0.68, -0.42], [0, -0.42, -0.52],
      [0, 0.68, -0.05], [0, 0.78, 0.02]
    ], 0.11, M.walnut, false, 48, 24);
    stand.scale.set(3.8, 1, 1);
    g.add(stand);
    // Brass Front Lip Ledge
    const ledge = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.16, 0.18), M.brass);
    ledge.position.set(0, -0.28, 0.24);
    ledge.rotation.x = -0.42;
    g.add(ledge);
    // Sound amplification port hole
    const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.22, 24), M.charcoalMatte);
    hole.rotation.x = Math.PI / 2; hole.position.set(0, -0.28, 0.25);
    g.add(hole);
    g.rotation.y = -0.48;
    s.add(g);
    await exportGLB(s, 'phone_stand.glb');
  }

  // 48. HANDMADE STATIONERY (Deckle-Edge Envelopes Tied with Ribbon + Gold Wax Seal)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    const sg = new THREE.Group();
    sg.rotation.set(0.32, -0.28, 0.05);
    // Stack of Cream & Sage Deckle Envelopes
    const e1 = new THREE.Mesh(new THREE.BoxGeometry(1.38, 0.14, 0.96), M.sageGlaze);
    e1.position.y = -0.14; sg.add(e1);
    const e2 = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.16, 0.94), M.paperCream);
    e2.position.y = 0.01; e2.rotation.y = 0.06; sg.add(e2);
    // Silk Ribbon Band + Wax Seal Medallion on Top
    const rib = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.34, 0.98), M.terracotta);
    rib.position.y = -0.06; sg.add(rib);
    const seal = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.19, 0.04, 32), M.brass);
    seal.position.set(0, 0.11, 0); sg.add(seal);
    const sealInner = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.05, 32), M.agedBrass);
    sealInner.position.set(0, 0.11, 0); sg.add(sealInner);
    // Turned Walnut & Brass Wax Seal Stamp standing beside stack
    const stampBrass = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.24, 32), M.brass);
    stampBrass.position.set(0.68, -0.10, 0.35); sg.add(stampBrass);
    const stampWood = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.55, 32), M.walnut);
    stampWood.position.set(0.68, 0.28, 0.35); sg.add(stampWood);
    g.add(sg);
    s.add(g);
    await exportGLB(s, 'handmade_stationery.glb');
  }

  // 49. REUSABLE FABRIC BAGS (Structured Organic Canvas Market Tote + Leather Handles)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    // Structured Canvas Tote Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.16, 1.12, 0.42), M.linen);
    body.position.y = -0.22; g.add(body);
    // Contrast Dip-Dyed Indigo Bottom Gusset
    const bottom = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.34, 0.44), M.indigoFabric);
    bottom.position.y = -0.62; g.add(bottom);
    // Front Slip Pocket
    const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.56, 0.04), M.oatmealStone);
    pocket.position.set(0, -0.14, 0.22); g.add(pocket);
    // Twin Cognac Leather Handles + Brass Rivets
    [-0.22, 0.22].forEach((z) => {
      const h = makeTube([
        [-0.32, 0.22, z], [-0.30, 0.78, z * 0.6], [0, 0.90, z * 0.4], [0.30, 0.78, z * 0.6], [0.32, 0.22, z]
      ], 0.032, M.leatherCognac, false, 36, 16);
      g.add(h);
    });
    [-0.32, 0.32].forEach((x) => {
      const rv = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.46, 16), M.brass);
      rv.rotation.x = Math.PI / 2; rv.position.set(x, 0.24, 0); g.add(rv);
    });
    s.add(g);
    await exportGLB(s, 'fabric_bag.glb');
  }

  // 50. HANDCRAFTED GIFT BOXES (Linen Keepsake Box + Gold Satin Ribbon Bow & Wax Seal)
  {
    const s = new THREE.Scene();
    const g = new THREE.Group();
    const bg = new THREE.Group();
    bg.rotation.set(0.22, -0.38, 0);
    // Box Base
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.22, 0.68, 1.22), M.creamGlaze);
    box.position.y = -0.12; bg.add(box);
    // Fitted Box Lid
    const lid = new THREE.Mesh(new THREE.BoxGeometry(1.28, 0.20, 1.28), M.oatmealStone);
    lid.position.y = 0.24; bg.add(lid);
    // Crossed Gold Satin Ribbons
    const r1 = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.86, 1.30), M.brass);
    r1.position.y = -0.06; bg.add(r1);
    const r2 = new THREE.Mesh(new THREE.BoxGeometry(1.30, 0.86, 0.20), M.brass);
    r2.position.y = -0.06; bg.add(r2);
    // Sculpted Bow Loops on Top
    [-0.22, 0.22].forEach((x) => {
      const loop = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.055, 16, 32), M.brass);
      loop.rotation.x = Math.PI / 2; loop.rotation.y = x > 0 ? -0.35 : 0.35;
      loop.position.set(x, 0.42, 0); bg.add(loop);
    });
    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.09, 24, 24), M.agedBrass);
    knot.position.set(0, 0.38, 0); bg.add(knot);
    g.add(bg);
    s.add(g);
    await exportGLB(s, 'gift_box.glb');
  }

  console.log('Successfully generated all 43 additional artisanal 3D GLB models (50 total)!');
}

main().catch(console.error);
