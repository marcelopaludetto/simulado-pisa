'use client';

import { useEffect, useMemo, useState } from 'react';

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

const correct: Record<number, Answer> = { 1: 'C', 2: 'direita', 3: '3,2', 4: 15, 5: 'B', 6: 'condicional', 7: 'repeticao', 8: 'C' };

function MiniGrid({ rows = 3, cols = 3, start = 9, goal = 1, blocked = [] as number[], clickable = false, selected, onSelect }: { rows?: number; cols?: number; start?: number; goal?: number; blocked?: number[]; clickable?: boolean; selected?: number | null; onSelect?: (n: number) => void }) {
  return <div className="grid-board" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }} role={clickable ? 'radiogroup' : 'img'} aria-label="Grade do desafio">{Array.from({ length: rows * cols }, (_, i) => i + 1).map((cell) => <button key={cell} type="button" disabled={!clickable || blocked.includes(cell)} onClick={() => onSelect?.(cell)} className={`grid-cell ${blocked.includes(cell) ? 'blocked' : ''} ${cell === goal ? 'goal' : ''} ${cell === selected ? 'selected' : ''}`} aria-label={`Célula ${cell}${cell === start ? ', posição inicial' : ''}${cell === goal ? ', destino' : ''}`}>{cell === start && <span className="claw-dot" aria-hidden="true" />}{cell === goal && <span className="goal-mark" aria-hidden="true" />}</button>)}</div>;
}

function Block({ children, tone = 'move' }: { children: React.ReactNode; tone?: 'move' | 'repeat' | 'condition' | 'event' }) { return <span className={`code-block ${tone}`}>{children}</span>; }

function RadioCards({ value, onChange, options }: { value: Answer; onChange: (v: string) => void; options: { value: string; label: React.ReactNode }[] }) {
  return <div className="answer-list" role="radiogroup">{options.map((option) => <label key={option.value} className={`answer-card ${value === option.value ? 'chosen' : ''}`}><input type="radio" name="answer" checked={value === option.value} onChange={() => onChange(option.value)} /><span className="radio-dot" /><span>{option.label}</span></label>)}</div>;
}

