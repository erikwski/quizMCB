import { TestBed } from '@angular/core/testing';
import { RawQuestion } from './models';
import { QuizService, buildQuiz, shuffle } from './quiz.service';

const pool = (n: number): RawQuestion[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `q${i}`,
    number: i + 1,
    text: `Domanda ${i}`,
    options: { A: 'a', B: 'b', C: 'c', D: 'd' },
    correct: 'C',
    answerSource: 'highlight-orange',
    verified: true,
  }));

describe('buildQuiz', () => {
  it('takes the requested number of unique questions', () => {
    const items = buildQuiz(pool(60), 30);
    expect(items.length).toBe(30);
    expect(new Set(items.map((i) => i.id)).size).toBe(30);
  });

  it('uses the whole pool when smaller than requested', () => {
    expect(buildQuiz(pool(10), 30).length).toBe(10);
  });

  it('keeps exactly one correct option, pointing at the original answer', () => {
    for (const item of buildQuiz(pool(5), 30)) {
      expect(item.options.length).toBe(4);
      expect(item.options.filter((o) => o.correct).map((o) => o.text)).toEqual(['c']);
    }
  });

  it('shuffle is a permutation and does not mutate input', () => {
    const src = [1, 2, 3, 4, 5];
    expect(shuffle(src).sort()).toEqual(src);
    expect(src).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('QuizService', () => {
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({});
  });

  it('scores correct answers only', () => {
    const svc = TestBed.inject(QuizService);
    svc.start('Test', pool(3), 30);
    svc.items().forEach((item, i) => {
      const right = item.options.findIndex((o) => o.correct);
      svc.answer(i, i === 0 ? (right + 1) % 4 : right);
    });
    expect(svc.score()).toBe(2);
    expect(svc.answeredCount()).toBe(3);
  });

  it('reset clears the session', () => {
    const svc = TestBed.inject(QuizService);
    svc.start('Test', pool(3), 30);
    svc.reset();
    expect(svc.active()).toBe(false);
  });
});
