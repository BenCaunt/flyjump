export const RUNNER = {width:900,height:360,ground:280,x:110,step:1/120,gravity:1800,jumpSpeed:650};
export type Obstacle = {x:number;width:number;height:number;bottom:number;kind:'cactus'|'bird'};
export type Input = {jump?:boolean;duck?:boolean;releaseJump?:boolean};
export type State = {time:number;distance:number;speed:number;y:number;vy:number;obstacles:Obstacle[];next:number;seed:number;dead:boolean;jumps:number;press:number;duck:boolean;ducks:number;fastFall:boolean;shortJump:boolean};
export function createRunner(seed=1):State {
 return {time:0,distance:0,speed:280,y:0,vy:0,obstacles:[],next:600,seed,dead:false,jumps:0,press:0,duck:false,ducks:0,fastFall:false,shortJump:false};
}
const random = (s:State) => {s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;};
export function jump(s:State) {
 if(s.dead||s.y>0||s.duck)return false;
 s.vy=RUNNER.jumpSpeed;s.y=.001;s.press=.13;s.jumps++;s.shortJump=false;return true;
}
export function autoInput(s:State):Input {
 const next=s.obstacles.find(o=>o.x+o.width-3>RUNNER.x+7);
 if(!next)return {};
 const near=next.x-(RUNNER.x+54)<s.speed*.34+12;
 if(next.kind==='bird'&&next.bottom>=25)return {duck:near&&next.bottom<46};
 return {jump:next.x-(RUNNER.x+38)<s.speed*.34+12};
}
export function playerBounds(s:State) {
 return {left:RUNNER.x+7,right:RUNNER.x+(s.duck?53:34),bottom:s.y+3,top:s.y+(s.duck?23:44)};
}
export function tickRunner(s:State,auto:boolean,manual:boolean|Input=false,dt=RUNNER.step) {
 if(s.dead)return;
 const input=typeof manual==='boolean'?{jump:manual}:manual;
 const action=input.jump||input.duck||input.releaseJump?input:auto?autoInput(s):input;
 const wasDucking=s.duck;
 s.duck=!!action.duck&&s.y===0;
 s.fastFall=!!action.duck&&s.y>0;
 if(action.jump)jump(s);
 if(action.releaseJump&&s.y>0)s.shortJump=true;
 if(s.shortJump&&s.y>=30&&s.vy>180)s.vy=180;
 if(s.fastFall)s.vy=Math.min(s.vy,-450);
 s.time+=dt;s.speed=Math.min(520,280+s.time*1.7);s.distance+=s.speed*dt;s.next-=s.speed*dt;s.press=Math.max(0,s.press-dt);
 s.y+=s.vy*dt;s.vy-=RUNNER.gravity*(s.fastFall?3:1)*dt;
 if(s.y<=0){s.y=0;s.vy=0;s.fastFall=false;s.shortJump=false;s.duck=!!action.duck;}
 if(s.duck&&!wasDucking)s.ducks++;
 if(s.next<=0){
  const bird=s.time>8&&random(s)<.38;
  s.obstacles.push(bird
   ?{x:RUNNER.width+30,width:46,height:22,bottom:[0,29,75][Math.floor(random(s)*3)],kind:'bird'}
   :{x:RUNNER.width+30,width:20+Math.floor(random(s)*3)*10,height:36+Math.floor(random(s)*3)*9,bottom:0,kind:'cactus'});
  s.next=s.speed*(1.3+random(s)*.6);
 }
 for(const o of s.obstacles)o.x-=s.speed*dt;
 s.obstacles=s.obstacles.filter(o=>o.x+o.width>0);
 const p=playerBounds(s);
 for(const o of s.obstacles)if(p.left<o.x+o.width-3&&p.right>o.x+3&&p.bottom<o.bottom+o.height&&p.top>o.bottom)s.dead=true;
}
