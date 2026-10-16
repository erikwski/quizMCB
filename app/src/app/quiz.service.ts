import { Injectable, computed, signal } from '@angular/core';
import { QuizItem, QuizLength, QuizSession, RawQuestion } from './models';

const STORAGE_KEY = 'quizmcb.session';

export function shuffle<T>(list: readonly T[], rng: () => number = Math.random): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildQuiz(
  questions: readonly RawQuestion[],
  length: QuizLength,
  rng: () => number = Math.random,
): QuizItem[] {
  return shuffle(questions, rng)
    .slice(0, length)
    .map((q) => ({
      id: q.id,
      text: q.text,
      verified: q.verified,
      options: shuffle(
        Object.entries(q.options).map(([key, text]) => ({ text, correct: key === q.correct })),
        rng,
      ),
    }));
}

@Injectable({ providedIn: 'root' })
export class QuizService {
  private readonly session = signal<QuizSession | null>(this.restore());

  readonly subject = computed(() => this.session()?.subject ?? '');
  readonly requested = computed(() => this.session()?.requested ?? 30);
  readonly items = computed(() => this.session()?.items ?? []);
  readonly answers = computed(() => this.session()?.answers ?? []);
  readonly active = computed(() => this.items().length > 0);
  readonly answeredCount = computed(() => this.answers().filter((a) => a !== null).length);
  readonly score = computed(() => {
    const answers = this.answers();
    return this.items().filter((item, i) => {
      const a = answers[i];
      return a !== null && item.options[a].correct;
    }).length;
  });

  start(subject: string, questions: readonly RawQuestion[], length: QuizLength): void {
    const items = buildQuiz(questions, length);
    this.set({ subject, requested: length, items, answers: items.map(() => null) });
  }

  answer(index: number, option: number): void {
    const s = this.session();
    if (!s) return;
    const answers = [...s.answers];
    answers[index] = option;
    this.set({ ...s, answers });
  }

  reset(): void {
    this.session.set(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      /* storage unavailable */
    }
  }

  private set(s: QuizSession): void {
    this.session.set(s);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    } catch {
      /* storage unavailable */
    }
  }

  private restore(): QuizSession | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as QuizSession) : null;
    } catch {
      return null;
    }
  }
}
