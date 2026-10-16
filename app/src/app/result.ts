import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { QuizService } from './quiz.service';

@Component({
  selector: 'app-result',
  template: `
    <h1>Risultato</h1>
    <p class="score">{{ quiz.score() }} / {{ quiz.items().length }} <small>({{ percent() }}%)</small></p>
    @if (quiz.items().length < quiz.requested()) {
      <p class="muted">Disponibili solo {{ quiz.items().length }} domande (richieste {{ quiz.requested() }}).</p>
    }
    <div class="actions">
      <button type="button" class="primary" (click)="again()">Nuovo quiz</button>
    </div>
    <h2>Revisione</h2>
    @for (q of quiz.items(); track q.id; let i = $index) {
      <article [class.ok]="isRight(i)" [class.ko]="!isRight(i)">
        <h3>{{ i + 1 }}. {{ q.text }}</h3>
        <ul>
          @for (o of q.options; track $index) {
            <li [class.right]="o.correct" [class.wrong]="quiz.answers()[i] === $index && !o.correct">
              {{ o.text }}
              @if (o.correct && !q.verified) {
                <em title="Risposta non verificata">?</em>
              }
            </li>
          }
        </ul>
        @if (quiz.answers()[i] === null) {
          <p class="muted">Nessuna risposta</p>
        }
      </article>
    }
  `,
})
export class Result {
  protected readonly quiz = inject(QuizService);
  private readonly router = inject(Router);

  protected readonly percent = computed(() => {
    const n = this.quiz.items().length;
    return n ? Math.round((this.quiz.score() / n) * 100) : 0;
  });

  constructor() {
    if (!this.quiz.active()) this.router.navigateByUrl('/');
  }

  protected isRight(i: number): boolean {
    const a = this.quiz.answers()[i];
    return a !== null && this.quiz.items()[i].options[a].correct;
  }

  protected again(): void {
    this.quiz.reset();
    this.router.navigateByUrl('/');
  }
}
