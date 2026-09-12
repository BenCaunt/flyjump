import {ACTIONS,INPUT_LABELS,type Decision,type Model} from '../lib/policy';
export function PolicyNetwork({decision,model,active}:{decision:Decision|null;model:Model|null;active:boolean}){
 const d=decision??{inputs:Array(8).fill(0),hidden:Array(12).fill(0),scores:[0,0,0],action:0};
 const inputY=(i:number)=>38+i*27,hiddenY=(i:number)=>25+i*20,outputY=(i:number)=>72+i*65;
 const color=(v:number)=>v>=0?'#afd3b3':'#cfab8d';
 return <div className="policy-network"><svg viewBox="0 0 600 280" role="img" aria-label="Live neural network: 8 observations, 12 hidden neurons, 3 action scores. Bright edges show weighted signal strength.">
 <text x="18" y="14">OBSERVATIONS</text><text x="255" y="14">12 × TANH</text><text x="455" y="14">ACTION SCORES</text>
 {model&&d.inputs.flatMap((v,i)=>d.hidden.map((_,h)=>{const contribution=v*model.weights[h*9+i];return <line key={`i${i}-${h}`} x1="173" y1={inputY(i)} x2="305" y2={hiddenY(h)} stroke={color(contribution)} strokeOpacity={Math.min(.7,.035+Math.abs(contribution)*.2)} strokeWidth={Math.min(2,.4+Math.abs(contribution)*.4)}/>;}))}
 {model&&d.hidden.flatMap((v,h)=>d.scores.map((_,a)=>{const contribution=v*model.weights[108+a*13+h];return <line key={`h${h}-${a}`} x1="305" y1={hiddenY(h)} x2="443" y2={outputY(a)} stroke={color(contribution)} strokeOpacity={Math.min(.8,.05+Math.abs(contribution)*.25)} strokeWidth={a===d.action?1.5:.6}/>;}))}
 {d.inputs.map((v,i)=><g key={i}><text x="18" y={inputY(i)+4}>{INPUT_LABELS[i]}</text><text x="137" y={inputY(i)+4} textAnchor="end">{v.toFixed(2)}</text><circle cx="173" cy={inputY(i)} r="5" fill={color(v)} fillOpacity={.2+Math.min(1,Math.abs(v))*.8}/></g>)}
 {d.hidden.map((v,h)=><circle key={h} cx="305" cy={hiddenY(h)} r="5" fill={color(v)} fillOpacity={.15+Math.abs(v)*.85}><title>Hidden {h+1}: {v.toFixed(3)}</title></circle>)}
 {d.scores.map((v,a)=><g key={a}><circle cx="443" cy={outputY(a)} r={a===d.action&&active?9:6} fill={a===d.action&&active?'#b8e4bc':'#53685a'}/><text x="462" y={outputY(a)-4}>{ACTIONS[a].toUpperCase()} {active&&a===d.action?'◀':''}</text><text x="462" y={outputY(a)+13}>{v.toFixed(3)}</text></g>)}
 <text x="18" y="263">8 → 12 → 3 · 147 parameters · 30 decisions/s</text>
 </svg><div className="policy-caption">{!model?'Loading trained weights…':!active?'Network inactive · manual or rule control':`Selected: ${ACTIONS[d.action]} · champion generation ${model.generation}`}<span>Raw scores, not probabilities. Colors show real activations.</span></div></div>;
}
