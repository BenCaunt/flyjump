import test from 'node:test';
import assert from 'node:assert/strict';
import {createRunner,tickRunner,jump,RUNNER} from '../src/lib/runner.ts';
test('a jump is ballistic and cannot jump again in midair',()=>{const s=createRunner();assert.equal(jump(s),true);assert.equal(jump(s),false);for(let i=0;i<120;i++)tickRunner(s,false);assert.equal(s.y,0);assert.equal(s.jumps,1);});
test('missing a cactus causes a real collision',()=>{const s=createRunner();for(let i=0;i<120*10&&!s.dead;i++)tickRunner(s,false);assert.equal(s.dead,true);});
test('distance-based controller clears seeded courses with increasing speed',()=>{for(let seed=1;seed<=20;seed++){const s=createRunner(seed);for(let i=0;i<120*180&&!s.dead;i++)tickRunner(s,true);assert.equal(s.dead,false,`seed ${seed}, t=${s.time}`);assert.ok(s.jumps>45);assert.ok(s.ducks>0);assert.equal(s.speed,520);}});
test('same seed gives reproducible physics and keypress timing',()=>{const run=()=>{const s=createRunner(42);for(let i=0;i<120*30;i++)tickRunner(s,true,false,RUNNER.step);return s;};assert.deepEqual(run(),run());});

const obstacle=(kind,bottom=0)=>({x:RUNNER.x,width:46,height:kind==='bird'?22:45,bottom,kind});
test('middle bird hits standing runner but clears a held duck',()=>{
 const standing=createRunner(),ducking=createRunner();standing.obstacles=[obstacle('bird',29)];ducking.obstacles=[obstacle('bird',29)];
 tickRunner(standing,false);tickRunner(ducking,false,{duck:true});assert.equal(standing.dead,true);assert.equal(ducking.dead,false);assert.equal(ducking.duck,true);
 tickRunner(ducking,false,{duck:true});assert.equal(ducking.ducks,1);
 tickRunner(ducking,false);assert.equal(ducking.duck,false);assert.equal(ducking.dead,true);
});
test('ducking cannot pass through cacti or ground-level birds',()=>{
 for(const kind of ['cactus','bird']){const s=createRunner();s.obstacles=[obstacle(kind)];tickRunner(s,false,{duck:true});assert.equal(s.dead,true);}
});
test('high bird clears standing runner but collides with an airborne runner',()=>{
 const ground=createRunner(),air=createRunner();ground.obstacles=[obstacle('bird',75)];air.obstacles=[obstacle('bird',75)];air.y=60;
 tickRunner(ground,false);tickRunner(air,false);assert.equal(ground.dead,false);assert.equal(air.dead,true);
});
test('duck blocks jumps, release restores running and permits a jump',()=>{
 const s=createRunner();tickRunner(s,false,{duck:true,jump:true});assert.equal(s.jumps,0);tickRunner(s,false,{jump:true});assert.equal(s.jumps,1);
});
test('Down in midair falls faster and becomes a duck on landing',()=>{
 const normal=createRunner(),drop=createRunner();jump(normal);jump(drop);
 for(let i=0;i<15;i++){tickRunner(normal,false);tickRunner(drop,false);}
 for(let i=0;i<20;i++){tickRunner(normal,false);tickRunner(drop,false,{duck:true});}
 assert.ok(normal.y>0);assert.equal(drop.y,0);assert.equal(drop.duck,true);assert.equal(drop.ducks,1);
 tickRunner(drop,false);assert.equal(drop.duck,false);assert.equal(drop.fastFall,false);
});
test('early jump release reduces apex but preserves a minimum hop',()=>{
 const full=createRunner(),short=createRunner();jump(full);jump(short);let fullPeak=0,shortPeak=0;
 for(let i=0;i<120;i++){tickRunner(full,false);tickRunner(short,false,{releaseJump:i===0});fullPeak=Math.max(fullPeak,full.y);shortPeak=Math.max(shortPeak,short.y);}
 assert.ok(shortPeak>=30);assert.ok(shortPeak<fullPeak*.6);assert.equal(short.y,0);
});
