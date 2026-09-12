export function Methods() {
  return (
    <section id="science" className="methods">
      <p className="eyebrow">METHOD, LIMITS & SHARED WORK</p>
      <h2>Real learning. A clearly bounded model.</h2>
      <p className="section-intro">
        Fly Dino joins an original game engine, measured fly connectivity, and a
        trainable controller. Each part has a different role. Here is exactly
        what runs.
      </p>
      <ol className="method-steps">
        <li>
          <span>OBSERVE</span>
          <h3>Read the game state</h3>
          <p>
            Eight engineered signals describe the nearest obstacle, speed, jump
            height, velocity and ground contact. This follows the structured
            observation approach in CodeBullet’s Dino AI. The agent does not see
            raw pixels.
          </p>
        </li>
        <li>
          <span>PROPAGATE</span>
          <h3>Run a measured circuit</h3>
          <p>
            Signals drive 32 visual cells in an 80-cell MaleCNS subset. All
            1,296 internal directed connections come from measured synaptic
            contacts. A signed, normalized, leaky tanh model updates the circuit
            three times per decision.
          </p>
        </li>
        <li>
          <span>DECIDE</span>
          <h3>Choose a key</h3>
          <p>
            The activities of 16 descending cells enter a 16–12–3 neural
            readout. Its largest raw score chooses Run, Jump or Duck at 30 Hz.
            There is no direct game-state shortcut or rule fallback in this
            controller.
          </p>
        </li>
        <li>
          <span>LEARN</span>
          <h3>Improve through play</h3>
          <p>
            Cross-entropy neuroevolution samples 64 readouts, evaluates them on
            shared seeded courses and updates its search distribution from the
            best eight. Only the 243 readout parameters are trained. Four
            validation courses select the checkpoint.
          </p>
        </li>
      </ol>
      <div className="method-boundary">
        <h3>What the brain view means</h3>
        <p>
          Colored points show the actual computed state of those 80 cells at
          their measured soma coordinates. The 124,289-cell gray atlas is
          anatomical context. It is not being simulated. Green and orange
          indicate signed activation, not measured spikes or membrane voltage.
        </p>
        <p>
          The channel-to-cell mapping, neurotransmitter sign convention, rate
          dynamics and action decoder are engineering choices. This is a
          connectome-constrained controller, not a whole fly brain or a
          biological fly trained to play. The body is an animated anatomical
          rig, not a motor-control simulation.
        </p>
      </div>
      <div className="reproduce">
        <div>
          <h3>Repeat the experiment</h3>
          <p>
            The browser, training worker and benchmark use the same pinned
            Chromium update and collision code at 60 Hz. Training, validation
            and test seeds are separate. Ordinary play uses frozen weights;
            training actually changes them.
          </p>
          <p>
            <a href="https://github.com/cobanov/flyjump/blob/main/docs/experiment.md">
              Full protocol & results ↗
            </a>{" "}
            · <a href="/data/connectome/manifest.json">Data provenance ↗</a>
          </p>
        </div>
        <pre>
          <code>
            npm ci{"\n"}npm run train -- 20260912 80{"\n"}npm run benchmark
            {"\n"}npm test
          </code>
        </pre>
      </div>
      <h2 className="credits-title">Built on shared work</h2>
      <p className="section-intro">
        Reuse is part of the experiment. Code and assets, data, and
        methodological inspiration are credited separately.
      </p>
      <div className="credit-grid">
        <article>
          <span>UPSTREAM CODE & ART · BSD 3-CLAUSE</span>
          <h3>
            <a href="https://chromium.googlesource.com/chromium/src/+/refs/tags/98.0.4758.55/components/neterror/resources/">
              The Chromium Authors ↗
            </a>
          </h3>
          <p>
            The original Dino engine, obstacle rules, collision boxes and
            sprites, pinned to Chromium 98.0.4758.55. Wrapped for a
            deterministic clock and seeded randomness.{" "}
            <a href="/vendor/chromium/LICENSE">License</a>.
          </p>
        </article>
        <article>
          <span>CONNECTOME DATA · CC BY 4.0</span>
          <h3>
            <a href="https://male-cns.janelia.org/">FlyEM / MaleCNS ↗</a>
          </h3>
          <p>
            HHMI Janelia, University of Cambridge, MRC Laboratory of Molecular
            Biology and Google Research. Measured neuron identities, soma
            positions, directed synaptic counts and transmitter annotations.{" "}
            <a href="/data/brain-atlas/NOTICE.md">Data notice</a>.
          </p>
        </article>
        <article>
          <span>ANATOMY & PROJECT FOUNDATION</span>
          <h3>
            <a href="https://github.com/TuragaLab/flybody">
              Flybody / Turaga Lab ↗
            </a>
          </h3>
          <p>
            Fly anatomy and meshes, Apache 2.0. The visualization foundation
            comes from{" "}
            <a href="https://github.com/cobanov/fly-connectome-template">
              fly-connectome-template
            </a>{" "}
            by Mert Cobanov. The keyboard animation is our integration.
          </p>
        </article>
        <article>
          <span>DINO TRAINING & VISUALIZATION INSPIRATION</span>
          <h3>
            <a href="https://github.com/Code-Bullet/Google-Chrome-Dino-Game-AI">
              CodeBullet ↗
            </a>
          </h3>
          <p>
            Structured obstacle observations, score-driven evolution and a
            visible decision network. CodeBullet uses NEAT and evolves topology;
            we use CEM with a fixed topology. Its Processing code is not copied.
          </p>
        </article>
        <article>
          <span>ALTERNATIVE DINO LEARNING METHOD</span>
          <h3>
            <a href="https://github.com/aome510/chrome-dino-game-rl">
              aome510 / chrome-dino-game-rl ↗
            </a>
          </h3>
          <p>
            A useful DQN and Gymnasium Dino reference. It learns action values
            with replay and target networks. We retain an original Chromium
            environment and use population search instead; no DQN implementation
            is claimed here.
          </p>
        </article>
        <article>
          <span>CONNECTOME CONTROLLER REFERENCES</span>
          <h3>
            <a href="https://github.com/nftechie/doomfly">
              nftechie / Doomfly ↗
            </a>
          </h3>
          <p>
            MaleCNS data integration and explicit learning experiments informed
            our provenance review.{" "}
            <a href="https://github.com/liuzihe02/fly-craftax">fly-craftax</a>{" "}
            informed the fixed connectome plus trained readout separation;{" "}
            <a href="https://github.com/eganeganegan/flydoom">flydoom</a>{" "}
            informed the sparse rate-model direction. Their tasks and training
            algorithms differ from ours.
          </p>
        </article>
      </div>
      <p className="reference-note">
        Algorithm reference: de Boer, Kroese, Mannor & Rubinstein,{" "}
        <a href="https://people.smp.uq.edu.au/DirkKroese/ps/CEtutorial.pdf">
          A Tutorial on the Cross-Entropy Method
        </a>
        . Detailed source pins, differences and license notes:{" "}
        <a href="https://github.com/cobanov/flyjump/blob/main/THIRD_PARTY_NOTICES.md">
          third-party notices
        </a>
        . Independent project, not affiliated with Google Chrome.
      </p>
    </section>
  );
}
