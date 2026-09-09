export type AssessmentAnswer = string | number | null | undefined;

export const itemDifficulties: Record<number, number[]> = {
  1: [351],
  2: [405],
  3: [634],
  4: [638],
  5: [446, 472, 481, 539, 648],
  6: [401, 437, 496, 611, 654],
  7: [410, 450, 505, 620, 665],
  8: [411, 455, 544, 687, 899],
};

export function proficiencyLevel(score: number) {
  if (score < 357.8) return 'Abaixo de 1';
  if (score < 420.1) return '1';
  if (score < 482.4) return '2';
  if (score < 544.7) return '3';
  if (score < 607) return '4';
  if (score < 669.3) return '5';
  return '6';
}

function programCredit(id: number, answer: AssessmentAnswer, reachedGoal: boolean) {
  const tokens = String(answer ?? '').split(',').map(token => token.trim()).filter(Boolean);
  if (!tokens.length) return 0;
  if (reachedGoal) return 5;

  const hasPickAndPlace = tokens.includes('pick') && tokens.includes('place');
  const hasMovement = tokens.includes('left') || tokens.includes('right');
  const hasRepeat = tokens.some(token => token.startsWith('repeat')) && tokens.includes('endRepeat');
  const hasCondition = tokens.includes('ifBottle') && tokens.includes('else') && tokens.includes('endIf');

  if (id === 5 && hasPickAndPlace && hasMovement && hasRepeat) return tokens.length <= 9 ? 4 : 3;
  if (id >= 6 && hasPickAndPlace && hasMovement && hasRepeat && hasCondition) return tokens.length <= 16 ? 4 : 3;
  if (hasPickAndPlace && hasMovement) return 2;
  return 1;
}

export function responseCredit(id: number, answer: AssessmentAnswer, correct: boolean) {
  return id <= 4 ? (correct ? 1 : 0) : programCredit(id, answer, correct);
}

function logProbability(theta: number, thresholds: number[], credit: number) {
  const terms = [0];
  for (const difficulty of thresholds) {
    const b = (difficulty - 500) / 100;
    terms.push(terms[terms.length - 1] + theta - b);
  }
  const maximum = Math.max(...terms);
  const denominator = maximum + Math.log(terms.reduce((sum, value) => sum + Math.exp(value - maximum), 0));
  return terms[Math.min(credit, terms.length - 1)] - denominator;
}

export function calculateResult(responses: { id: number; answer: AssessmentAnswer; correct: boolean }[]) {
  const administered = responses.filter(response => response.answer !== undefined && response.answer !== null && response.answer !== '');
  const credits = responses.map(response => ({ ...response, credit: responseCredit(response.id, response.answer, response.correct) }));
  const nodes = Array.from({ length: 41 }, (_, index) => -4 + index * .2);
  const logPosteriors = nodes.map(theta => {
    const likelihood = administered.reduce((sum, response) => {
      const credit = responseCredit(response.id, response.answer, response.correct);
      return sum + logProbability(theta, itemDifficulties[response.id], credit);
    }, 0);
    return likelihood - (theta * theta) / 2;
  });
  const maximum = Math.max(...logPosteriors);
  const weights = logPosteriors.map(value => Math.exp(value - maximum));
  const totalWeight = weights.reduce((sum, value) => sum + value, 0);
  const theta = nodes.reduce((sum, node, index) => sum + node * weights[index], 0) / totalWeight;
  const variance = nodes.reduce((sum, node, index) => sum + ((node - theta) ** 2) * weights[index], 0) / totalWeight;
  const score = 500 + 100 * theta;
  const seScore = 100 * Math.sqrt(variance);
  const ci95: [number, number] = [score - 1.96 * seScore, score + 1.96 * seScore];
  const level = proficiencyLevel(score);

  return {
    score: Math.round(score),
    seScore: Math.round(seScore),
    ci95: ci95.map(Math.round) as [number, number],
    level,
    levelUncertain: proficiencyLevel(ci95[0]) !== proficiencyLevel(ci95[1]),
    atOrAboveBaseline: score >= 420.1,
    credits,
  };
}
