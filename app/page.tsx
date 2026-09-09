'use client';

import { useEffect, useMemo, useState } from 'react';
import { reachesQuestionEightGoal } from './program-validation';

type Answer = string | number | null;

const questions = [
  { id: 1, stage: 'Mostrar', title: 'Planejar um caminho', skill: 'Decomposição', points: 1 },
  { id: 2, stage: 'Mostrar', title: 'Completar um programa', skill: 'Sequenciamento', points: 1 },
  { id: 3, stage: 'Mostrar', title: 'Reconhecer repetições', skill: 'Reconhecimento de padrões', points: 2 },
  { id: 4, stage: 'Mostrar', title: 'Executar passo a passo', skill: 'Raciocínio algorítmico', points: 1 },
  { id: 5, stage: 'Aprender', title: 'Transportar dois objetos', skill: 'Construção de algoritmos', points: 1 },
  { id: 6, stage: 'Aprender', title: 'Decidir com uma condição', skill: 'Lógica condicional', points: 1 },
  { id: 7, stage: 'Aprender', title: 'Criar um programa eficiente', skill: 'Otimização', points: 1 },
  { id: 8, stage: 'Aplicar', title: 'Generalizar a solução', skill: 'Resolução de problemas', points: 2 },
] as const;

const correct: Record<number, Answer> = {
  1: 'C', 2: 'direita', 3: '3,2', 4: 20,
  5: 'repeat:2,pick,right,place,left,endRepeat',
  6: 'repeat4,pick,ifBottle,left,place,right,else,right,place,left,endIf,endRepeat',
  7: 'repeat4,pick,ifBottle,right,place,left,else,left,place,right,endIf,endRepeat',
  8: 'repeat3,pick,ifBottle,repeat2,right,endRepeat,place,repeat2,left,endRepeat,else,repeat3,right,endRepeat,place,repeat3,left,endRepeat,endIf,endRepeat,right,repeat3,pick,ifBottle,right,place,left,else,repeat2,right,endRepeat,place,repeat2,left,endRepeat,endIf,endRepeat',
};
const programmingTokenPattern = /^(?:repeat[234]|repeat:\d+|pick|left|right|place|ifBottle|else|endIf|endRepeat)$/;
const normalizeProgrammingAnswer = (value: Answer | undefined) => String(value ?? '').split(',').map(token => token.trim()).filter(token => programmingTokenPattern.test(token)).join(',');
const isCorrectAnswer = (id: number, value: Answer | undefined) => id === 8 ? reachesQuestionEightGoal(normalizeProgrammingAnswer(value).split(',')) : id >= 5 ? normalizeProgrammingAnswer(value) === correct[id] : value === correct[id];
const hasAnswer = (id: number, value: Answer | undefined) => id === 3 ? /^\d+,\d+$/.test(String(value ?? '')) : id >= 5 ? String(value ?? '').split(',').some(token => token.trim() !== '') : value !== undefined && value !== null && value !== '';

function MiniGrid({ rows = 3, cols = 3, start = 9, goal = 1, blocked = [] as number[], clickable = false, selected, onSelect }: { rows?: number; cols?: number; start?: number; goal?: number; blocked?: number[]; clickable?: boolean; selected?: number | null; onSelect?: (n: number) => void }) {
  return <div className="grid-board" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }} role={clickable ? 'radiogroup' : 'img'} aria-label="Grade do desafio">{Array.from({ length: rows * cols }, (_, i) => i + 1).map((cell) => <button key={cell} type="button" disabled={!clickable || blocked.includes(cell)} onClick={() => onSelect?.(cell)} className={`grid-cell ${blocked.includes(cell) ? 'blocked' : ''} ${cell === goal ? 'goal' : ''} ${cell === selected ? 'selected' : ''}`} aria-label={`Célula ${cell}${cell === start ? ', posição inicial' : ''}${cell === goal ? ', destino' : ''}`}>{cell === start && <span className="claw-dot" aria-hidden="true" />}{cell === goal && <span className="goal-mark" aria-hidden="true" />}</button>)}</div>;
}

function Block({ children, tone = 'move' }: { children: React.ReactNode; tone?: 'move' | 'repeat' | 'condition' | 'event' }) { return <span className={`code-block ${tone}`}>{children}</span>; }

