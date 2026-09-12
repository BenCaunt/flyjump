import {useEffect,useRef,type RefObject} from 'react';
import {createRunner,tickRunner,RUNNER} from '../lib/runner';
import {forward,observation,actionInput,NETWORK,type Model,type Decision} from '../lib/policy';
import {measureFrame,type Stimulus} from '../lib/visual-stimulus';
export type Telemetry={score:number;best:number;jumps:number;speed:number;round:number;dead:boolean;press:boolean;duck:boolean;ducks:number;fastFall:boolean};
export function Runner({playing,auto,model,reset,controls,onTelemetry,onStimulus,onDecision,onManual}:{playing:boolean;auto:boolean;model:Model|null;reset:number;onDecision:(d:Decision|null)=>void;onManual:()=>void;controls:RefObject<{left:number;right:number}>;onTelemetry:(t:Telemetry)=>void;onStimulus:(s:Stimulus)=>void}){
 const input=useRef({jump:false,jumpHeld:false,releaseJump:false,keyboardDuck:false,pointerDuck:false}),canvas=useRef<HTMLCanvasElement>(null),options=useRef({playing,auto,model});options.current={playing,auto,model};const best=useRef(0),round=useRef(0);
 useEffect(()=>{
 const el=canvas.current!,ctx=el.getContext('2d')!,sample=document.createElement('canvas');sample.width=64;sample.height=36;const sampleCtx=sample.getContext('2d',{willReadFrequently:true})!;
 let previousPixels:Float32Array|undefined,state=createRunner(++round.current),frame=0,previous=performance.now(),acc=0,ended=0,lastReport=0,steps=0;let decision:Decision|null=null;
 const resize=()=>{const b=el.getBoundingClientRect();el.width=Math.max(1,Math.round(b.width*Math.min(devicePixelRatio,2)));el.height=Math.max(1,Math.round(b.height*Math.min(devicePixelRatio,2)));};
 const observer=new ResizeObserver(resize);observer.observe(el);resize();
 const clearInput=()=>{input.current={jump:false,jumpHeld:false,releaseJump:false,keyboardDuck:false,pointerDuck:false};};
 clearInput();
 const requestJump=()=>{if(options.current.playing){onManual();input.current.jump=true;input.current.jumpHeld=true;}};
 const releaseJump=()=>{if(input.current.jumpHeld)input.current.releaseJump=true;input.current.jumpHeld=false;};
 const key=(e:KeyboardEvent)=>{
  if(e.target instanceof HTMLElement&&e.target.closest('button,input,textarea,select,a,[contenteditable="true"]'))return;
  if(['Space','ArrowUp','ArrowDown','KeyS'].includes(e.code)){
   e.preventDefault();if(!options.current.playing)return;
   if(e.code==='ArrowDown'||e.code==='KeyS'){onManual();input.current.keyboardDuck=true;}
   else if(!e.repeat)requestJump();
  }
 };
 const keyUp=(e:KeyboardEvent)=>{
  if(e.code==='ArrowDown'||e.code==='KeyS')input.current.keyboardDuck=false;
  if(e.code==='Space'||e.code==='ArrowUp')releaseJump();
 };
 const visibility=()=>{if(document.hidden)clearInput();};
 window.addEventListener('keydown',key);window.addEventListener('keyup',keyUp);window.addEventListener('blur',clearInput);document.addEventListener('visibilitychange',visibility);
 const tap=(e:PointerEvent)=>{if(e.button!==0)return;el.focus({preventScroll:true});el.setPointerCapture(e.pointerId);requestJump();};
 el.addEventListener('pointerdown',tap);el.addEventListener('pointerup',releaseJump);el.addEventListener('pointercancel',releaseJump);
 const draw=()=>{
 const scale=Math.min(el.width/RUNNER.width,el.height/RUNNER.height),ox=(el.width-RUNNER.width*scale)/2,oy=(el.height-RUNNER.height*scale)/2;
 ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#eef0ed';ctx.fillRect(0,0,el.width,el.height);ctx.setTransform(scale,0,0,scale,ox,oy);ctx.imageSmoothingEnabled=false;
 ctx.fillStyle='#c9cfca';for(let i=0;i<4;i++){const x=((i*277-state.distance*.16)%1100+1100)%1100-80;ctx.fillRect(x,92+i%2*26,48,4);ctx.fillRect(x+11,84+i%2*26,22,8);}
 ctx.fillStyle='#b6bfb6';ctx.fillRect(0,RUNNER.ground,RUNNER.width,2);for(let i=0;i<20;i++)ctx.fillRect(((i*67-state.distance)%1100+1100)%1100,RUNNER.ground+10+i%3*5,8+i%4*4,2);
 ctx.fillStyle='#415147';for(const o of state.obstacles){const y=RUNNER.ground-o.bottom-o.height;
 if(o.kind==='bird'){
  const flap=Math.floor(state.time*9)%2;
  ctx.fillRect(o.x+11,y+8,28,10);ctx.fillRect(o.x,y+7,17,5);ctx.fillRect(o.x+8,y+2,10,10);
  ctx.fillRect(o.x+25,y+(flap?12:0),7,10);ctx.fillRect(o.x+32,y+(flap?17:0),8,5);
  ctx.fillRect(o.x+38,y+9,8,4);ctx.fillStyle='#eef0ed';ctx.fillRect(o.x+10,y+4,2,2);ctx.fillStyle='#415147';
 }else{ctx.fillRect(o.x+o.width*.4,y,o.width*.3,o.height);ctx.fillRect(o.x,y+12,5,o.height*.45);ctx.fillRect(o.x,y+o.height*.55,o.width*.5,5);ctx.fillRect(o.x+o.width-5,y+7,5,o.height*.45);ctx.fillRect(o.x+o.width*.55,y+o.height*.45,o.width*.4,5);}}
 const x=RUNNER.x,y=RUNNER.ground-state.y-(state.duck?25:46),leg=state.y>0?0:Math.floor(state.time*14)%2;
 ctx.fillStyle=state.dead?'#8a5146':'#34483d';
 if(state.duck){
  ctx.fillRect(x+8,y+6,34,13);ctx.fillRect(x+34,y,24,15);ctx.fillRect(x-7,y+4,20,7);
  ctx.fillRect(x+11,y+18,6,leg?4:7);ctx.fillRect(x+35,y+18,6,leg?7:4);
  ctx.fillStyle='#eef0ed';ctx.fillRect(x+50,y+4,3,3);ctx.fillRect(x+46,y+11,12,2);
 }else{ctx.fillRect(x+17,y,25,16);ctx.fillRect(x+11,y+14,22,19);ctx.fillRect(x+4,y+25,27,12);ctx.fillRect(x-8,y+20,7,7);ctx.fillRect(x-2,y+26,14,7);ctx.fillRect(x+29,y+21,10,4);ctx.fillRect(x+37,y+21,3,8);ctx.fillRect(x+9,y+35,6,leg?5:11);ctx.fillRect(x+24,y+35,6,leg?11:5);ctx.fillStyle='#eef0ed';ctx.fillRect(x+34,y+4,3,3);ctx.fillRect(x+29,y+12,13,3);}
 ctx.textAlign='right';ctx.fillStyle='#526458';ctx.font='15px monospace';ctx.fillText(`HI ${String(best.current).padStart(5,'0')}   ${String(Math.floor(state.distance/10)).padStart(5,'0')}`,RUNNER.width-25,35);
 if(state.dead){ctx.textAlign='center';ctx.font='18px monospace';ctx.fillText('COLLISION · NEXT RUN',RUNNER.width/2,165);}
 };
 const animate=(now:number)=>{
 const dt=Math.min(.1,(now-previous)/1000);previous=now;
 if(options.current.playing&&!document.hidden){if(state.dead){ended+=dt;if(ended>1.4){state=createRunner(++round.current);ended=0;previousPixels=undefined;acc=0;steps=0;decision=null;}}else{acc+=dt;while(acc>=RUNNER.step){const manual={jump:input.current.jump,releaseJump:input.current.releaseJump,duck:input.current.keyboardDuck||input.current.pointerDuck};
 if(options.current.model){if(steps%NETWORK.decisionSteps===0||!decision)decision=forward(options.current.model.weights,observation(state));}else decision=null;
 tickRunner(state,options.current.auto,manual.jump||manual.duck||manual.releaseJump?manual:decision?actionInput(decision.action):manual);steps++;input.current.jump=false;input.current.releaseJump=false;acc-=RUNNER.step;}}}else{acc=0;clearInput();}
 const press=!state.dead&&(options.current.model?decision?.action===1:options.current.auto?state.press>0:input.current.jumpHeld)?1:0;controls.current.left=press;controls.current.right=!state.dead&&(options.current.model?decision?.action===2:state.duck||state.fastFall)?1:0;best.current=Math.max(best.current,Math.floor(state.distance/10));draw();
 Object.assign(el.dataset,{time:state.time.toFixed(3),jumps:String(state.jumps),score:String(Math.floor(state.distance/10)),dead:String(state.dead),press:String(press),duck:String(state.duck),fastFall:String(state.fastFall),ducks:String(state.ducks),height:state.y.toFixed(2),action:decision?String(decision.action):'none',controller:options.current.model?'neural':options.current.auto?'rule':'manual'});
 if(now-lastReport>100){lastReport=now;onDecision(decision);onTelemetry({score:Math.floor(state.distance/10),best:best.current,jumps:state.jumps,speed:state.speed,round:round.current,dead:state.dead,press:!!press,duck:state.duck,ducks:state.ducks,fastFall:state.fastFall});const sampleScale=Math.min(el.width/RUNNER.width,el.height/RUNNER.height);sampleCtx.drawImage(el,(el.width-RUNNER.width*sampleScale)/2,(el.height-RUNNER.height*sampleScale)/2,RUNNER.width*sampleScale,RUNNER.height*sampleScale,0,0,64,36);const m=measureFrame(sampleCtx.getImageData(0,0,64,36).data,64,previousPixels);previousPixels=m.values;onStimulus({...m.signal,bins:m.signal.bins.map(b=>({...b,change:Math.min(1,b.change*20)}))});}
 frame=requestAnimationFrame(animate);
 };frame=requestAnimationFrame(animate);
 return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('keydown',key);window.removeEventListener('keyup',keyUp);window.removeEventListener('blur',clearInput);document.removeEventListener('visibilitychange',visibility);el.removeEventListener('pointerdown',tap);el.removeEventListener('pointerup',releaseJump);el.removeEventListener('pointercancel',releaseJump);clearInput();controls.current.left=0;controls.current.right=0;};
 },[reset,controls,onTelemetry,onStimulus,onDecision,onManual]);
 return <><canvas ref={canvas} tabIndex={0} className="runner-canvas" role="img" aria-label="Dino runner. Space or Up to jump, Down or S to duck or fall faster. Release jump early for a shorter jump."/>
 <div className="runner-inputs">
 <button disabled={!playing} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);onManual();input.current.jump=true;input.current.jumpHeld=true;}} onPointerUp={()=>{input.current.releaseJump=true;input.current.jumpHeld=false;}} onPointerCancel={()=>{input.current.releaseJump=true;input.current.jumpHeld=false;}} onKeyDown={e=>{if((e.code==='Space'||e.code==='Enter')&&!e.repeat){e.preventDefault();onManual();input.current.jump=true;input.current.jumpHeld=true;}}} onKeyUp={e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();input.current.releaseJump=true;input.current.jumpHeld=false;}}}>↑ Jump</button>
 <button disabled={!playing} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);onManual();input.current.pointerDuck=true;}} onPointerUp={()=>{input.current.pointerDuck=false;}} onPointerCancel={()=>{input.current.pointerDuck=false;}} onLostPointerCapture={()=>{input.current.pointerDuck=false;}} onBlur={()=>{input.current.pointerDuck=false;}} onKeyDown={e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();onManual();input.current.pointerDuck=true;}}} onKeyUp={e=>{if(e.code==='Space'||e.code==='Enter'){e.preventDefault();input.current.pointerDuck=false;}}}>↓ Hold to duck</button>
 </div></>;
}
