type ProgramNode =
  | { kind: 'action'; token: 'pick' | 'left' | 'right' | 'place' }
  | { kind: 'repeat'; times: number; body: ProgramNode[] }
  | { kind: 'condition'; whenBottle: ProgramNode[]; otherwise: ProgramNode[] };

type Item = 'bottle' | 'can';

type Challenge = {
  columns: Item[][];
  position: number;
  goal: Item[][];
  minRepeats: number;
  maxRepeats: number;
  requiresCondition: boolean;
};

/** Estado inicial, meta e exigências de forma de cada questão de programação.
 *  As exigências de forma espelham o enunciado: o simulador diz se a meta foi
 *  atingida, estas regras dizem se foi atingida do jeito que a questão pediu. */
const challenges: Record<number, Challenge> = {
  5: {
    columns: [['can', 'can'], [], [], []], position: 0,
    goal: [[], ['can', 'can'], [], []],
    minRepeats: 1, maxRepeats: Infinity, requiresCondition: false,
  },
  6: {
    columns: [[], ['bottle', 'can', 'can', 'bottle'], [], []], position: 1,
    goal: [['bottle', 'bottle'], [], ['can', 'can'], []],
    minRepeats: 1, maxRepeats: Infinity, requiresCondition: true,
  },
  7: {
    columns: [[], ['bottle', 'bottle', 'can', 'can'], [], []], position: 1,
    goal: [['can', 'can'], [], ['bottle', 'bottle'], []],
    minRepeats: 1, maxRepeats: 1, requiresCondition: false,
  },
  8: {
    columns: [['can', 'bottle', 'can'], ['bottle', 'can', 'bottle'], [], []], position: 0,
    goal: [[], [], ['bottle', 'bottle', 'bottle'], ['can', 'can', 'can']],
    minRepeats: 0, maxRepeats: Infinity, requiresCondition: false,
  },
};

function parseProgramSection(tokens: string[], start: number, stops: string[]): { nodes: ProgramNode[]; next: number } | null {
  const nodes: ProgramNode[] = [];
  let next = start;
  while (next < tokens.length && !stops.includes(tokens[next])) {
    const token = tokens[next];
    if (token === 'endRepeat' || token === 'else' || token === 'endIf') return null;
    if (token.startsWith('repeat')) {
      const match = token.match(/^repeat(?::)?(\d+)$/);
      const times = match ? Number(match[1]) : 0;
      if (times < 1 || times > 9) return null;
      const body = parseProgramSection(tokens, next + 1, ['endRepeat']);
      if (!body || tokens[body.next] !== 'endRepeat') return null;
      nodes.push({ kind: 'repeat', times, body: body.nodes });
      next = body.next + 1;
      continue;
    }
    if (token === 'ifBottle') {
      const whenBottle = parseProgramSection(tokens, next + 1, ['else', 'endIf']);
      if (!whenBottle) return null;
      let otherwise: ProgramNode[] = [];
      next = whenBottle.next;
      if (tokens[next] === 'else') {
        const alternative = parseProgramSection(tokens, next + 1, ['endIf']);
        if (!alternative) return null;
        otherwise = alternative.nodes;
        next = alternative.next;
      }
      if (tokens[next] !== 'endIf') return null;
      nodes.push({ kind: 'condition', whenBottle: whenBottle.nodes, otherwise });
      next += 1;
      continue;
    }
    if (token === 'pick' || token === 'left' || token === 'right' || token === 'place') {
      nodes.push({ kind: 'action', token });
      next += 1;
      continue;
    }
    return null;
  }
  return { nodes, next };
}

/** um trecho que pega ou solta objeto — o que distingue uma repetição que faz
 *  o trabalho de uma repetição decorativa, posta só para satisfazer o enunciado */