const clawScenes = {
  two: {
    current: [['🥫', '🥫'], [], [], []],
    goal: [[], ['🥫', '🥫'], [], []],
  },
  mixed: {
    current: [[], ['🧴', '🥫', '🥫', '🧴'], [], []],
    goal: [['🧴', '🧴'], [], ['🥫', '🥫'], []],
  },
  efficient: {
    current: [[], ['🧴', '🧴', '🥫', '🥫'], [], []],
    goal: [['🥫', '🥫'], [], ['🧴', '🧴'], []],
  },
  final: {
    current: [['🥫', '🧴', '🥫'], ['🧴', '🥫', '🧴'], [], []],
    goal: [[], [], ['🧴', '🧴', '🧴'], ['🥫', '🥫', '🥫']],
  },
} as const;

function ClawScene({ variant }: { variant: keyof typeof clawScenes }) {
  const scene = clawScenes[variant];
  const panel = (label: string, columns: readonly (readonly string[])[], showClaw = false) => { const sourceColumn = Math.max(0, columns.findIndex(items => items.length > 0)); return <div className="scene-panel">
    <strong>{label}</strong>
    <div className="sorting-grid" style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}>
      {showClaw && <span className="robot-claw" role="img" aria-label="Garra robótica suspensa" style={{ left: `${((sourceColumn + .5) / columns.length) * 100}%` }} />}
      {columns.map((items, column) => <div className="sorting-column" key={column}>{items.map((item, index) => <span className="recycle-object" role="img" aria-label={item === '🥫' ? 'lata' : 'garrafa'} key={`${column}-${index}`}>{item}</span>)}</div>)}
    </div>
  </div> };
  return <figure className="claw-scene" aria-label="Situação da garra de reciclagem">{panel('Garra de reciclagem', scene.current, true)}<span className="scene-arrow" aria-hidden="true">→</span>{panel('Estado-meta', scene.goal)}</figure>;
}

const programmingBlocks = {
  repeat2: { label: 'repetir 2 vezes', tone: 'repeat' },
  repeat3: { label: 'repetir 3 vezes', tone: 'repeat' },
  repeat4: { label: 'repetir 4 vezes', tone: 'repeat' },
  endRepeat: { label: 'fim da repetição', tone: 'repeat-end' },
  pick: { label: 'pegar objeto', tone: 'move' },
  left: { label: 'mover à esquerda', tone: 'move' },
  right: { label: 'mover à direita', tone: 'move' },
  place: { label: 'soltar objeto', tone: 'move' },
  ifBottle: { label: 'se estiver segurando garrafa', tone: 'condition' },
  else: { label: 'senão', tone: 'condition' },
  endIf: { label: 'fim da condição', tone: 'condition-end' },
} as const;

type ProgrammingToken = keyof typeof programmingBlocks | `repeat:${string}`;

const blockDefinition = (token: ProgrammingToken) => token.startsWith('repeat:') ? { label: 'repetir', tone: 'repeat' } : programmingBlocks[token as keyof typeof programmingBlocks];

const palettes: Record<number, ProgrammingToken[]> = {
  5: ['repeat:', 'pick', 'left', 'right', 'place', 'endRepeat'],
  6: ['repeat4', 'pick', 'left', 'right', 'place', 'ifBottle', 'else', 'endIf', 'endRepeat'],
  7: ['repeat4', 'pick', 'left', 'right', 'place', 'ifBottle', 'else', 'endIf', 'endRepeat'],
  8: ['repeat2', 'repeat3', 'pick', 'left', 'right', 'place', 'ifBottle', 'else', 'endIf', 'endRepeat'],
};