function QuestionBody({ id, answer, setAnswer }: { id: number; answer: Answer; setAnswer: (v: Answer) => void }) {
  if (id === 1) return <><p className="prompt">A garra se move uma casa por comando. Qual sequência leva a garra até a casa azul?</p><div className="stimulus"><MiniGrid /><RadioCards value={answer} onChange={setAnswer} options={[{ value: 'A', label: '↑  ←  ↑  →' }, { value: 'B', label: '↑  ↑  ←  ↓' }, { value: 'C', label: '↑  ←  ↑  ←' }, { value: 'D', label: '←  ←  ↑  →' }]} /></div></>;
  if (id === 2) return <><p className="prompt">O programa deve levar a garra ao quadrado cinza sem tocar nos quadrados pretos. Qual comando está faltando?</p><div className="stimulus"><div className="program"><Block tone="event">início</Block><Block>mover para a esquerda</Block><Block>mover para cima</Block><Block tone="repeat">repetir 3 vezes</Block><span className="indent"><Block>?</Block></span><Block>mover para baixo</Block><Block>mover para baixo</Block></div><MiniGrid rows={4} cols={4} start={14} goal={16} blocked={[4,10,11,15]} /></div><RadioCards value={answer} onChange={setAnswer} options={['cima','baixo','esquerda','direita'].map(v => ({ value: v, label: `Mover para ${v}` }))} /></>;
  if (id === 3) { const [a,b] = String(answer ?? ',').split(','); return <><p className="prompt">Complete os dois blocos de repetição com o menor número de execuções necessário para alcançar o destino.</p><div className="stimulus"><MiniGrid rows={4} cols={7} start={22} goal={7} /><div className="program large"><Block tone="event">início</Block><Block tone="repeat">repetir <input aria-label="Primeiro número" inputMode="numeric" value={a || ''} onChange={e => setAnswer(`${e.target.value},${b || ''}`)} /> vezes</Block><span className="indent"><Block tone="repeat">repetir <input aria-label="Segundo número" inputMode="numeric" value={b || ''} onChange={e => setAnswer(`${a || ''},${e.target.value}`)} /> vezes</Block></span><span className="indent deeper"><Block>mover para a direita</Block><Block>mover para cima</Block></span></div></div></> }
  if (id === 4) return <><p className="prompt">Execute mentalmente o programa. Clique na casa em que a garra terminará.</p><div className="stimulus"><div className="program"><Block tone="event">início</Block><Block>mover para a direita</Block><Block tone="repeat">repetir 3 vezes</Block><span className="indent"><Block tone="condition">se a garra estiver em uma casa cinza</Block><span className="indent"><Block>mover para baixo</Block></span><Block tone="condition">senão</Block><span className="indent"><Block>mover para a direita</Block></span></span></div><MiniGrid rows={6} cols={6} start={1} goal={0} clickable selected={typeof answer === 'number' ? answer : null} onSelect={setAnswer} /></div></>;
  if (id === 5) return <><p className="prompt">A garra deve transportar duas latas, uma de cada vez, para a coluna vizinha. Qual programa cumpre a meta usando repetição?</p><RadioCards value={answer} onChange={setAnswer} options={[{ value:'A', label:<span className="inline-program"><Block tone="repeat">repetir 2</Block><Block>pegar</Block><Block>direita</Block><Block>soltar</Block></span>},{ value:'B', label:<span className="inline-program"><Block tone="repeat">repetir 2</Block><Block>pegar</Block><Block>direita</Block><Block>soltar</Block><Block>esquerda</Block></span>},{ value:'C', label:<span className="inline-program"><Block>pegar</Block><Block tone="repeat">repetir 2</Block><Block>direita</Block><Block>soltar</Block></span>}]} /></>;
  if (id === 6) return <><p className="prompt">Agora há latas e garrafas, que devem ir para colunas diferentes. Que estrutura permite à garra escolher uma ação conforme o objeto segurado?</p><RadioCards value={answer} onChange={setAnswer} options={[{value:'sequencia',label:'Uma sequência mais longa de movimentos'},{value:'condicional',label:<span><strong>Se… então… senão</strong>, testando o tipo de objeto</span>},{value:'velocidade',label:'Um controle de velocidade da execução'},{value:'recomeco',label:'Reiniciar o programa após cada objeto'}]} /></>;
  if (id === 7) return <><p className="prompt">A mesma rotina precisa ordenar vários objetos em duas colunas. Qual estratégia tende a usar menos blocos sem mudar o resultado?</p><RadioCards value={answer} onChange={setAnswer} options={[{value:'copiar',label:'Copiar a sequência completa para cada objeto'},{value:'repeticao',label:'Agrupar a rotina em repetições, usando uma condição quando necessário'},{value:'aleatorio',label:'Mover a garra aleatoriamente até a meta aparecer'},{value:'pausas',label:'Adicionar pausas entre todos os movimentos'}]} /></>;
  return <><p className="prompt">No desafio final, há duas colunas de objetos misturados e duas colunas de destino. Qual plano é mais geral, correto e eficiente?</p><RadioCards value={answer} onChange={setAnswer} options={[{value:'A',label:'Executar uma lista fixa de movimentos, sem observar o objeto.'},{value:'B',label:'Mover primeiro todos os objetos e decidir o destino somente no final.'},{value:'C',label:'Repetir: pegar um objeto, identificar seu tipo, levá-lo à coluna correta, soltar e voltar.'},{value:'D',label:'Escolher uma coluna ao acaso e corrigir apenas se houver espaço.'}]} /></>;
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
  const q = questions[current]; const answered = questions.filter(item => answers[item.id] !== undefined && answers[item.id] !== null && answers[item.id] !== '').length;
  const score = useMemo(() => questions.reduce((sum, item) => sum + (answers[item.id] === correct[item.id] ? item.points : 0), 0), [answers]);
  const setAnswer = (value: Answer) => setAnswers(prev => ({ ...prev, [q.id]: value }));
  const reset = () => { setAnswers({}); setCurrent(0); setSubmitted(false); localStorage.removeItem('simulado-pisa-respostas'); };
  if (submitted) return <main className="result-page"><section className="result-card"><div className="result-icon" aria-hidden="true">★</div><p className="eyebrow">Resultado do simulado</p><h1>{score} de 10 pontos</h1><p className="result-lead">{score >= 8 ? 'Você demonstrou domínio consistente do raciocínio computacional.' : score >= 6 ? 'Você já resolve boa parte dos desafios e pode avançar com mais prática.' : 'Revise sequências, repetições e condições antes de tentar novamente.'}</p><div className="score-track"><span style={{width:`${score*10}%`}} /></div><div className="review-list">{questions.map(item => <button key={item.id} onClick={() => {setCurrent(item.id-1); setSubmitted(false)}}><span className={answers[item.id] === correct[item.id] ? 'ok' : 'miss'}>{answers[item.id] === correct[item.id] ? '✓' : item.id}</span><span><strong>{item.title}</strong><small>{item.skill}</small></span><span>{answers[item.id] === correct[item.id] ? `+${item.points}` : 'Revisar'}</span></button>)}</div><button className="primary-button" onClick={reset}><span aria-hidden="true">↻</span> Refazer simulado</button></section></main>;
  return <main className="app-shell"><aside className="sidebar"><div className="brand"><span className="brand-mark" aria-hidden="true">&lt;/&gt;</span><span><strong>PISA Lab</strong><small>Pensamento computacional</small></span></div><div className="overall"><span><strong>{answered}</strong> de 8 respondidas</span><div><i style={{width:`${answered/8*100}%`}} /></div></div><nav aria-label="Questões do simulado">{questions.map((item,index)=><button key={item.id} className={index===current?'active':''} onClick={()=>setCurrent(index)}><span className={answers[item.id] !== undefined && answers[item.id] !== '' ? 'done':''}>{answers[item.id] !== undefined && answers[item.id] !== '' ? '✓' : item.id}</span><span><strong>{item.stage}</strong><small>{item.title}</small></span></button>)}</nav></aside><section className="workspace"><header><div><span className="mobile-brand"><span aria-hidden="true">&lt;/&gt;</span> PISA Lab</span><p className="eyebrow">{q.stage} · questão {q.id} de 8</p><h1>{q.title}</h1></div><div className="points">{q.points} {q.points === 1 ? 'ponto' : 'pontos'}</div></header><div className="question-card"><div className="skill-chip">Habilidade <strong>{q.skill}</strong></div><QuestionBody id={q.id} answer={answers[q.id] ?? null} setAnswer={setAnswer} /></div><footer><button className="secondary-button" disabled={current===0} onClick={()=>setCurrent(v=>v-1)}><span aria-hidden="true">←</span> Anterior</button>{current < questions.length-1 ? <button className="primary-button" onClick={()=>setCurrent(v=>v+1)}>Próxima <span aria-hidden="true">→</span></button> : <button className="primary-button finish" disabled={answered<8} onClick={()=>setSubmitted(true)}>Finalizar e corrigir <span aria-hidden="true">›</span></button>}</footer></section></main>;
}
