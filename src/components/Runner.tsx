import {useEffect,useRef,type RefObject} from 'react';
import {createRunner,tickRunner,RUNNER} from '../lib/runner';
import {measureFrame,type Stimulus} from '../lib/visual-stimulus';
export type Telemetry={score:number;best:number;jumps:number;speed:number;round:number;dead:boolean;press:boolean};
export function Runner({playing,auto,reset,controls,onTelemetry,onStimulus}:{playing:boolean;auto:boolean;reset:number;controls:RefObject<{left:number;right:number}>;onTelemetry:(t:Telemetry)=>void;onStimulus:(s:Stimulus)=>void}){
 const canvas=useRef<HTMLCanvasElement>(null),options=useRef({playing,auto});options.current={playing,auto};const best=useRef(0),round=useRef(0);
 useEffect(()=>{
 const el=canvas.current!,ctx=el.getContext('2d')!,sample=document.createElement('canvas');sample.width=64;sample.height=36;const sampleCtx=sample.getContext('2d',{willReadFrequently:true})!;
 let previousPixels:Float32Array|undefined,state=createRunner(++round.current),frame=0,previous=performance.now(),acc=0,manual=false,ended=0,lastReport=0;
 const resize=()=>{const b=el.getBoundingClientRect();el.width=Math.max(1,Math.round(b.width*Math.min(devicePixelRatio,2)));el.height=Math.max(1,Math.round(b.height*Math.min(devicePixelRatio,2)));};
 const observer=new ResizeObserver(resize);observer.observe(el);resize();
 const requestJump=()=>{manual=true;};const key=(e:KeyboardEvent)=>{if((e.code==='Space'||e.code==='ArrowUp')&&!e.repeat&&!(e.target instanceof HTMLButtonElement)&&!(e.target instanceof HTMLInputElement)){e.preventDefault();requestJump();}};
 window.addEventListener('keydown',key);el.addEventListener('pointerdown',requestJump);
 const draw=()=>{
 const scale=Math.min(el.width/RUNNER.width,el.height/RUNNER.height),ox=(el.width-RUNNER.width*scale)/2,oy=(el.height-RUNNER.height*scale)/2;
 ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#eef0ed';ctx.fillRect(0,0,el.width,el.height);ctx.setTransform(scale,0,0,scale,ox,oy);ctx.imageSmoothingEnabled=false;
 ctx.fillStyle='#c9cfca';for(let i=0;i<4;i++){const x=((i*277-state.distance*.16)%1100+1100)%1100-80;ctx.fillRect(x,92+i%2*26,48,4);ctx.fillRect(x+11,84+i%2*26,22,8);}
 ctx.fillStyle='#b6bfb6';ctx.fillRect(0,RUNNER.ground,RUNNER.width,2);for(let i=0;i<20;i++)ctx.fillRect(((i*67-state.distance)%1100+1100)%1100,RUNNER.ground+10+i%3*5,8+i%4*4,2);
 ctx.fillStyle='#415147';for(const o of state.obstacles){const y=RUNNER.ground-o.height;ctx.fillRect(o.x+o.width*.4,y,o.width*.3,o.height);ctx.fillRect(o.x,y+12,5,o.height*.45);ctx.fillRect(o.x,y+o.height*.55,o.width*.5,5);ctx.fillRect(o.x+o.width-5,y+7,5,o.height*.45);ctx.fillRect(o.x+o.width*.55,y+o.height*.45,o.width*.4,5);}
 const x=RUNNER.x,y=RUNNER.ground-state.y-46,leg=state.y>0?0:Math.floor(state.time*14)%2;
 ctx.fillStyle=state.dead?'#8a5146':'#34483d';ctx.fillRect(x+17,y,25,16);ctx.fillRect(x+11,y+14,22,19);ctx.fillRect(x+4,y+25,27,12);ctx.fillRect(x-8,y+20,7,7);ctx.fillRect(x-2,y+26,14,7);ctx.fillRect(x+29,y+21,10,4);ctx.fillRect(x+37,y+21,3,8);ctx.fillRect(x+9,y+35,6,leg?5:11);ctx.fillRect(x+24,y+35,6,leg?11:5);ctx.fillStyle='#eef0ed';ctx.fillRect(x+34,y+4,3,3);ctx.fillRect(x+29,y+12,13,3);
 ctx.textAlign='right';ctx.fillStyle='#526458';ctx.font='15px monospace';ctx.fillText(`HI ${String(best.current).padStart(5,'0')}   ${String(Math.floor(state.distance/10)).padStart(5,'0')}`,RUNNER.width-25,35);
 if(state.dead){ctx.textAlign='center';ctx.font='18px monospace';ctx.fillText('COLLISION · NEXT RUN',RUNNER.width/2,165);}
 };
 const animate=(now:number)=>{
 const dt=Math.min(.1,(now-previous)/1000);previous=now;
 if(options.current.playing&&!document.hidden){if(state.dead){ended+=dt;if(ended>1.4){state=createRunner(++round.current);ended=0;previousPixels=undefined;acc=0;}}else{acc+=dt;while(acc>=RUNNER.step){tickRunner(state,options.current.auto,manual);manual=false;acc-=RUNNER.step;}}}else{acc=0;manual=false;}
 const press=state.press>0&&!state.dead?1:0;controls.current.left=press;controls.current.right=press;best.current=Math.max(best.current,Math.floor(state.distance/10));draw();
 Object.assign(el.dataset,{time:state.time.toFixed(3),jumps:String(state.jumps),score:String(Math.floor(state.distance/10)),dead:String(state.dead),press:String(press)});
 if(now-lastReport>100){lastReport=now;onTelemetry({score:Math.floor(state.distance/10),best:best.current,jumps:state.jumps,speed:state.speed,round:round.current,dead:state.dead,press:!!press});const sampleScale=Math.min(el.width/RUNNER.width,el.height/RUNNER.height);sampleCtx.drawImage(el,(el.width-RUNNER.width*sampleScale)/2,(el.height-RUNNER.height*sampleScale)/2,RUNNER.width*sampleScale,RUNNER.height*sampleScale,0,0,64,36);const m=measureFrame(sampleCtx.getImageData(0,0,64,36).data,64,previousPixels);previousPixels=m.values;onStimulus({...m.signal,bins:m.signal.bins.map(b=>({...b,change:Math.min(1,b.change*20)}))});}
 frame=requestAnimationFrame(animate);
 };frame=requestAnimationFrame(animate);
 return()=>{cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('keydown',key);el.removeEventListener('pointerdown',requestJump);controls.current.left=0;controls.current.right=0;};
 },[reset,controls,onTelemetry,onStimulus]);
 return <canvas ref={canvas} className="runner-canvas" role="img" aria-label="Dino-style runner. Press Space, Arrow Up or tap to jump."/>;
}