function BlockEditor({ questionId, answer, setAnswer }: { questionId: number; answer: Answer; setAnswer: (v: Answer) => void }) {
  const program = String(answer ?? '').split(',').filter(token => token in programmingBlocks || token.startsWith('repeat:')) as ProgrammingToken[];
  const [dragged, setDragged] = useState<number | null>(null);
  const [status, setStatus] = useState<'idle' | 'success' | 'retry'>('idle');
  useEffect(() => setStatus('idle'), [questionId]);
  const update = (next: ProgrammingToken[]) => { setAnswer(next.join(',')); setStatus('idle'); };
  const add = (token: ProgrammingToken) => update([...program, token]);
  const move = (from: number, to: number) => { if (to < 0 || to >= program.length) return; const next = [...program]; const [item] = next.splice(from, 1); next.splice(to, 0, item); update(next); };
  const run = () => setStatus(isCorrectAnswer(questionId, program.join(',')) ? 'success' : 'retry');

  return <div className="block-editor">
    <div className="block-palette">
      <div className="editor-heading"><span>Blocos disponíveis</span><small>Clique para adicionar</small></div>
      <div className="palette-list">{palettes[questionId].map(token => { const definition = blockDefinition(token); return <button type="button" key={token} onClick={() => add(token)} className={`builder-block ${definition.tone}`}>{token === 'repeat:' ? 'repetir ___ vezes' : definition.label}<span aria-hidden="true">＋</span></button>})}</div>
    </div>
    <div className="program-workspace">
      <div className="editor-heading"><span>Meu programa</span><button type="button" onClick={() => update([])} disabled={!program.length}>Limpar</button></div>
      <div className={`workspace-dropzone ${!program.length ? 'empty' : ''}`} onDragOver={event => event.preventDefault()} onDrop={() => { if (dragged !== null) move(dragged, program.length - 1); setDragged(null); }}>
        {!program.length && <p>Adicione blocos. A execução acontece de cima para baixo.</p>}
        {program.map((token, index) => { const definition = blockDefinition(token); return <div className={`workspace-block-row level-${program.slice(0,index).filter(item => item.startsWith('repeat') || item === 'ifBottle').length - program.slice(0,index).filter(item => item === 'endRepeat' || item === 'endIf').length}`} key={`${token}-${index}`} draggable onDragStart={() => setDragged(index)} onDragOver={event => event.preventDefault()} onDrop={event => { event.stopPropagation(); if (dragged !== null) move(dragged, index); setDragged(null); }}>
          <span className="drag-handle" aria-hidden="true">⠿</span><span className={`builder-block ${definition.tone} ${token.startsWith('repeat:') ? 'repeat-input' : ''}`}>{token.startsWith('repeat:') ? <>repetir <input aria-label="Quantidade de repetições" type="number" min="1" max="9" placeholder=" " value={token.slice(7)} onPointerDown={event => event.stopPropagation()} onChange={event => update(program.map((item,i) => i === index ? `repeat:${event.target.value}` : item))}/> vezes</> : definition.label}</span><span className="block-actions"><button type="button" aria-label="Mover bloco para cima" onClick={() => move(index,index-1)}>↑</button><button type="button" aria-label="Mover bloco para baixo" onClick={() => move(index,index+1)}>↓</button><button type="button" aria-label="Excluir bloco" onClick={() => update(program.filter((_,i)=>i!==index))}>×</button></span>
        </div>})}
      </div>
      <div className="run-row"><button type="button" className="run-program" onClick={run} disabled={!program.length}><span aria-hidden="true">▶</span> Executar programa</button>{status === 'success' && <p className="run-feedback success">✓ Meta alcançada</p>}{status === 'retry' && <p className="run-feedback retry">A meta ainda não foi alcançada. Revise a ordem e os blocos de controle.</p>}</div>
    </div>
  </div>;
}

function RadioCards({ value, onChange, options }: { value: Answer; onChange: (v: string) => void; options: { value: string; label: React.ReactNode }[] }) {
  return <div className="answer-list" role="radiogroup">{options.map((option) => <label key={option.value} className={`answer-card ${value === option.value ? 'chosen' : ''}`}><input type="radio" name="answer" checked={value === option.value} onChange={() => onChange(option.value)} /><span className="radio-dot" /><span>{option.label}</span></label>)}</div>;
}

