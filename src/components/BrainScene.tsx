import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { emptyStimulus, type Stimulus } from "../lib/visual-stimulus";

type Atlas = { count: number; brainCount: number; files: { positions: string; groups: string }; groups: Array<{ id: number; color: string }> };

/** Measured soma geometry; the separately labeled image overlay is not neural activity. */
export function BrainScene({ stimulus = emptyStimulus }: { stimulus?: Stimulus }) {
  const signal = useRef(stimulus);
  const orbit = useRef(true);
  const resetView = useRef<(() => void) | null>(null);
  const [orbiting, setOrbiting] = useState(true);
  const repaint = useRef<(() => void) | null>(null);
  useEffect(() => { signal.current = stimulus; repaint.current?.(); }, [stimulus]);
  const host = useRef<HTMLDivElement>(null);

  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let disposed = false;
    const controller = new AbortController();
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-3, 3, 2, -2, .01, 100);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    element.appendChild(renderer.domElement);
    const anatomy = new THREE.Group();
    scene.add(anatomy);
    resetView.current = () => { anatomy.rotation.set(0, 0, 0); fit(); };
    let geometry: THREE.BufferGeometry | undefined;
    let material: THREE.ShaderMaterial | undefined;
    let size = new THREE.Vector3(5, 2, 1);
    let sampleAt = performance.now();

    const fit = () => {
      const { width, height } = element.getBoundingClientRect();
      renderer.setSize(Math.max(1, width), Math.max(1, height), false);
      const aspect = Math.max(1, width) / Math.max(1, height);
      const yawRadius = Math.hypot(size.x, size.z) / 2;
      const tiltedHeight = Math.abs(Math.cos(anatomy.rotation.x)) * size.y / 2 + Math.abs(Math.sin(anatomy.rotation.x)) * yawRadius;
      const halfHeight = Math.max(tiltedHeight, yawRadius / aspect) * 1.08;
      camera.top = halfHeight; camera.bottom = -halfHeight;
      camera.left = -halfHeight * aspect; camera.right = halfHeight * aspect;
      camera.position.set(0, 0, 10);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };
    const load = async () => {
      const base = "/data/brain-atlas/";
      const fetchFile = async (path: string) => {
        const response = await fetch(base + path, { signal: controller.signal });
        if (!response.ok) throw new Error("Atlas unavailable");
        return response;
      };
      const atlas = await (await fetchFile("manifest.json")).json() as Atlas;
      const [positionsResponse, groupsResponse] = await Promise.all([fetchFile(atlas.files.positions), fetchFile(atlas.files.groups)]);
      const positions = new Float32Array(await positionsResponse.arrayBuffer());
      const groups = new Uint8Array(await groupsResponse.arrayBuffer());
      if (disposed) return;
      if (positions.length !== atlas.count * 3 || groups.length !== atlas.count) throw new Error("Atlas size mismatch");
      const xyz: number[] = [], rgb: number[] = [], optic: number[] = [];
      const palette = atlas.groups.map(group => new THREE.Color(group.color));
      const bounds = new THREE.Box3();
      for (let i = 0; i < atlas.count; i++) {
        if (groups[i] >= 3) continue;
        const x = positions[i * 3], y = positions[i * 3 + 1], z = positions[i * 3 + 2];
        // Native XY projection at reset. A rigid 180-degree X rotation, never axis-wise stretching.
        const point = new THREE.Vector3(x, -y, -z);
        xyz.push(point.x, point.y, point.z);
        optic.push(groups[i] === 0 ? x : NaN);
        bounds.expandByPoint(point);
        const color = palette[groups[i]];
        rgb.push(color.r, color.g, color.b);
      }
      const center = bounds.getCenter(new THREE.Vector3());
      size = bounds.getSize(new THREE.Vector3());
      const scale = 5 / Math.max(size.x, size.y, size.z);
      for (let i = 0; i < xyz.length; i += 3) {
        xyz[i] = (xyz[i] - center.x) * scale;
        xyz[i + 1] = (xyz[i + 1] - center.y) * scale;
        xyz[i + 2] = (xyz[i + 2] - center.z) * scale;
      }
      size.multiplyScalar(scale);
      geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(xyz, 3));
      geometry.setAttribute("color", new THREE.Float32BufferAttribute(rgb, 3));
      const activity = new Float32Array(optic.length);
      const flash = new Float32Array(optic.length);
      const bins = new Float32Array(optic.length * 2);
      for (let i = 0; i < optic.length; i++) {
        const x = xyz[i * 3] / size.x + .5, y = .5 - xyz[i * 3 + 1] / size.y;
        bins[i * 2] = Math.max(0, Math.min(7, x * 7)); bins[i * 2 + 1] = Math.max(0, Math.min(3, y * 3));
      }
      geometry.setAttribute("flash", new THREE.BufferAttribute(flash, 1));
      geometry.setAttribute("activity", new THREE.BufferAttribute(activity, 1));
      material = new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, vertexColors: true,
        uniforms: { pixelRatio: { value: Math.min(window.devicePixelRatio, 2) }, age: { value: 0 } },
        vertexShader: `attribute float activity; attribute float flash; uniform float age;
          varying float strength; uniform float pixelRatio;
          void main() { strength = clamp(activity + flash * exp(-age / 0.14), 0.0, 1.0);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = (0.85 + strength * .65) * pixelRatio; }`,
        fragmentShader: `varying float strength;
          void main() { float r = length(gl_PointCoord - vec2(0.5)); if (r > 0.5) discard;
          vec3 c = mix(vec3(0.10, 0.30, 0.62), vec3(0.12, 0.95, 1.0), smoothstep(0.015, 0.28, strength));
          c = mix(c, vec3(1.0), smoothstep(0.45, 0.95, strength));
          gl_FragColor = vec4(c, (0.20 + strength * 0.50) * (1.0 - smoothstep(0.18,0.5,r))); }`,
      });
      const paint = () => {
        if (disposed || !geometry) return;
        for (let i = 0; i < optic.length; i++) {
          const x = bins[i * 2], y = bins[i * 2 + 1], x0 = Math.floor(x), y0 = Math.floor(y);
          let light = 0, change = 0;
          for (let dy = 0; dy <= 1; dy++) for (let dx = 0; dx <= 1; dx++) {
            const b = signal.current.bins?.[Math.min(3,y0+dy)*8 + Math.min(7,x0+dx)];
            const weight = (dx ? x-x0 : 1-x+x0) * (dy ? y-y0 : 1-y+y0);
            light += (b?.light ?? 0) * weight; change += (b?.change ?? 0) * weight;
          }
          const eligible = Number.isFinite(optic[i]) && signal.current.ready;
          // Spatial tiling is illustrative only; these are not anatomical receptive fields.
          activity[i] = eligible ? light * .045 : 0;
          flash[i] = eligible ? Math.pow(Math.min(1, change * 3), 1.4) : 0;
        }
        sampleAt = performance.now();
        geometry.getAttribute("activity").needsUpdate = true;
        geometry.getAttribute("flash").needsUpdate = true;
        renderer.render(scene, camera);
      };
      repaint.current = paint;
      anatomy.add(new THREE.Points(geometry, material));
      fit();
      paint();
      setState("ready");
    };
    void load().catch(() => { if (!disposed) setState("error"); });
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    fit();
    let held = false, lastX = 0, lastY = 0;
    const down = (event: PointerEvent) => { held = true; lastX = event.clientX; lastY = event.clientY; renderer.domElement.setPointerCapture(event.pointerId); };
    const move = (event: PointerEvent) => {
      if (!held) return;
      anatomy.rotation.y += (event.clientX - lastX) * .006;
      anatomy.rotation.x += (event.clientY - lastY) * .006;
      lastX = event.clientX; lastY = event.clientY;
      fit();
    };
    const up = () => { held = false; };
    renderer.domElement.addEventListener("pointerdown", down);
    renderer.domElement.addEventListener("pointermove", move);
    renderer.domElement.addEventListener("pointerup", up);
    renderer.domElement.addEventListener("pointercancel", up);
    let frame = 0, previous = performance.now();
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const animate = (now: number) => {
      const dt = Math.min(.05,(now - previous) / 1000); previous = now;
      if (orbit.current && !held && !reducedMotion.matches && !document.hidden) anatomy.rotation.y += dt * .12;
      if (material) material.uniforms.age.value = (now - sampleAt) / 1000;
      if (!document.hidden) renderer.render(scene, camera);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => {
      disposed = true; resetView.current = null; cancelAnimationFrame(frame); repaint.current = null; controller.abort(); observer.disconnect();
      renderer.domElement.removeEventListener("pointerdown", down); renderer.domElement.removeEventListener("pointermove", move);
      renderer.domElement.removeEventListener("pointerup", up); renderer.domElement.removeEventListener("pointercancel", up);
      geometry?.dispose(); material?.dispose(); renderer.dispose(); renderer.domElement.remove();
    };
  }, []);

  return <>
    <div className="brain-view-controls">
      <button title="Reset to native XY projection with equal axis scale" onClick={() => { orbit.current = false; setOrbiting(false); resetView.current?.(); }}>XY view</button>
      <button aria-pressed={orbiting} onClick={() => { orbit.current = !orbit.current; setOrbiting(orbit.current); }}>Orbit {orbiting ? "on" : "off"}</button>
    </div>
    <div className="brain-legend"><span><i />Anatomy</span><span><i />Visual input</span><span><i />Frame change</span></div>
    <div className="stimulus-badge"><i />GAME-DRIVEN OVERLAY<span>Illustrative · not neural activity</span></div>
    <div ref={host} className="three-viewport brain-viewport" aria-label="MaleCNS brain soma atlas">
      {state !== "ready" && <span className={`neural-load ${state}`} role="status">{state === "error" ? <><i lang="en">Atlas unavailable</i><i lang="tr">Atlas yüklenemedi</i></> : <><i lang="en">Loading soma atlas</i><i lang="tr">Hücre atlası yükleniyor</i></>}</span>}
    </div>
  </>;
}
