import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRunner} from '../src/lib/runner.ts';
import {NETWORK,forward,observation,validModel} from '../src/lib/policy.ts';
import {Trainer,episode,rng,randomWeights} from '../src/lib/training.ts';
import {benchmark} from '../src/lib/benchmark.ts';
const model=JSON.parse(readFileSync(new URL('../public/benchmarks/model.json',import.meta.url),'utf8'));
test('network exposes real activations and chooses the largest raw score',()=>{
 const weights=Array(NETWORK.parameters).fill(0);weights[133]=2;
 const result=forward(weights,observation(createRunner()));
 assert.deepEqual(result.hidden,Array(12).fill(0));assert.deepEqual(result.scores,[0,2,0]);assert.equal(result.action,1);
});
test('policy weights actually control movement without the rule baseline',()=>{
 const weights=Array(NETWORK.parameters).fill(0);
 assert.equal(episode(weights,42,20).jumps,0);
 weights[133]=2;assert.ok(episode(weights,42,20).jumps>0);
 weights[146]=4;const duck=episode(weights,42,20);assert.equal(duck.jumps,0);assert.equal(duck.ducks,1);
});
test('observations include vertical geometry and finite normalized state',()=>{
 const s=createRunner();s.obstacles=[{x:200,width:46,height:22,bottom:29,kind:'bird'}];
 const input=observation(s);assert.equal(input.length,8);assert.ok(input.every(Number.isFinite));assert.equal(input[3],.29);
});
test('malformed, incompatible, nonfinite and oversized models are rejected',()=>{
 assert.ok(validModel(model));for(const bad of [null,{}, {...model,version:'old'},{...model,weights:[]},{...model,weights:model.weights.map(()=>NaN)},{...model,weights:model.weights.map(()=>1e9)}])assert.equal(validModel(bad),false);
});
test('training starts from seeded random weights and changes its distribution using rollouts',()=>{
 const a=new Trainer(42),b=new Trainer(42),original=a.champion.weights.slice();
 assert.deepEqual(original,randomWeights(rng(42)));const first=a.step();assert.deepEqual(first,b.step());
 assert.equal(first.episodes,196);assert.ok(first.meanFitness>0);assert.ok(a.mean.some(n=>n!==0));assert.notDeepEqual(first.model.weights,original);
});
test('checkpoint inference is deterministic on a held-out course',()=>assert.deepEqual(episode(model.weights,2000042,180),episode(model.weights,2000042,180)));
test('published benchmark reproduces against the shipped model and physics',()=>{
 const saved=JSON.parse(readFileSync(new URL('../public/benchmarks/benchmark.json',import.meta.url),'utf8'));
 const actual=benchmark(model);assert.deepEqual(actual.results,saved.results);assert.ok(actual.results[0].meanScore>actual.results[2].meanScore*10);
});