function QuestionBody({ id, answer, setAnswer }: { id: number; answer: Answer; setAnswer: (v: Answer) => void }) {
  if (id === 1) return <><p className="prompt">A garra se move uma casa por comando. Qual sequência leva a garra até a casa azul?</p><div className="stimulus"><MiniGrid /><RadioCards value={answer} onChange={setAnswer} options={[{ value: 'A', label: '↑  ←  ↑  →' }, { value: 'B', label: '↑  ↑  ←  ↓' }, { value: 'C', label: '↑  ←  ↑  ←' }, { value: 'D', label: '←  ←  ↑  →' }]} /></div></>;
  if (id === 2) return <><p className="prompt">O programa deve levar a garra ao quadrado cinza sem tocar nos quadrados pretos. Qual comando está faltando?</p><div className="stimulus"><div className="program"><Block tone="event">início</Block><Block>mover para a esquerda</Block><Block>mover para cima</Block><Block>mover para cima</Block><Block tone="repeat">repetir 3 vezes</Block><span className="indent"><Block>?</Block></span><Block>mover para baixo</Block><Block>mover para baixo</Block></div><MiniGrid rows={4} cols={4} start={14} goal={16} blocked={[4,10,11,15]} /></div><RadioCards value={answer} onChange={setAnswer} options={['cima','baixo','esquerda','direita'].map(v => ({ value: v, label: `Mover para ${v}` }))} /></>;
  if (id === 3) { const [a,b] = String(answer ?? ',').split(','); return <><p className="prompt">Complete os dois blocos de repetição com o menor número de execuções necessário para alcançar o destino.</p><div className="stimulus"><MiniGrid rows={4} cols={7} start={22} goal={7} /><div className="program large"><Block tone="event">início</Block><Block tone="repeat">repetir <input aria-label="Número de repetições do bloco externo" type="number" min="0" max="9" value={a || ''} onChange={e => setAnswer(`${e.target.value},${b || ''}`)} /> vezes</Block><span className="repeat-body"><Block tone="repeat">repetir <input aria-label="Número de repetições do bloco interno" type="number" min="0" max="9" value={b || ''} onChange={e => setAnswer(`${a || ''},${e.target.value}`)} /> vezes</Block><span className="repeat-body nested"><Block>mover para a direita</Block></span><Block>mover para cima</Block></span></div></div></> }
  if (id === 4) return <><p className="prompt">Execute mentalmente o programa. Clique na casa em que a garra terminará.</p><div className="stimulus"><div className="program"><Block tone="event">início</Block><Block>mover para a direita</Block><Block tone="repeat">repetir 3 vezes</Block><span className="indent"><Block tone="condition">se a garra estiver em uma casa cinza</Block><span className="indent"><Block>mover para baixo</Block></span><Block tone="condition">senão</Block><span className="indent"><Block>mover para a direita</Block></span></span></div><MiniGrid rows={6} cols={6} start={1} goal={0} clickable selected={typeof answer === 'number' ? answer : null} onSelect={setAnswer} /></div></>;
  if (id === 5) return <><p className="prompt">Programe a garra para transportar as duas latas, uma de cada vez, usando uma repetição.</p><ClawScene variant="two"/><BlockEditor questionId={id} answer={answer} setAnswer={setAnswer}/></>;
  if (id === 6) return <><p className="prompt">Programe a garra para separar quatro objetos. Garrafas vão para a esquerda e latas para a direita.</p><ClawScene variant="mixed"/><BlockEditor questionId={id} answer={answer} setAnswer={setAnswer}/></>;
  if (id === 7) return <><p className="prompt">Monte um programa eficiente para ordenar os quatro objetos, usando repetição e uma condição.</p><ClawScene variant="efficient"/><BlockEditor questionId={id} answer={answer} setAnswer={setAnswer}/></>;
  return <><p className="prompt">Programe a garra para ordenar os três objetos de cada coluna. Ao final, a coluna 3 deve ter somente garrafas e a coluna 4 somente latas.</p><ClawScene variant="final"/><BlockEditor questionId={id} answer={answer} setAnswer={setAnswer}/></>;
}

