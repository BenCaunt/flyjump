import test from 'node:test';
import assert from 'node:assert/strict';
import {createRunner,tickRunner,jump,RUNNER} from '../src/lib/runner.ts';
test('a jump is ballistic and cannot jump again in midair',()=>{const s=createRunner();assert.equal(jump(s),true);assert.equal(jump(s),false);for(let i=0;i<120;i++)tickRunner(s,false);assert.equal(s.y,0);assert.equal(s.jumps,1);});
test('missing a cactus causes a real collision',()=>{const s=createRunner();for(let i=0;i<120*10&&!s.dead;i++)tickRunner(s,false);assert.equal(s.dead,true);});
test('distance-based controller clears seeded courses with increasing speed',()=>{for(let seed=1;seed<=20;seed++){const s=createRunner(seed);for(let i=0;i<120*180&&!s.dead;i++)tickRunner(s,true);assert.equal(s.dead,false,`seed ${seed}, t=${s.time}`);assert.ok(s.jumps>80);assert.equal(s.speed,520);}});
test('same seed gives reproducible physics and keypress timing',()=>{const run=()=>{const s=createRunner(42);for(let i=0;i<120*30;i++)tickRunner(s,true,false,RUNNER.step);return s;};assert.deepEqual(run(),run());});
