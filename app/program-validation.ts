type ProgramNode =
  | { kind: 'action'; token: 'pick' | 'left' | 'right' | 'place' }
  | { kind: 'repeat'; times: number; body: ProgramNode[] }
  | { kind: 'condition'; whenBottle: ProgramNode[]; otherwise: ProgramNode[] };

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

export function reachesQuestionEightGoal(tokens: string[]) {
  const parsed = parseProgramSection(tokens, 0, []);
  if (!parsed || parsed.next !== tokens.length) return false;
  type Item = 'bottle' | 'can';
  const state = {
    sources: [['can', 'bottle', 'can'], ['bottle', 'can', 'bottle']] as Item[][],
    source: 0,
    offset: 0,
    held: null as Item | null,
    placed: 0,
    steps: 0,
  };
  const execute = (nodes: ProgramNode[]): boolean => {
    for (const node of nodes) {
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
        const source = state.sources[state.source];
        if (state.held || state.offset !== 0 || !source?.length) return false;
        state.held = source.pop() ?? null;
      } else if (node.token === 'place') {
        if (!state.held || state.offset === 0) return false;
        const correctSide = state.held === 'bottle' ? state.offset < 0 : state.offset > 0;
        if (!correctSide) return false;
        state.held = null;
        state.placed += 1;
      } else if (state.held || state.offset !== 0) {
        state.offset += node.token === 'left' ? -1 : 1;
      } else {
        state.source += node.token === 'left' ? -1 : 1;
      }
    }
    return true;
  };
  return execute(parsed.nodes) && state.placed === 6 && state.held === null && state.sources.every(source => source.length === 0);
}
