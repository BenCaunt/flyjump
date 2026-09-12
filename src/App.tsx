import {useRef,useState} from 'react';
import {Runner,type Telemetry} from './components/Runner';
import {BrainScene} from './components/BrainScene';
import {FlyScene} from './components/FlyScene';
import {Attribution} from './components/Attribution';
import {emptyStimulus} from './lib/visual-stimulus';
const initial:Telemetry={score:0,best:0,jumps:0,speed:280,round:1,dead:false,press:false};
export function App(){
 const [playing,setPlaying]=useState(true),[auto,setAuto]=useState(true),[reset,setReset]=useState(0),[telemetry,setTelemetry]=useState(initial),[stimulus,setStimulus]=useState(emptyStimulus);
 const controls=useRef({left:0,right:0});
 return <>
 <header><a className="brand" href="#top">FLY JUMP</a><span>VISION › JUMP › REPEAT</span><nav><a href="https://github.com/cobanov/fly-connectome-template">Template ↗</a><a href="https://github.com/cobanov/flyjump">Source ↗</a></nav></header>
 <main id="top">
 <div className="toolbar"><div className="runtime"><i className={playing?'on':''}/>{playing?'Running':'Paused'}<span>Rule-based controller · no trained model</span></div><div className="controls"><button aria-pressed={auto} onClick={()=>setAuto(!auto)}>Auto {auto?'on':'off'}</button><button onClick={()=>setReset(x=>x+1)}>Restart</button><button onClick={()=>setPlaying(!playing)}>{playing?'Pause':'Play'}</button></div></div>
 <div className="workbench">
 <section className="panel environment-panel"><h2>DINO / ENDLESS RUNNER<span>{auto?'FLY CONTROL':'MANUAL CONTROL'}</span></h2><Runner playing={playing} auto={auto} reset={reset} controls={controls} onTelemetry={setTelemetry} onStimulus={setStimulus}/><div className="panel-bottom"><span><kbd>SPACE</kbd> <kbd>↑</kbd> or tap to jump</span><span>{telemetry.dead?'Next run in a moment':'Dodge the cacti'}</span></div></section>
 <section className="panel brain-panel"><h2>BRAIN / SOMA ATLAS<span>MaleCNS v1.0</span></h2><BrainScene stimulus={stimulus}/><div className="panel-bottom"><span>124,289 measured somata</span><a href="#science">Data &amp; credit ↗</a></div></section>
 <section className="panel fly-panel"><h2>FLY / KEYBOARD INPUT<span>Flybody</span></h2><FlyScene controls={controls}/><div className="panel-bottom"><span>SPACE · {telemetry.press?'PRESSED':'READY'}</span><span>Drag to rotate</span></div></section>
 </div>
 <div className="metrics"><div><span>DISTANCE</span><strong>{String(telemetry.score).padStart(5,'0')}</strong></div><div><span>BEST · SESSION</span><strong>{String(telemetry.best).padStart(5,'0')}</strong></div><div><span>JUMPS</span><strong>{telemetry.jumps}</strong></div><div><span>SPEED</span><strong>{Math.round(telemetry.speed)}<small> px/s</small></strong></div><div><span>RUN</span><strong>{String(telemetry.round).padStart(3,'0')}</strong></div></div>
 <p className="bench-note">Real anatomy. Brain colors illustrate game-image input, not neural firing. The fly presses SPACE using obstacle-distance rules; it has not learned to play.</p>
 <section id="science" className="notes"><h2>ABOUT THE EXPERIMENT</h2><p>A Dino-style endless runner, written for this project with original canvas shapes. It starts automatically. Turn Auto off to play with Space, the up arrow or a tap. A collision starts a fresh run after 1.4 seconds; Pause holds the game.</p><p>The brain shows curated MaleCNS v1.0 cell-body coordinates with their original proportions. There are no generated positions. The cyan/white overlay is a labeled preview of image brightness and frame changes (20× display gain for the small moving shapes), not a simulation of the synaptic graph. <a href="/data/brain-atlas/manifest.json">Source, filters and hashes</a> · <a href="/data/brain-atlas/NOTICE.md">Data notice</a>.</p><p>Data: FlyEM / HHMI Janelia, University of Cambridge, MRC Laboratory of Molecular Biology and Google Research, <a href="https://male-cns.janelia.org/download/">MaleCNS · CC BY 4.0</a>. Body: <a href="https://github.com/TuragaLab/flybody">Flybody · Apache 2.0</a>. Independent project, not affiliated with Google Chrome.</p></section>
 </main><Attribution/>
 </>;
}