export default function Home() {
  const [current, setCurrent] = useState(0); const [answers, setAnswers] = useState<Record<number, Answer>>({}); const [submitted, setSubmitted] = useState(false);
  useEffect(() => { const saved = localStorage.getItem('simulado-pisa-respostas'); if (saved) setAnswers(JSON.parse(saved)); }, []);
  useEffect(() => { localStorage.setItem('simulado-pisa-respostas', JSON.stringify(answers)); }, [answers]);
  useEffect(() => {
    const context = (document as unknown as { modelContext?: { registerTool?: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> } }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: 'responder_questao_do_simulado',
      title: 'Responder questão do simulado',
      description: 'Registra uma resposta em uma das oito questões e abre essa questão na interface.',
      inputSchema: { type: 'object', properties: { questao: { type: 'integer', minimum: 1, maximum: 8 }, resposta: { type: ['string', 'number'] } }, required: ['questao', 'resposta'], additionalProperties: false },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input: unknown) {
        const data = input as { questao?: number; resposta?: string | number };
        if (!Number.isInteger(data.questao) || (data.questao ?? 0) < 1 || (data.questao ?? 0) > 8 || !['string','number'].includes(typeof data.resposta)) throw new Error('Questão ou resposta inválida.');
        setAnswers(prev => ({ ...prev, [data.questao as number]: data.resposta as string | number }));
        setCurrent((data.questao as number) - 1); setSubmitted(false);
        return { questao: data.questao, resposta_registrada: data.resposta };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);
  const q = questions[current]; const answered = questions.filter(item => hasAnswer(item.id, answers[item.id])).length;
  const score = useMemo(() => questions.reduce((sum, item) => sum + (isCorrectAnswer(item.id, answers[item.id]) ? item.points : 0), 0), [answers]);
  const setAnswer = (value: Answer) => setAnswers(prev => ({ ...prev, [q.id]: value }));
  const reset = () => { setAnswers({}); setCurrent(0); setSubmitted(false); localStorage.removeItem('simulado-pisa-respostas'); };
  if (submitted) return <main className="result-page"><section className="result-card"><div className="result-icon" aria-hidden="true">★</div><p className="eyebrow">Resultado do simulado</p><h1>{score} de 10 pontos</h1><p className="result-lead">{score >= 8 ? 'Você demonstrou domínio consistente do raciocínio computacional.' : score >= 6 ? 'Você já resolve boa parte dos desafios e pode avançar com mais prática.' : 'Revise sequências, repetições e condições antes de tentar novamente.'}</p><div className="score-track"><span style={{width:`${score*10}%`}} /></div><div className="review-list">{questions.map(item => { const itemIsCorrect = isCorrectAnswer(item.id, answers[item.id]); return <button key={item.id} onClick={() => {setCurrent(item.id-1); setSubmitted(false)}}><span className={itemIsCorrect ? 'ok' : 'miss'}>{itemIsCorrect ? '✓' : item.id}</span><span><strong>{item.title}</strong><small>{item.skill}</small></span><span>{itemIsCorrect ? `+${item.points}` : 'Revisar'}</span></button> })}</div><button className="primary-button" onClick={reset}><span aria-hidden="true">↻</span> Refazer simulado</button></section></main>;
  return <main className="app-shell"><aside className="sidebar"><div className="brand"><span className="brand-mark" aria-hidden="true">&lt;/&gt;</span><span><strong>PISA Lab</strong><small>Pensamento computacional</small></span></div><div className="overall"><span><strong>{answered}</strong> de 8 respondidas</span><div><i style={{width:`${answered/8*100}%`}} /></div></div><nav aria-label="Questões do simulado">{questions.map((item,index)=><button key={item.id} className={index===current?'active':''} onClick={()=>setCurrent(index)}><span className={hasAnswer(item.id, answers[item.id]) ? 'done':''}>{hasAnswer(item.id, answers[item.id]) ? '✓' : item.id}</span><span><strong>{item.stage}</strong><small>{item.title}</small></span></button>)}</nav></aside><section className="workspace"><header><div><span className="mobile-brand"><span aria-hidden="true">&lt;/&gt;</span> PISA Lab</span><p className="eyebrow">{q.stage} · questão {q.id} de 8</p><h1>{q.title}</h1></div><div className="points">{q.points} {q.points === 1 ? 'ponto' : 'pontos'}</div></header><div className="question-card"><div className="skill-chip">Habilidade <strong>{q.skill}</strong></div><QuestionBody id={q.id} answer={answers[q.id] ?? null} setAnswer={setAnswer} /></div><footer><button className="secondary-button" disabled={current===0} onClick={()=>setCurrent(v=>v-1)}><span aria-hidden="true">←</span> Anterior</button>{current < questions.length-1 ? <button className="primary-button" onClick={()=>setCurrent(v=>v+1)}>Próxima <span aria-hidden="true">→</span></button> : <button className="primary-button finish" disabled={answered<8} onClick={()=>setSubmitted(true)}>Finalizar e corrigir <span aria-hidden="true">›</span></button>}</footer></section></main>;
}
