import { useCallback, useEffect, useRef, useState } from "react";
import { Runner, type Telemetry } from "./components/Runner";
import { BrainScene } from "./components/BrainScene";
import { FlyScene } from "./components/FlyScene";
import { Attribution } from "./components/Attribution";
import { PolicyNetwork } from "./components/PolicyNetwork";
import { TrainingBench, type History } from "./components/TrainingBench";
import { validModel, type Model, type Decision } from "./lib/policy";
import { type Benchmark } from "./lib/benchmark";
import { Methods } from "./components/Methods";
const initial: Telemetry = {
  score: 0,
  best: 0,
  jumps: 0,
  speed: 360,
  round: 1,
  dead: false,
  press: false,
  duck: false,
  ducks: 0,
  fastFall: false,
};
const SAVE_KEY = "flydino-policy-v2";
export function App() {
  const [playing, setPlaying] = useState(true),
    [mode, setMode] = useState<"neural" | "rule" | "manual">("neural"),
    [reset, setReset] = useState(0),
    [telemetry, setTelemetry] = useState(initial);
  const [model, setModel] = useState<Model | null>(null),
    [decision, setDecision] = useState<Decision | null>(null);
  const [history, setHistory] = useState<History>([]),
    [busy, setBusy] = useState<"train" | "benchmark" | null>(null),
    [status, setStatus] = useState("Loading published model…"),
    [report, setReport] = useState<Benchmark | null>(null);
  const controls = useRef({ left: 0, right: 0 }),
    worker = useRef<Worker | null>(null);
  const save = (m: Model) => {
    setModel(m);
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(m));
    } catch {
      /* Export remains available if storage is full or disabled. */
    }
  };
  const published = useCallback(async () => {
    try {
      const response = await fetch("/benchmarks/model.json");
      if (!response.ok) throw new Error("Checkpoint unavailable");
      const m: unknown = await response.json();
      if (!validModel(m)) throw new Error("Invalid checkpoint");
      setModel(m);
      setMode("neural");
      setStatus(`Published checkpoint · generation ${m.generation}`);
      setHistory([]);
      setReport(null);
      setReset((x) => x + 1);
      try {
        localStorage.removeItem(SAVE_KEY);
      } catch {}
      const [b, t] = await Promise.all([
        fetch("/benchmarks/benchmark.json").then((r) => r.json()),
        fetch("/benchmarks/training.json").then((r) => r.json()),
      ]);
      if (
        b.model.version === m.version &&
        JSON.stringify(b.model.weights) === JSON.stringify(m.weights)
      ) {
        setReport(b);
        setHistory(t.history);
      }
    } catch (e) {
      setStatus(String(e));
    }
  }, []);
  useEffect(() => {
    let disposed = false;
    const load = async () => {
      try {
        const cached = localStorage.getItem(SAVE_KEY);
        if (cached) {
          const m: unknown = JSON.parse(cached);
          if (validModel(m)) {
            setModel(m);
            setStatus(`Restored local checkpoint · generation ${m.generation}`);
            return;
          }
        }
      } catch {}
      try {
        const response = await fetch("/benchmarks/model.json");
        if (!response.ok) throw new Error("Checkpoint unavailable");
        const m: unknown = await response.json();
        if (!validModel(m)) throw new Error("Invalid checkpoint");
        if (!disposed && !worker.current) {
          setModel(m);
          setStatus(`Published checkpoint · generation ${m.generation}`);
          const [b, t] = await Promise.all([
            fetch("/benchmarks/benchmark.json").then((r) => r.json()),
            fetch("/benchmarks/training.json").then((r) => r.json()),
          ]);
          if (
            !disposed &&
            !worker.current &&
            b.model.version === m.version &&
            JSON.stringify(b.model.weights) === JSON.stringify(m.weights)
          ) {
            setReport(b);
            setHistory(t.history);
          }
        }
      } catch (e) {
        if (!disposed) setStatus(String(e));
      }
    };
    void load();
    return () => {
      disposed = true;
      worker.current?.terminate();
    };
  }, []);
  const manual = useCallback(() => setMode("manual"), []);
  const stop = () => {
    worker.current?.terminate();
    worker.current = null;
    setBusy(null);
    setStatus("Stopped · current checkpoint retained");
  };
  const startWorker = (kind: "train" | "benchmark", seed?: number) => {
    worker.current?.terminate();
    setBusy(kind);
    setReport(null);
    if (kind === "train") {
      setHistory([]);
      setMode("neural");
      setPlaying(true);
      setReset((x) => x + 1);
      setStatus("Training from random weights · champion plays live");
    } else setStatus("Evaluating 100 held-out courses and control conditions…");
    const w = new Worker(new URL("./lib/training.worker.ts", import.meta.url), {
      type: "module",
    });
    worker.current = w;
    w.onerror = () => {
      setStatus("Worker failed. Current checkpoint retained.");
      setBusy(null);
      w.terminate();
    };
    w.onmessage = (e) => {
      const data = e.data;
      if (data.type === "initial") {
        setModel(data.model);
        setDecision(null);
      }
      if (data.type === "progress") {
        const { model: m, ...row } = data.progress;
        save(m);
        setHistory((h) => [...h, row]);
      }
      if (data.type === "complete") {
        setStatus("Training complete · checkpoint ready to export");
        setBusy(null);
        w.terminate();
      }
      if (data.type === "benchmark") {
        setReport(data.result);
        setStatus(
          "Benchmark complete · current checkpoint, 100 held-out courses",
        );
        setBusy(null);
        w.terminate();
      }
      if (data.type === "error") {
        setStatus(data.message);
        setBusy(null);
        w.terminate();
      }
    };
    w.postMessage(
      kind === "train" ? { type: "train", seed } : { type: "benchmark", model },
    );
  };
  const importModel = async (file: File) => {
    try {
      if (file.size > 100000) throw new Error("Model file too large");
      const m: unknown = JSON.parse(await file.text());
      if (!validModel(m))
        throw new Error(
          "Expected a Fly Dino v2 connectome readout with 243 finite weights",
        );
      save(m);
      setMode("neural");
      setHistory([]);
      setReport(null);
      setReset((x) => x + 1);
      setStatus(`Imported checkpoint · generation ${m.generation}`);
    } catch (e) {
      setStatus(String(e));
    }
  };
  return (
    <>
      <a className="skip-link" href="#experiment">
        Skip to experiment
      </a>
      <header className="masthead">
        <div className="header-inner">
          <a className="brand" href="#top">
            <span>◈</span> Fly Dino
          </a>
          <nav aria-label="Main navigation">
            <a href="#experiment">Experiment</a>
            <a href="#training">Training</a>
            <a href="#results">Results</a>
            <a href="#science">Method</a>
            <a
              href="https://github.com/cobanov/flyjump"
              aria-label="Source on GitHub"
              className="nav-icon"
            >
              <svg
                viewBox="0 0 24 24"
                width="21"
                height="21"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 .8a11.2 11.2 0 0 0-3.54 21.83c.56.1.77-.24.77-.54v-2.1c-3.12.68-3.78-1.33-3.78-1.33-.51-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.69.08-.69 1.13.08 1.72 1.16 1.72 1.16 1 1.72 2.62 1.22 3.26.93.1-.73.4-1.22.71-1.5-2.49-.28-5.1-1.24-5.1-5.54 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.42.11-2.96 0 0 .94-.3 3.08 1.15a10.7 10.7 0 0 1 5.6 0c2.14-1.45 3.07-1.15 3.07-1.15.61 1.54.23 2.68.12 2.96.71.78 1.15 1.78 1.15 3 0 4.31-2.62 5.25-5.12 5.53.4.35.76 1.03.76 2.08v3.11c0 .3.2.65.77.54A11.2 11.2 0 0 0 12 .8Z" />
              </svg>
            </a>
          </nav>
        </div>
      </header>
      <main id="top">
        <section className="hero">
          <div>
            <p className="eyebrow">CHROMIUM DINO × MALECNS</p>
            <h1>A fly circuit playing Dino.</h1>
            <p>
              An 80-neuron model uses measured fly connections to choose when to
              run, jump or duck. Watch its decisions live, or train a new
              controller below.
            </p>
          </div>
          <div className="experiment-spec">
            <span>80 modeled neurons</span>
            <span>1,296 measured connections</span>
            <span>243 trainable parameters</span>
            <a href="#science">How it works ↓</a>
          </div>
        </section>
        <section id="experiment" aria-label="Live experiment">
          <div className="toolbar">
            <div className="runtime">
              <i className={playing ? "on" : ""} />
              {playing ? "Running" : "Paused"}
              <span>
                {mode === "neural"
                  ? model
                    ? `Trained agent · generation ${model.generation}`
                    : "Loading checkpoint…"
                  : mode === "rule"
                    ? "Rule baseline"
                    : "Manual control"}
              </span>
            </div>
            <div className="controls">
              <label className="controller-select">
                Controller{" "}
                <select
                  aria-label="Controller"
                  value={mode}
                  onChange={(e) => {
                    setMode(e.target.value as typeof mode);
                    setReset((x) => x + 1);
                    setDecision(null);
                  }}
                >
                  <option value="neural">Trained agent</option>
                  <option value="rule">Rule baseline</option>
                  <option value="manual">Manual</option>
                </select>
              </label>
              <button onClick={() => setReset((x) => x + 1)}>Restart</button>
              <button onClick={() => setPlaying(!playing)}>
                {playing ? "Pause" : "Play"}
              </button>
            </div>
          </div>
          <div className="workbench">
            <section className="panel environment-panel">
              <h2>
                <span>01 / GAME</span>
                <small>Chromium Dino · 60 Hz</small>
              </h2>
              <Runner
                playing={playing && (mode !== "neural" || !!model)}
                auto={mode === "rule"}
                model={mode === "neural" ? model : null}
                reset={reset}
                controls={controls}
                onTelemetry={setTelemetry}
                onDecision={setDecision}
                onManual={manual}
              />
              <div className="panel-bottom">
                <span>
                  <kbd>SPACE</kbd> / <kbd>↑</kbd> jump · <kbd>↓</kbd> duck
                </span>
                <span>
                  {telemetry.dead
                    ? mode === "manual"
                      ? "Restart to try again"
                      : "Next run in a moment"
                    : telemetry.fastFall
                      ? "Fast fall"
                      : telemetry.duck
                        ? "Ducking"
                        : "Release jump for a shorter hop"}
                </span>
              </div>
            </section>
            <section className="panel network-panel">
              <h2>
                <span>02 / DECISION NETWORK</span>
                <small>Trained action readout</small>
              </h2>
              <PolicyNetwork
                decision={decision}
                model={model}
                active={mode === "neural" && !!decision}
              />
              <div className="panel-bottom">
                <span title="These are raw network scores, not probabilities.">
                  Largest score chooses the action
                </span>
                <span>Green + / orange −</span>
              </div>
            </section>
            <section className="panel fly-panel">
              <h2>
                <span>03 / KEYBOARD OUTPUT</span>
                <small>Flybody anatomical rig</small>
              </h2>
              <FlyScene controls={controls} />
              <div className="panel-bottom">
                <span>
                  {telemetry.press
                    ? "SPACE · JUMP"
                    : telemetry.duck || telemetry.fastFall
                      ? "↓ · DUCK / DROP"
                      : "NO KEY · RUN"}
                </span>
                <span>Drag to rotate</span>
              </div>
            </section>
            <section className="panel brain-panel">
              <h2>
                <span>04 / BRAIN ACTIVITY</span>
                <small>MaleCNS v1.0 subset</small>
              </h2>
              <BrainScene
                activity={decision?.activity}
                active={mode === "neural" && !!decision}
              />
              <div className="panel-bottom">
                <span>Simulated activity · unitless</span>
                <a href="/data/connectome/graph.json">
                  Inspect all 80 cells ↗
                </a>
              </div>
            </section>
          </div>
          <div className="metrics">
            <div>
              <span>SCORE</span>
              <strong>{String(telemetry.score).padStart(5, "0")}</strong>
            </div>
            <div>
              <span>SESSION BEST</span>
              <strong>{String(telemetry.best).padStart(5, "0")}</strong>
            </div>
            <div>
              <span>JUMPS</span>
              <strong>{telemetry.jumps}</strong>
            </div>
            <div>
              <span>DUCKS</span>
              <strong>{telemetry.ducks}</strong>
            </div>
            <div>
              <span>SPEED</span>
              <strong>
                {Math.round(telemetry.speed)}
                <small> px/s</small>
              </strong>
            </div>
            <div>
              <span>RUN</span>
              <strong>{String(telemetry.round).padStart(3, "0")}</strong>
            </div>
          </div>
          <p className="bench-note">
            Use Space / ↑ to jump and ↓ to duck or fall faster. Keyboard or
            touch input takes over from the agent. Ordinary play uses a trained
            model; learning starts only when you choose Train from scratch.
          </p>
        </section>
        <div id="training">
          <TrainingBench
            model={model}
            history={history}
            busy={busy}
            status={status}
            benchmark={report}
            onTrain={(seed) => startWorker("train", seed)}
            onStop={stop}
            onBenchmark={() => startWorker("benchmark")}
            onImport={importModel}
            onRestore={() => void published()}
          />
        </div>
        <Methods />
      </main>
      <Attribution />
    </>
  );
}
