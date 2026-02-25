/**
 * preview3d.js — Bunny Plush Designer
 * Cute plush bunny built from simple primitives (spheres, cylinders)
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { BUNNY_COLORS } from './parameters.js';

const CM = 0.1; // 1cm = 0.1 scene units

export class Preview3D {
  constructor(canvas) {
    this.canvas = canvas;
    this._meshGroup = null;
    this._initScene();
    this._initLights();
    this._fabricTextures = this._createFabricTextures();
    this._initControls();
    this._startLoop();
  }

  /* ── Scene ── */
  _initScene() {
    const w = this.canvas.offsetWidth || window.innerWidth * 0.75;
    const h = this.canvas.offsetHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.renderer.shadowMap.enabled   = true;
    this.renderer.shadowMap.type      = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping         = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.outputColorSpace    = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111316);
    this.scene.fog        = new THREE.Fog(0x111316, 22, 56);

    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 100);
    this.camera.position.set(0, 3, 14);

    const grid = new THREE.GridHelper(20, 20, 0x222222, 0x222222);
    grid.position.y = -5;
    this.scene.add(grid);

    const floorMat = new THREE.MeshStandardMaterial({ color: 0x15181c, roughness: 0.95 });
    this.floor = new THREE.Mesh(new THREE.PlaneGeometry(36, 36), floorMat);
    this.floor.rotation.x = -Math.PI / 2;
    this.floor.position.y = -5.02;
    this.floor.receiveShadow = true;
    this.scene.add(this.floor);
  }

  /* ── Lights ── */
  _initLights() {
    this.scene.add(new THREE.HemisphereLight(0xe5ebff, 0x0c0f13, 0.55));
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.22));

    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(5, 8, 7);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.bias           = -0.00018;
    key.shadow.camera.left   = -10;
    key.shadow.camera.right  =  10;
    key.shadow.camera.top    =  10;
    key.shadow.camera.bottom = -10;
    this.scene.add(key);

    const fill = new THREE.DirectionalLight(0x9ab8ff, 0.5);
    fill.position.set(-6, 3, -4);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffffff, 0.38);
    rim.position.set(0, 4, -8);
    this.scene.add(rim);
  }

  /* ── Plush textures (canvas-based soft velvet) ── */
  _createFabricTextures() {
    const size = 256;
    const make = () => {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      return c;
    };

    // Color — soft fuzzy noise
    const cc = make(); const cx = cc.getContext('2d');
    cx.fillStyle = '#e8e0d8'; cx.fillRect(0, 0, size, size);
    for (let i = 0; i < 6000; i++) {
      const v = 200 + Math.floor(Math.random() * 40);
      cx.fillStyle = `rgb(${v},${v},${v})`;
      cx.fillRect(Math.floor(Math.random() * size), Math.floor(Math.random() * size), 1, 1);
    }
    for (let y = 0; y < size; y += 2) {
      cx.fillStyle = `rgba(255,255,255,${0.01 + Math.random() * 0.02})`;
      cx.fillRect(0, y, size, 1);
    }

    // Bump — subtle fuzz
    const bc = make(); const bx = bc.getContext('2d');
    bx.fillStyle = '#808080'; bx.fillRect(0, 0, size, size);
    for (let i = 0; i < 4000; i++) {
      const v = 110 + Math.floor(Math.random() * 36);
      bx.fillStyle = `rgb(${v},${v},${v})`;
      bx.fillRect(Math.floor(Math.random() * size), Math.floor(Math.random() * size), 2, 2);
    }

    // Roughness — high for plush
    const rc = make(); const rx = rc.getContext('2d');
    rx.fillStyle = '#e8e8e8'; rx.fillRect(0, 0, size, size);
    for (let i = 0; i < 3000; i++) {
      const v = 200 + Math.floor(Math.random() * 40);
      rx.fillStyle = `rgb(${v},${v},${v})`;
      rx.fillRect(Math.floor(Math.random() * size), Math.floor(Math.random() * size), 2, 2);
    }

    const map          = new THREE.CanvasTexture(cc);
    const bumpMap      = new THREE.CanvasTexture(bc);
    const roughnessMap = new THREE.CanvasTexture(rc);

    [map, bumpMap, roughnessMap].forEach(t => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(3, 3);
      t.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    });
    map.colorSpace = THREE.SRGBColorSpace;
    return { map, bumpMap, roughnessMap };
  }

  /* ── Controls ── */
  _initControls() {
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.minDistance   = 3;
    this.controls.maxDistance   = 22;
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  _startLoop() {
    const animate = () => {
      requestAnimationFrame(animate);
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    };
    animate();
  }

  resize() {
    const w = this.canvas.offsetWidth;
    const h = this.canvas.offsetHeight;
    if (!w || !h) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  update(p) {
    if (this._meshGroup) {
      this.scene.remove(this._meshGroup);
      this._disposeMeshGroup(this._meshGroup);
    }
    this._meshGroup = this._buildBunny(p);
    this.scene.add(this._meshGroup);
  }

  _disposeMeshGroup(group) {
    group.traverse(obj => {
      if (!obj.isMesh) return;
      obj.geometry.dispose();
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach(m => m.dispose());
    });
  }

  /* ── Material helper ── */
  _makePlushMat(colorHex) {
    return new THREE.MeshStandardMaterial({
      color:        colorHex,
      map:          this._fabricTextures.map,
      bumpMap:      this._fabricTextures.bumpMap,
      bumpScale:    0.015,
      roughnessMap: this._fabricTextures.roughnessMap,
      roughness:    0.95,
      metalness:    0.0,
      side:         THREE.FrontSide,
    });
  }

  /* ============================================================
   * BUNNY PLUSH BUILDER
   *
   * All primitives: SphereGeometry, CylinderGeometry, TorusGeometry
   * No vertex deformation — guaranteed clean render
   * ============================================================ */
  _buildBunny(p) {
    const group = new THREE.Group();

    const S     = (p.bodySize / 16); // scale factor relative to default 16cm
    const chub  = p.chubbiness / 100;
    const mainColor = BUNNY_COLORS[p.color] || 0xf5f0e8;
    const mat   = this._makePlushMat(mainColor);

    // Accent colors
    const innerEarColor = p.color === 'black' ? 0x555555 :
                          p.color === 'brown' ? 0xc8a080 :
                          p.color === 'grey'  ? 0xd0b0b8 : 0xf0b8c0;
    const bellyColor    = p.color === 'black' ? 0x444448 :
                          p.color === 'brown' ? 0xc8b090 : 0xfff5ee;

    // ── BODY ──
    const bodyRX = 3.0 * S * chub;
    const bodyRY = 3.6 * S;
    const bodyRZ = 2.8 * S * chub;
    const bodyGeo = new THREE.SphereGeometry(1, 32, 24);
    bodyGeo.scale(bodyRX, bodyRY, bodyRZ);
    const body = new THREE.Mesh(bodyGeo, mat);
    body.position.y = bodyRY + 0.3 * S;
    body.castShadow = body.receiveShadow = true;
    group.add(body);

    // Belly patch (lighter oval on front)
    const bellyMat = this._makePlushMat(bellyColor);
    const bellyGeo = new THREE.SphereGeometry(1, 24, 16);
    bellyGeo.scale(bodyRX * 0.65, bodyRY * 0.55, bodyRZ * 0.3);
    const belly = new THREE.Mesh(bellyGeo, bellyMat);
    belly.position.set(0, bodyRY - 0.3 * S, bodyRZ * 0.82);
    belly.castShadow = true;
    group.add(belly);

    // ── HEAD ──
    const headR = 2.5 * S * Math.pow(chub, 0.3);
    const headGeo = new THREE.SphereGeometry(headR, 32, 24);
    const head = new THREE.Mesh(headGeo, mat);
    const headY = bodyRY * 2 + headR * 0.55;
    head.position.y = headY;
    head.castShadow = head.receiveShadow = true;
    group.add(head);

    // ── CHEEKS (subtle puffs) ──
    const cheekR = headR * 0.32 * chub;
    const cheekGeo = new THREE.SphereGeometry(cheekR, 16, 12);
    for (const side of [-1, 1]) {
      const cheek = new THREE.Mesh(cheekGeo, mat);
      cheek.position.set(side * headR * 0.65, headY - headR * 0.25, headR * 0.6);
      cheek.castShadow = true;
      group.add(cheek);
    }

    // ── MUZZLE (snout area) ──
    const muzzleGeo = new THREE.SphereGeometry(1, 20, 14);
    muzzleGeo.scale(headR * 0.35, headR * 0.25, headR * 0.3);
    const muzzle = new THREE.Mesh(muzzleGeo, bellyMat);
    muzzle.position.set(0, headY - headR * 0.15, headR * 0.85);
    muzzle.castShadow = true;
    group.add(muzzle);

    // ── NOSE (tiny pink triangle-ish sphere) ──
    const noseMat = new THREE.MeshStandardMaterial({
      color: 0xf08090, roughness: 0.4, metalness: 0.0,
    });
    const noseGeo = new THREE.SphereGeometry(headR * 0.1, 12, 8);
    noseGeo.scale(1, 0.7, 0.8);
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, headY - headR * 0.05, headR * 1.05);
    group.add(nose);

    // ── EYES ──
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0x151518, roughness: 0.15, metalness: 0.3,
    });
    const eyeR   = headR * 0.13;
    const eyeGeo = new THREE.SphereGeometry(eyeR, 14, 10);
    for (const side of [-1, 1]) {
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(side * headR * 0.38, headY + headR * 0.12, headR * 0.82);
      group.add(eye);

      // Eye shine
      const shineMat = new THREE.MeshStandardMaterial({
        color: 0xffffff, roughness: 0.0, metalness: 0.0, emissive: 0xffffff, emissiveIntensity: 0.3,
      });
      const shineGeo = new THREE.SphereGeometry(eyeR * 0.3, 8, 6);
      const shine = new THREE.Mesh(shineGeo, shineMat);
      shine.position.set(
        side * headR * 0.38 + side * eyeR * 0.3,
        headY + headR * 0.12 + eyeR * 0.3,
        headR * 0.82 + eyeR * 0.4
      );
      group.add(shine);
    }

    // ── EARS ──
    const earLen = p.earLength * CM * S;
    const earW   = headR * 0.35;
    const earD   = headR * 0.15;
    const innerEarMat = this._makePlushMat(innerEarColor);

    for (const side of [-1, 1]) {
      const earGroup = new THREE.Group();

      // Outer ear (capsule = cylinder + 2 half-spheres)
      const cylGeo = new THREE.CylinderGeometry(earW, earW * 0.9, earLen, 16, 1);
      const ear = new THREE.Mesh(cylGeo, mat);
      ear.castShadow = true;
      earGroup.add(ear);

      // Rounded top cap
      const topCap = new THREE.Mesh(new THREE.SphereGeometry(earW, 16, 12), mat);
      topCap.position.y = earLen / 2;
      earGroup.add(topCap);

      // Bottom cap
      const botCap = new THREE.Mesh(new THREE.SphereGeometry(earW * 0.9, 16, 12), mat);
      botCap.position.y = -earLen / 2;
      earGroup.add(botCap);

      // Inner ear (slightly recessed pink/accent strip)
      const innerGeo = new THREE.CylinderGeometry(earW * 0.55, earW * 0.5, earLen * 0.75, 12, 1);
      const innerEar = new THREE.Mesh(innerGeo, innerEarMat);
      innerEar.position.z = earD * 0.7;
      earGroup.add(innerEar);

      const innerTopCap = new THREE.Mesh(
        new THREE.SphereGeometry(earW * 0.55, 12, 8), innerEarMat
      );
      innerTopCap.position.set(0, earLen * 0.75 / 2, earD * 0.7);
      earGroup.add(innerTopCap);

      // Position ear on head
      const earBaseX = side * headR * 0.45;
      const earBaseY = headY + headR * 0.75;

      earGroup.position.set(earBaseX, earBaseY + earLen / 2, 0);

      // Ear style rotation
      if (p.earStyle === 'floppy') {
        earGroup.rotation.z = side * 0.5;
        earGroup.rotation.x = 0.3;
      } else if (p.earStyle === 'lop') {
        earGroup.rotation.z = side * 1.3;
        earGroup.rotation.x = 0.15;
        earGroup.position.y = earBaseY;
      } else {
        // straight — slight outward tilt
        earGroup.rotation.z = side * 0.12;
      }

      group.add(earGroup);
    }

    // ── ARMS (small oval paws at sides) ──
    const armRX = 1.2 * S * chub;
    const armRY = 1.8 * S;
    const armRZ = 1.1 * S * chub;
    const armGeo = new THREE.SphereGeometry(1, 20, 14);
    armGeo.scale(armRX, armRY, armRZ);
    for (const side of [-1, 1]) {
      const arm = new THREE.Mesh(armGeo, mat);
      arm.position.set(side * (bodyRX + armRX * 0.4), bodyRY + armRY * 0.6, bodyRZ * 0.2);
      arm.rotation.z = side * 0.35;
      arm.castShadow = true;
      group.add(arm);

      // Paw pad (small lighter circle on inside)
      const padGeo = new THREE.SphereGeometry(armRX * 0.45, 12, 8);
      padGeo.scale(1, 1, 0.4);
      const pad = new THREE.Mesh(padGeo, bellyMat);
      pad.position.set(
        side * (bodyRX + armRX * 0.4) + side * armRX * 0.2,
        bodyRY + armRY * 0.1,
        bodyRZ * 0.2 + armRZ * 0.6
      );
      pad.castShadow = true;
      group.add(pad);
    }

    // ── LEGS (chubby bottom paws) ──
    const legRX = 1.6 * S * chub;
    const legRY = 1.3 * S;
    const legRZ = 2.0 * S * chub;
    const legGeo = new THREE.SphereGeometry(1, 20, 14);
    legGeo.scale(legRX, legRY, legRZ);
    for (const side of [-1, 1]) {
      const leg = new THREE.Mesh(legGeo, mat);
      leg.position.set(side * bodyRX * 0.55, legRY * 0.6, bodyRZ * 0.35);
      leg.castShadow = true;
      group.add(leg);

      // Foot pad
      const footPadGeo = new THREE.SphereGeometry(legRX * 0.55, 12, 8);
      footPadGeo.scale(1, 0.8, 0.5);
      const footPad = new THREE.Mesh(footPadGeo, bellyMat);
      footPad.position.set(side * bodyRX * 0.55, legRY * 0.15, bodyRZ * 0.35 + legRZ * 0.7);
      group.add(footPad);
    }

    // ── TAIL (pompom) ──
    const tailR = p.tailSize * CM * S * chub;
    const tailGeo = new THREE.SphereGeometry(tailR, 20, 14);
    const tailMesh = new THREE.Mesh(tailGeo, bellyMat);
    tailMesh.position.set(0, bodyRY + 0.5 * S, -bodyRZ - tailR * 0.4);
    tailMesh.castShadow = true;
    group.add(tailMesh);

    // ── WHISKERS (thin cylinders) ──
    const whiskerMat = new THREE.MeshStandardMaterial({
      color: 0xcccccc, roughness: 0.3, metalness: 0.1,
    });
    const whiskerLen = headR * 0.8;
    const whiskerGeo = new THREE.CylinderGeometry(0.02 * S, 0.01 * S, whiskerLen, 4);
    for (const side of [-1, 1]) {
      for (let w = 0; w < 3; w++) {
        const whisker = new THREE.Mesh(whiskerGeo, whiskerMat);
        const angleY = side * (0.2 + w * 0.15);
        const yOff   = -headR * 0.15 + w * headR * 0.08;
        whisker.position.set(
          side * headR * 0.5,
          headY + yOff,
          headR * 0.75
        );
        whisker.rotation.z = Math.PI / 2 + side * (0.1 + w * 0.08);
        whisker.rotation.y = angleY;
        group.add(whisker);
      }
    }

    // ── ACCESSORY ──
    if (p.accessory === 'bowtie') {
      group.add(this._buildBowtie(S, bodyRY, bodyRZ, headR, headY));
    } else if (p.accessory === 'scarf') {
      group.add(this._buildScarf(S, bodyRX, bodyRY, bodyRZ, chub));
    } else if (p.accessory === 'ribbon') {
      group.add(this._buildRibbon(S, headR, headY, p.earStyle));
    }

    // Center the bunny
    const totalH = headY + headR + p.earLength * CM * S;
    group.position.y = -totalH / 2 + 1.5;
    return group;
  }

  /* ── Bowtie accessory ── */
  _buildBowtie(S, bodyRY, bodyRZ, headR, headY) {
    const btGroup = new THREE.Group();
    const btMat = new THREE.MeshStandardMaterial({
      color: 0xcc2244, roughness: 0.5, metalness: 0.1,
    });

    // Two triangle-ish lobes (scaled spheres)
    const lobeGeo = new THREE.SphereGeometry(0.8 * S, 12, 8);
    lobeGeo.scale(1, 0.6, 0.4);
    for (const side of [-1, 1]) {
      const lobe = new THREE.Mesh(lobeGeo, btMat);
      lobe.position.x = side * 0.7 * S;
      lobe.rotation.z = side * 0.3;
      btGroup.add(lobe);
    }

    // Center knot
    const knotGeo = new THREE.SphereGeometry(0.3 * S, 10, 8);
    btGroup.add(new THREE.Mesh(knotGeo, btMat));

    btGroup.position.set(0, headY - headR * 1.15, bodyRZ * 0.95);
    return btGroup;
  }

  /* ── Scarf accessory ── */
  _buildScarf(S, bodyRX, bodyRY, bodyRZ, chub) {
    const scarfGroup = new THREE.Group();
    const scarfMat = new THREE.MeshStandardMaterial({
      color: 0x3366aa, roughness: 0.7, metalness: 0.0,
    });

    // Scarf wrap (torus around neck)
    const neckR = bodyRX * 0.85;
    const tubeR = 0.4 * S;
    const torusGeo = new THREE.TorusGeometry(neckR, tubeR, 12, 24);
    const torus = new THREE.Mesh(torusGeo, scarfMat);
    torus.rotation.x = Math.PI / 2;
    torus.position.y = bodyRY * 2 - 0.5 * S;
    scarfGroup.add(torus);

    // Hanging end
    const endGeo = new THREE.CylinderGeometry(tubeR * 0.9, tubeR * 0.6, 3 * S, 8);
    const end = new THREE.Mesh(endGeo, scarfMat);
    end.position.set(neckR * 0.6, bodyRY * 2 - 2 * S, bodyRZ * 0.6);
    end.rotation.z = 0.4;
    scarfGroup.add(end);

    return scarfGroup;
  }

  /* ── Ribbon accessory (on head between ears) ── */
  _buildRibbon(S, headR, headY, earStyle) {
    const ribGroup = new THREE.Group();
    const ribMat = new THREE.MeshStandardMaterial({
      color: 0xee66aa, roughness: 0.4, metalness: 0.05,
    });

    const lobeGeo = new THREE.SphereGeometry(0.6 * S, 10, 8);
    lobeGeo.scale(1, 0.7, 0.5);
    for (const side of [-1, 1]) {
      const lobe = new THREE.Mesh(lobeGeo, ribMat);
      lobe.position.x = side * 0.5 * S;
      lobe.rotation.z = side * 0.4;
      ribGroup.add(lobe);
    }

    const knotGeo = new THREE.SphereGeometry(0.22 * S, 8, 6);
    ribGroup.add(new THREE.Mesh(knotGeo, ribMat));

    ribGroup.position.set(headR * 0.5, headY + headR * 0.85, headR * 0.2);
    ribGroup.rotation.z = -0.2;
    return ribGroup;
  }
}
