export const RUNNER={width:900,height:360,ground:280,x:110,step:1/120,gravity:1800,jumpSpeed:650};
export type Obstacle={x:number;width:number;height:number};
export type State={time:number;distance:number;speed:number;y:number;vy:number;obstacles:Obstacle[];next:number;seed:number;dead:boolean;jumps:number;press:number};
export function createRunner(seed=1):State{return {time:0,distance:0,speed:280,y:0,vy:0,obstacles:[],next:600,seed,dead:false,jumps:0,press:0};}
const random=(s:State)=>{s.seed=(Math.imul(s.seed,1664525)+1013904223)>>>0;return s.seed/4294967296;};
export function jump(s:State){if(s.dead||s.y>0)return false;s.vy=RUNNER.jumpSpeed;s.y=.001;s.press=.13;s.jumps++;return true;}
export function autoJump(s:State){const next=s.obstacles.find(o=>o.x+o.width>RUNNER.x);if(next&&next.x-(RUNNER.x+38)<s.speed*.34+12)return jump(s);return false;}
export function tickRunner(s:State,auto:boolean,manual=false,dt=RUNNER.step){
 if(s.dead)return;if(manual)jump(s);else if(auto)autoJump(s);
 s.time+=dt;s.speed=Math.min(520,280+s.time*1.7);s.distance+=s.speed*dt;s.next-=s.speed*dt;s.press=Math.max(0,s.press-dt);
 s.y+=s.vy*dt;s.vy-=RUNNER.gravity*dt;if(s.y<=0){s.y=0;s.vy=0;}
 if(s.next<=0){s.obstacles.push({x:RUNNER.width+30,width:20+Math.floor(random(s)*3)*10,height:36+Math.floor(random(s)*3)*9});s.next=s.speed*(1.3+random(s)*.6);}
 for(const o of s.obstacles)o.x-=s.speed*dt;s.obstacles=s.obstacles.filter(o=>o.x+o.width>0);
 for(const o of s.obstacles)if(RUNNER.x+7<o.x+o.width-3&&RUNNER.x+34>o.x+3&&s.y+3<o.height)s.dead=true;
}
