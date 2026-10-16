import { Routes } from '@angular/router';
import { Home } from './home';
import { Quiz } from './quiz';
import { Result } from './result';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'quiz', component: Quiz },
  { path: 'risultato', component: Result },
  { path: '**', redirectTo: '' },
];
