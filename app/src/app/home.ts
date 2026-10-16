import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { QuizLength, SubjectRef } from './models';
import { QuizDataService } from './quiz-data.service';
import { QuizService } from './quiz.service';

@Component({
  selector: 'app-home',
  template: `
    <h1>Quiz MCB</h1>
    <section>
      <h2>Materia</h2>
      <div class="choices">
        @for (s of subjects() ?? []; track s.slug) {
          <button type="button" [class.on]="selected()?.slug === s.slug" (click)="selected.set(s)">{{ s.name }}</button>
        } @empty {
          <p class="muted">Caricamento…</p>
        }
      </div>
    </section>
    <section>
      <h2>Numero domande</h2>
      <div class="choices">
        @for (n of lengths; track n) {
          <button type="button" [class.on]="length() === n" (click)="length.set(n)">{{ n }}</button>
        }
      </div>
    </section>
    @if (error()) {
      <p class="error">{{ error() }}</p>
    }
    <p>
      <button type="button" class="primary" [disabled]="!selected() || loading()" (click)="start()">
        {{ loading() ? 'Carico…' : 'Avvia quiz' }}
      </button>
    </p>
  `,
})
export class Home {
  private readonly data = inject(QuizDataService);
  private readonly quiz = inject(QuizService);
  private readonly router = inject(Router);

  protected readonly lengths: QuizLength[] = [30, 60];
  protected readonly subjects = toSignal(this.data.subjects());
  protected readonly selected = signal<SubjectRef | null>(null);
  protected readonly length = signal<QuizLength>(30);
  protected readonly loading = signal(false);
  protected readonly error = signal('');

  constructor() {
    effect(() => {
      const first = this.subjects()?.[0];
      if (first && !this.selected()) this.selected.set(first);
    });
  }

  protected start(): void {
    const ref = this.selected();
    if (!ref) return;
    this.loading.set(true);
    this.error.set('');
    this.data.subject(ref).subscribe({
      next: (d) => {
        this.quiz.start(d.subject, d.questions, this.length());
        this.router.navigateByUrl('/quiz');
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Impossibile caricare le domande.');
      },
    });
  }
}
