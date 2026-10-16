import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { QuizService } from './quiz.service';

@Component({
  selector: 'app-quiz',
  template: `
    @if (item(); as q) {
      <header>
        <span>{{ quiz.subject() }}</span>
        <span>{{ index() + 1 }} / {{ quiz.items().length }}</span>
      </header>
      <progress [max]="quiz.items().length" [value]="quiz.answeredCount()"></progress>
      <h2>{{ q.text }}</h2>
      <div class="options">
        @for (o of q.options; track $index) {
          <button type="button" class="option" [class.on]="quiz.answers()[index()] === $index" (click)="quiz.answer(index(), $index)">
            <b>{{ letters[$index] }}</b> {{ o.text }}
          </button>
        }
      </div>
      <nav>
        <button type="button" [disabled]="index() === 0" (click)="index.set(index() - 1)">Indietro</button>
        @if (index() < quiz.items().length - 1) {
          <button type="button" class="primary" (click)="index.set(index() + 1)">Avanti</button>
        } @else {
          <button type="button" class="primary" (click)="finish()">Termina</button>
        }
      </nav>
      <div class="dots">
        @for (a of quiz.answers(); track $index) {
          <button type="button" class="dot" [class.done]="a !== null" [class.cur]="$index === index()" (click)="index.set($index)" [attr.aria-label]="'Domanda ' + ($index + 1)">{{ $index + 1 }}</button>
        }
      </div>
    }
  `,
})
export class Quiz {
  protected readonly quiz = inject(QuizService);
  private readonly router = inject(Router);

  protected readonly letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  protected readonly index = signal(0);
  protected readonly item = computed(() => this.quiz.items()[this.index()]);

  constructor() {
    if (!this.quiz.active()) this.router.navigateByUrl('/');
  }

  protected finish(): void {
    const left = this.quiz.items().length - this.quiz.answeredCount();
    if (left > 0 && !confirm(`Hai ${left} domande senza risposta. Terminare?`)) return;
    this.router.navigateByUrl('/risultato');
  }
}
