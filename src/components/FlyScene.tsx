import { useEffect, useRef, useState, type RefObject } from "react";
import * as THREE from "three";

type FlybodyPart = {
  group: "body" | "front_left" | "front_right";
  material: string;
  positionByteOffset: number;
  positionCount: number;
  indexByteOffset: number;
  indexCount: number;
};

type FlybodyModel = {
  binary: string;
  outputTriangles: number;
  pivots: Record<FlybodyPart["group"], [number, number, number]>;
  parts: FlybodyPart[];
};

function keyLabel(letter: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext("2d");
  if (!context) return null;
  context.fillStyle = "#17130f";
  context.font = "600 26px ui-monospace, monospace";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(letter, 64, 68);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function FlyScene({ controls }: { controls: RefObject<{ left: number; right: number }> }) {
  const host = useRef<HTMLDivElement>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const element = host.current;
    if (!element) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 100);
    camera.position.set(3.6, 2.3, 5.0);
    camera.lookAt(0, -0.18, 0.1);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    element.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffe7c4, 0x120e09, 2.35));
    const keyLight = new THREE.DirectionalLight(0xffd49a, 4.8);
    keyLight.position.set(3.4, 5.2, 4.5);
    scene.add(keyLight);
    const rim = new THREE.PointLight(0xf2b84b, 18, 7);
    rim.position.set(-2.5, 1.2, -1.5);
    scene.add(rim);

    const rig = new THREE.Group();
    rig.rotation.set(-0.04, -0.08, -0.015);
    scene.add(rig);

    const modelRoot = new THREE.Group();
    modelRoot.position.set(0, 0.35, -0.02);
    modelRoot.scale.setScalar(5);
    rig.add(modelRoot);

    const bodyGroup = new THREE.Group();
    const frontLeft = new THREE.Group();
    const frontRight = new THREE.Group();
    let frontLeftRestY = 0;
    let frontRightRestY = 0;
    modelRoot.add(bodyGroup, frontLeft, frontRight);

    const materials: Record<string, THREE.Material> = {
      body: new THREE.MeshStandardMaterial({ color: 0x8e5c2d, roughness: 0.58, metalness: 0.02 }),
      black: new THREE.MeshStandardMaterial({ color: 0x120f0b, roughness: 0.64, metalness: 0.02 }),
      red: new THREE.MeshStandardMaterial({ color: 0xa62917, emissive: 0x4f0903, emissiveIntensity: 0.6, roughness: 0.36 }),
      ocelli: new THREE.MeshStandardMaterial({ color: 0xe4aa39, emissive: 0x5b3305, emissiveIntensity: 0.5, roughness: 0.38 }),
      "bristle-brown": new THREE.MeshStandardMaterial({ color: 0x160f09, roughness: 0.82 }),
      lower: new THREE.MeshStandardMaterial({ color: 0xb38452, roughness: 0.7 }),
      brown: new THREE.MeshStandardMaterial({ color: 0x3c2113, roughness: 0.72 }),
      membrane: new THREE.MeshPhysicalMaterial({ color: 0xabc4cf, transparent: true, opacity: 0.34, roughness: 0.26, transmission: 0.18, side: THREE.DoubleSide, depthWrite: false }),
    };

    let disposed = false;
    void (async () => {
      try {
        const metadataResponse = await fetch("/data/flybody/model.json");
        if (!metadataResponse.ok) throw new Error("Flybody metadata unavailable");
        const metadata = await metadataResponse.json() as FlybodyModel;
        const binaryResponse = await fetch(`/data/flybody/${metadata.binary}`);
        if (!binaryResponse.ok) throw new Error("Flybody mesh unavailable");
        const buffer = await binaryResponse.arrayBuffer();
        if (disposed) return;

        const groups = { body: bodyGroup, front_left: frontLeft, front_right: frontRight };
        (Object.keys(groups) as FlybodyPart["group"][]).forEach((groupName) => {
          groups[groupName].position.fromArray(metadata.pivots[groupName]);
        });
        frontLeftRestY = metadata.pivots.front_left[1];
        frontRightRestY = metadata.pivots.front_right[1];

        for (const part of metadata.parts) {
          const geometry = new THREE.BufferGeometry();
          const positions = new Float32Array(buffer.slice(part.positionByteOffset, part.positionByteOffset + part.positionCount * 12));
          const indices = new Uint32Array(buffer.slice(part.indexByteOffset, part.indexByteOffset + part.indexCount * 4));
          geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
          geometry.setIndex(new THREE.BufferAttribute(indices, 1));
          geometry.computeVertexNormals();
          geometry.computeBoundingSphere();
          const mesh = new THREE.Mesh(geometry, materials[part.material] ?? materials.body);
          groups[part.group].add(mesh);
        }
        setLoadState("ready");
      } catch {
        if (!disposed) setLoadState("error");
      }
    })();

    const keyboard = new THREE.Group();
    keyboard.position.set(0, -0.48, 0.08);
    rig.add(keyboard);
    const baseMaterial = new THREE.MeshStandardMaterial({ color: 0x151310, roughness: 0.52, metalness: 0.2 });
    const keyMaterial = new THREE.MeshStandardMaterial({ color: 0x2b2721, roughness: 0.72, metalness: 0.04 });
    const activeKeyMaterial = new THREE.MeshStandardMaterial({ color: 0xf2b84b, emissive: 0x6d4306, emissiveIntensity: 0.6, roughness: 0.44 });
    const keyboardBase = new THREE.Mesh(new THREE.BoxGeometry(4.9, 0.16, 2.18), baseMaterial);
    keyboard.add(keyboardBase);

    let leftKey: THREE.Mesh | null = null;
    const labelTextures: THREE.Texture[] = [];
    for(let row=0;row<4;row++)for(let col=0;col<11;col++){
      if(row===3&&col>=3&&col<=7)continue;
      const cap=new THREE.Mesh(new THREE.BoxGeometry(.32,.1,.3),keyMaterial);
      cap.position.set((col-5)*.4,.13,(row-2)*.38);keyboard.add(cap);
    }
    const space=new THREE.Mesh(new THREE.BoxGeometry(1.3,.1,.34),activeKeyMaterial);
    space.position.set(-.002,.13,.365);keyboard.add(space);leftKey=space;
    const texture=keyLabel("SPACE");
    if(texture){labelTextures.push(texture);const label=new THREE.Mesh(new THREE.PlaneGeometry(.5,.16),new THREE.MeshBasicMaterial({map:texture,transparent:true}));label.rotation.x=-Math.PI/2;label.position.set(0,.056,0);space.add(label);}

    let pointerDown = false;
    let lastX = 0;
    let lastY = 0;
    const onDown = (event: PointerEvent) => {
      pointerDown = true;
      lastX = event.clientX;
      lastY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const onMove = (event: PointerEvent) => {
      if (!pointerDown) return;
      rig.rotation.y += (event.clientX - lastX) * 0.009;
      rig.rotation.x = THREE.MathUtils.clamp(rig.rotation.x + (event.clientY - lastY) * 0.006, -0.5, 0.5);
      lastX = event.clientX;
      lastY = event.clientY;
    };
    const onUp = () => { pointerDown = false; };
    renderer.domElement.addEventListener("pointerdown", onDown);
    renderer.domElement.addEventListener("pointermove", onMove);
    renderer.domElement.addEventListener("pointerup", onUp);
    renderer.domElement.addEventListener("pointercancel", onUp);

    const resize = () => {
      const { width, height } = element.getBoundingClientRect();
      renderer.setSize(Math.max(width, 1), Math.max(height, 1), false);
      camera.aspect = Math.max(width, 1) / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(element);
    resize();

    let frame = 0;
    const animate = () => {
      const leftPress = controls.current.left;
      const rightPress = controls.current.right;
      if (leftKey) leftKey.position.y = 0.13 - leftPress * 0.055;
      // Both anatomical forelegs press the same SPACE key.
      // Rotate around each shoulder so the distal toe follows the 55mm key travel.
      const toeY = -.1033, toeZ = .0615;
      const toeAngle = (press: number) => Math.asin((toeY - press * .055 / 5) / Math.hypot(toeY, toeZ)) - Math.atan2(toeY, toeZ);
      frontRight.rotation.x = -toeAngle(leftPress);
      frontLeft.rotation.x = -toeAngle(rightPress);
      frontLeft.position.y = frontLeftRestY;
      frontRight.position.y = frontRightRestY;
      renderer.domElement.dataset.leftPress = leftPress.toFixed(2);
      renderer.domElement.dataset.rightPress = rightPress.toFixed(2);
      renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onDown);
      renderer.domElement.removeEventListener("pointermove", onMove);
      renderer.domElement.removeEventListener("pointerup", onUp);
      renderer.domElement.removeEventListener("pointercancel", onUp);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) object.geometry.dispose();
      });
      Object.values(materials).forEach((material) => material.dispose());
      baseMaterial.dispose();
      keyMaterial.dispose();
      activeKeyMaterial.dispose();
      labelTextures.forEach((texture) => texture.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [controls]);

  return (
    <div ref={host} className="three-viewport fly-viewport" aria-label="Anatomically detailed flybody model pressing the SPACE key on a keyboard">
      <div className={`fly-load ${loadState}`} aria-live="polite">
        {loadState === "loading" && <><span lang="en">Loading flybody model</span><span lang="tr">Flybody modeli yükleniyor</span></>}
        {loadState === "ready" && <><span lang="en">Anatomical body loaded</span><span lang="tr">Anatomik beden yüklendi</span></>}
        {loadState === "error" && <><span lang="en">Body model unavailable</span><span lang="tr">Beden modeli yüklenemedi</span></>}
      </div>
      <div className="key-hud"><kbd>SPACE</kbd><span>Jump command · rule-based controller</span></div>
    </div>
  );
}
