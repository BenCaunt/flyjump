import {RUNNER,type State,type Input} from './runner.ts';
export const INPUT_LABELS=['Distance','Width','Height','Altitude','Speed','Player Y','Velocity','Grounded'];
export const ACTIONS=['Run','Jump','Duck'] as const;
export const NETWORK={inputs:8,hidden:12,outputs:3,parameters:147,decisionSteps:4,version:'flyjump-v1'} as const;
export type Model={version:typeof NETWORK.version;weights:number[];generation:number;trainingSeed:number;validation:number};
export type Decision={inputs:number[];hidden:number[];scores:number[];action:number};
export function observation(s:State):number[]{
 const o=s.obstacles.find(o=>o.x+o.width-3>RUNNER.x+7);
 return [o?Math.max(-.2,Math.min(1,(o.x-RUNNER.x)/600)):1,o?o.width/60:0,o?o.height/60:0,o?o.bottom/100:0,s.speed/520,s.y/120,s.vy/650,s.y===0?1:0];
}
export function forward(weights:number[],inputs:number[]):Decision {
 const hidden=new Array<number>(12),scores=new Array<number>(3);let k=0;
 for(let h=0;h<12;h++){let z=0;for(let i=0;i<8;i++)z+=weights[k++]*inputs[i];hidden[h]=Math.tanh(z+weights[k++]);}
 for(let a=0;a<3;a++){let z=0;for(let h=0;h<12;h++)z+=weights[k++]*hidden[h];scores[a]=z+weights[k++];}
 let action=0;for(let a=1;a<3;a++)if(scores[a]>scores[action])action=a;
 return {inputs,hidden,scores,action};
}
export const actionInput=(action:number):Input=>({jump:action===1,duck:action===2});
export function validModel(value:unknown):value is Model {
 if(!value||typeof value!=='object')return false;const m=value as Model;
 return m.version===NETWORK.version&&Array.isArray(m.weights)&&m.weights.length===NETWORK.parameters&&m.weights.every(n=>Number.isFinite(n)&&Math.abs(n)<1e4)&&Number.isInteger(m.generation)&&m.generation>=0&&Number.isInteger(m.trainingSeed)&&Number.isFinite(m.validation);
}
