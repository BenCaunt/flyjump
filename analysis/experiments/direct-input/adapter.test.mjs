import test from 'node:test';
import assert from 'node:assert/strict';
import { Connectome } from '../../flyjump/src/lib/connectome.ts';
import { NETWORK, observation, forward, decide, actionInput } from '../../flyjump/src/lib/policy.ts';
import { createRunner, tickRunner, RUNNER, score } from '../../flyjump/src/lib/runner.ts';
import { episode, randomWeights, rng } from '../../flyjump/src/lib/training.ts';
import { setAdapter } from './adapter.mjs';

test('intervention removes recurrent-state dependence and restores the original circuit', () => {
  const original = Connectome.prototype.step;
  const observations = observation(createRunner(42));
  const expected = new Connectome().step(observations);
  try {
    setAdapter('direct');
    const brain = new Connectome();
    brain.activity.fill(NaN);
    brain.scratch.fill(NaN);
    brain.drive.fill(NaN);
    const weights = randomWeights(rng(42));
    const result = decide(weights, createRunner(42), brain);
    assert.deepEqual(result.inputs, [...observations, ...Array(8).fill(0)]);
    assert.deepEqual(result.scores, forward(weights, result.inputs).scores);
    assert.deepEqual(brain.step(observations, true), Array(16).fill(0));
  } finally {
    setAdapter('connectome');
  }
  assert.equal(Connectome.prototype.step, original);
  assert.deepEqual(new Connectome().step(observations), expected);
});

test('upstream rollout with the intervention matches an independently wired direct controller', () => {
  try {
    setAdapter('direct');
    for (const seed of [42, 123, 20260912]) {
      const weights = randomWeights(rng(seed));
      const actual = episode(weights, seed, 20);
      const state = createRunner(seed);
      const actions = [0, 0, 0];
      let action = 0;
      for (let i = 0; i < Math.round(20 / RUNNER.step) && !state.dead; i++) {
        if (i % NETWORK.decisionSteps === 0) {
          action = forward(weights, [...observation(state), ...Array(8).fill(0)]).action;
          actions[action]++;
        }
        tickRunner(state, false, actionInput(action));
      }
      assert.deepEqual(actual, {
        seed, seconds: state.time, score: score(state), dead: state.dead,
        jumps: state.jumps, ducks: state.ducks, actions,
      });
    }
  } finally {
    setAdapter('connectome');
  }
});