function movesObjects(list: ProgramNode[]): boolean {
  return list.some(node => node.kind === 'action' ? node.token === 'pick' || node.token === 'place'
    : node.kind === 'repeat' ? movesObjects(node.body)
    : movesObjects(node.whenBottle) || movesObjects(node.otherwise));
}

function countStructures(nodes: ProgramNode[]) {
  let repeats = 0;
  let conditions = 0;
  let productiveRepeat = false;
  const walk = (list: ProgramNode[]) => {
    for (const node of list) {
      if (node.kind === 'repeat') {
        repeats += 1;
        if (movesObjects(node.body)) productiveRepeat = true;
        walk(node.body);
      }
      else if (node.kind === 'condition') { conditions += 1; walk(node.whenBottle); walk(node.otherwise); }
    }
  };
  walk(nodes);
  return { repeats, conditions, productiveRepeat };
}

function runProgram(nodes: ProgramNode[], challenge: Challenge) {
  const state = {
    columns: challenge.columns.map(column => [...column]),
    position: challenge.position,
    held: null as Item | null,
    steps: 0,
  };
  const execute = (list: ProgramNode[]): boolean => {
    for (const node of list) {
      if (++state.steps > 500) return false;
      if (node.kind === 'repeat') {
        for (let count = 0; count < node.times; count += 1) if (!execute(node.body)) return false;
        continue;
      }
      if (node.kind === 'condition') {
        if (!state.held || !execute(state.held === 'bottle' ? node.whenBottle : node.otherwise)) return false;
        continue;
      }
      if (node.token === 'pick') {
        const column = state.columns[state.position];
        if (state.held || !column.length) return false;
        state.held = column.pop() ?? null;
      } else if (node.token === 'place') {
        if (!state.held) return false;
        state.columns[state.position].push(state.held);
        state.held = null;
      } else {
        const destination = state.position + (node.token === 'left' ? -1 : 1);
        if (destination < 0 || destination >= state.columns.length) return false;
        state.position = destination;
      }
    }
    return true;
  };
  return execute(nodes) && state.held === null
    && state.columns.every((column, index) => column.join(',') === challenge.goal[index].join(','));
}

export type ProgramOutcome = {
  /** o programa é sintaticamente válido (blocos de controle fechados) */
  parsed: boolean;
  /** a garra chegou ao estado-meta */
  reachesGoal: boolean;
  /** usou os blocos de controle que o enunciado pediu */
  satisfiesForm: boolean;
  /** conta como acerto: meta atingida do jeito pedido */
  correct: boolean;
  /** o que dizer ao aluno quando chegou à meta pelo caminho errado */
  formHint: string;
};

export function evaluateProgram(id: number, tokens: string[]): ProgramOutcome {
  const miss: ProgramOutcome = { parsed: false, reachesGoal: false, satisfiesForm: false, correct: false, formHint: '' };
  const challenge = challenges[id];
  if (!challenge) return miss;
  const parsed = parseProgramSection(tokens, 0, []);
  if (!parsed || parsed.next !== tokens.length) return miss;

  const { repeats, conditions, productiveRepeat } = countStructures(parsed.nodes);
  const hints: string[] = [];
  if (repeats < challenge.minRepeats) hints.push('o enunciado pede que você use uma repetição');
  else if (challenge.minRepeats >= 1 && !productiveRepeat) hints.push('a repetição precisa ser o que transporta os objetos, e não um bloco solto ao lado do programa');
  if (repeats > challenge.maxRepeats) hints.push('o enunciado pede uma única repetição, e você usou mais de uma');
  if (challenge.requiresCondition && conditions < 1) hints.push('o enunciado pede que você use uma condição');

  const reachesGoal = runProgram(parsed.nodes, challenge);
  const satisfiesForm = hints.length === 0;
  return {
    parsed: true,
    reachesGoal,
    satisfiesForm,
    correct: reachesGoal && satisfiesForm,
    formHint: hints.length ? `Você chegou ao estado-meta, mas ${hints.join(' e ')}.` : '',
  };
}
