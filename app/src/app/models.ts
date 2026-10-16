export interface SubjectRef {
  slug: string;
  name: string;
  file: string;
}

export interface RawQuestion {
  id: string;
  number: number;
  text: string;
  options: Record<string, string>;
  correct: string;
  answerSource: string;
  verified: boolean;
  hint?: string;
  explanation?: string;
}

export interface SubjectData {
  subject: string;
  slug: string;
  questions: RawQuestion[];
}

export interface QuizOption {
  text: string;
  correct: boolean;
}

export interface QuizItem {
  id: string;
  text: string;
  options: QuizOption[];
  verified: boolean;
  hint?: string;
  explanation?: string;
}

export type QuizLength = 30 | 60;

export interface QuizSession {
  subject: string;
  requested: QuizLength;
  items: QuizItem[];
  answers: (number | null)[];
}
