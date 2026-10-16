import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { SubjectData, SubjectRef } from './models';

@Injectable({ providedIn: 'root' })
export class QuizDataService {
  private readonly http = inject(HttpClient);

  subjects(): Observable<SubjectRef[]> {
    return this.http.get<SubjectRef[]>('data/subjects.json');
  }

  subject(ref: SubjectRef): Observable<SubjectData> {
    return this.http.get<SubjectData>(`data/${ref.file}`);
  }
}
