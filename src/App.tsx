import {useCallback,useEffect,useRef,useState} from 'react';
import {Runner,type Telemetry} from './components/Runner';
import {BrainScene} from './components/BrainScene';
import {FlyScene} from './components/FlyScene';
import {Attribution} from './components/Attribution';
import {PolicyNetwork} from './components/PolicyNetwork';
import {TrainingBench,type History} from './components/TrainingBench';
import {validModel,type Model,type Decision} from './lib/policy';
import {type Benchmark} from './lib/benchmark';
import {emptyStimulus} from './lib/visual-stimulus';
const initial:Telemetry={score:0,best:0,jumps:0,speed:280,round:1,dead:false,press:false,duck:false,ducks:0,fastFall:false};
const SAVE_KEY='flyjump-policy-v1';
export function App(){
 const [playing,setPlaying]=useState(true),[mode,setMode]=useState<'neural'|'rule'|'manual'>('neural'),[reset,setReset]=useState(0),[telemetry,setTelemetry]=useState(initial),[stimulus,setStimulus]=useState(emptyStimulus);
 const [model,setModel]=useState<Model|null>(null),[decision,setDecision]=useState<Decision|null>(null),[view,setView]=useState<'policy'|'anatomy'>('policy');
 const [history,setHistory]=useState<History>([]),[busy,setBusy]=useState<'train'|'benchmark'|null>(null),[status,setStatus]=useState('Loading published model…'),[report,setReport]=useState<Benchmark|null>(null);
 const controls=useRef({left:0,right:0}),worker=useRef<Worker|null>(null);
 const save=(m:Model)=>{setModel(m);try{localStorage.setItem(SAVE_KEY,JSON.stringify(m));}catch{/* Export remains available if storage is full or disabled. */}};
 const published=useCallback(async()=>{
  try{const response=await fetch('/benchmarks/model.json');if(!response.ok)throw new Error('Checkpoint unavailable');const m:unknown=await response.json();if(!validModel(m))throw new Error('Invalid checkpoint');setModel(m);setMode('neural');setStatus(`Published checkpoint · generation ${m.generation}`);setHistory([]);setReset(x=>x+1);try{localStorage.removeItem(SAVE_KEY);}catch{}setReport(null);}catch(e){setStatus(String(e));}
 },[]);
 useEffect(()=>{
  let disposed=false;
  const load=async()=>{
   try{const cached=localStorage.getItem(SAVE_KEY);if(cached){const m:unknown=JSON.parse(cached);if(validModel(m)){setModel(m);setStatus(`Restored local checkpoint · generation ${m.generation}`);return;}}}catch{}
   try{const response=await fetch('/benchmarks/model.json');if(!response.ok)throw new Error('Checkpoint unavailable');const m:unknown=await response.json();if(!validModel(m))throw new Error('Invalid checkpoint');if(!disposed&&!worker.current){setModel(m);setStatus(`Published checkpoint · generation ${m.generation}`);}}catch(e){if(!disposed)setStatus(String(e));}
  };void load();return()=>{disposed=true;worker.current?.terminate();};
 },[]);
 const manual=useCallback(()=>setMode('manual'),[]);
 const stop=()=>{worker.current?.terminate();worker.current=null;setBusy(null);setStatus('Stopped · current checkpoint retained');};
 const startWorker=(kind:'train'|'benchmark',seed?:number)=>{
  worker.current?.terminate();setBusy(kind);setReport(null);
  if(kind==='train'){setHistory([]);setMode('neural');setPlaying(true);setReset(x=>x+1);setStatus('Training from random weights · champion plays live');}else setStatus('Evaluating 100 held-out courses and three baselines…');
  const w=new Worker(new URL('./lib/training.worker.ts',import.meta.url),{type:'module'});worker.current=w;
  w.onerror=()=>{setStatus('Worker failed. Current checkpoint retained.');setBusy(null);w.terminate();};
  w.onmessage=e=>{
   const data=e.data;
   if(data.type==='initial'){setModel(data.model);setDecision(null);}
   if(data.type==='progress'){const {model:m,...row}=data.progress;save(m);setHistory(h=>[...h,row]);}
   if(data.type==='complete'){setStatus('Training complete · checkpoint ready to export');setBusy(null);w.terminate();}
   if(data.type==='benchmark'){setReport(data.result);setStatus('Benchmark complete · current checkpoint, 100 held-out courses');setBusy(null);w.terminate();}
   if(data.type==='error'){setStatus(data.message);setBusy(null);w.terminate();}
  };
  w.postMessage(kind==='train'?{type:'train',seed}:{type:'benchmark',model});
 };
 const importModel=async(file:File)=>{try{if(file.size>100000)throw new Error('Model file too large');const m:unknown=JSON.parse(await file.text());if(!validModel(m))throw new Error('Expected a Fly Jump v1 model with 147 finite weights');save(m);setMode('neural');setHistory([]);setReport(null);setReset(x=>x+1);setStatus(`Imported checkpoint · generation ${m.generation}`);}catch(e){setStatus(String(e));}};
 return <>
 <header><a className="brand" href="#top">FLY JUMP</a><span>OBSERVE › DECIDE › LEARN</span><nav><a href="https://github.com/cobanov/fly-connectome-template">Template ↗</a><a href="https://github.com/cobanov/flyjump">Source ↗</a></nav></header>
 <main id="top">
 <div className="toolbar"><div className="runtime"><i className={playing?'on':''}/>{playing?'Running':'Paused'}<span>{mode==='neural'?(model?`Neural policy · generation ${model.generation}`:'Loading neural policy'):mode==='rule'?'Rule-based baseline':'Manual control'}</span></div><div className="controls"><label className="controller-select">Controller <select aria-label="Controller" value={mode} onChange={e=>{setMode(e.target.value as typeof mode);setReset(x=>x+1);setDecision(null);}}><option value="neural">Neural network</option><option value="rule">Rule baseline</option><option value="manual">Manual</option></select></label><button onClick={()=>setReset(x=>x+1)}>Restart</button><button onClick={()=>setPlaying(!playing)}>{playing?'Pause':'Play'}</button></div></div>
 <div className="workbench">
 <section className="panel environment-panel"><h2>DINO / ENDLESS RUNNER<span>{mode.toUpperCase()} CONTROL</span></h2><Runner playing={playing&&(mode!=='neural'||!!model)} auto={mode==='rule'} model={mode==='neural'?model:null} reset={reset} controls={controls} onTelemetry={setTelemetry} onStimulus={setStimulus} onDecision={setDecision} onManual={manual}/><div className="panel-bottom"><span><kbd>SPACE</kbd> / <kbd>↑</kbd> jump · <kbd>↓</kbd> / <kbd>S</kbd> duck</span><span>{telemetry.dead?'Next run in a moment':telemetry.fastFall?'Fast fall':telemetry.duck?'Ducking':'Dodge cacti & birds'}</span></div></section>
 <section className="panel brain-panel"><h2>{view==='policy'?'POLICY / LIVE NEURAL NETWORK':'BRAIN / SOMA ATLAS'}<span>{view==='policy'?'8 → 12 → 3':'MaleCNS v1.0'}</span></h2><div className="brain-tabs"><button aria-pressed={view==='policy'} onClick={()=>setView('policy')}>Decision network</button><button aria-pressed={view==='anatomy'} onClick={()=>setView('anatomy')}>Anatomy atlas</button></div>{view==='policy'?<PolicyNetwork decision={decision} model={model} active={mode==='neural'&&!!decision}/>:<BrainScene stimulus={stimulus}/>}<div className="panel-bottom"><span>{view==='policy'?'Learned artificial policy · not the connectome':'124,289 measured somata · illustrative overlay'}</span><a href="#science">Method ↗</a></div></section>
 <section className="panel fly-panel"><h2>FLY / KEYBOARD INPUT<span>Flybody</span></h2><FlyScene controls={controls}/><div className="panel-bottom"><span>{telemetry.press?'SPACE · JUMP':telemetry.duck||telemetry.fastFall?'↓ · DUCK / DROP':'SPACE / ↓ · READY'}</span><span>Drag to rotate</span></div></section>
 </div>
 <div className="metrics"><div><span>DISTANCE</span><strong>{String(telemetry.score).padStart(5,'0')}</strong></div><div><span>BEST · SESSION</span><strong>{String(telemetry.best).padStart(5,'0')}</strong></div><div><span>JUMPS</span><strong>{telemetry.jumps}</strong></div><div><span>DUCKS</span><strong>{telemetry.ducks}</strong></div><div><span>SPEED</span><strong>{Math.round(telemetry.speed)}<small> px/s</small></strong></div><div><span>RUN</span><strong>{String(telemetry.round).padStart(3,'0')}</strong></div></div>
 <p className="bench-note">The neural network chooses the action. The anatomical fly visualizes it on the keyboard. Manual input takes over. Ordinary play runs inference; Train from scratch updates weights in a separate worker.</p>
 <TrainingBench model={model} history={history} busy={busy} status={status} benchmark={report} onTrain={seed=>startWorker('train',seed)} onStop={stop} onBenchmark={()=>startWorker('benchmark')} onImport={importModel} onRestore={()=>void published()}/>
 <section id="science" className="notes"><h2>ABOUT THE EXPERIMENT</h2><p>A Dino-style endless runner with original canvas shapes. Space, Up or Jump to jump; release early for a shorter jump. Hold Down, S or Duck to crouch or fall faster in midair. Low birds must be jumped, middle birds can be ducked, and high birds pass overhead. A collision starts a fresh run after 1.4 seconds.</p><p>The policy is a fully connected 8–12–3 network trained with the cross-entropy method (CEM), a form of neuroevolution. It reads structured game state, not pixels, and picks the highest action score every 4 physics steps. Training optimizes game score using 64 candidates and 8 elites. No obstacle-distance rule supplies its actions or training targets. <a href="https://arxiv.org/abs/1712.06567">Background: deep neuroevolution</a>.</p><p>The anatomy tab shows curated MaleCNS v1.0 cell-body coordinates with native proportions. The cyan/white overlay previews image brightness and frame changes with 20× display gain. It is not neural firing or a simulation of the synaptic graph. This experiment trains an artificial controller, not a biological fly connectome. <a href="/data/brain-atlas/manifest.json">Source, filters and hashes</a> · <a href="/data/brain-atlas/NOTICE.md">Data notice</a>.</p><p>Data: FlyEM / HHMI Janelia, University of Cambridge, MRC Laboratory of Molecular Biology and Google Research, <a href="https://male-cns.janelia.org/download/">MaleCNS · CC BY 4.0</a>. Body: <a href="https://github.com/TuragaLab/flybody">Flybody · Apache 2.0</a>. Independent project, not affiliated with Google Chrome.</p></section>
 </main><Attribution/>
 </>;
}
