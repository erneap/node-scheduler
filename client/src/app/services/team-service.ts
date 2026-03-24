import { Injectable, signal } from '@angular/core';
import { CacheService } from './cache.service';
import { environment } from '../../environments/environment';
import { ITeam, Team } from 'scheduler-models/scheduler/teams';
import { HttpClient } from '@angular/common/http';
import { SecurityQuestion } from 'scheduler-models/users';

@Injectable({
  providedIn: 'root',
})
export class TeamService extends CacheService {
  private schedulerUrl = `${environment.schedulerUrl}`;
  questions: SecurityQuestion[] = [];

  constructor(
    private http: HttpClient
  ) {
    super();
  }

  setTeam(iTeam: ITeam) {
    this.setItem('team', iTeam);
  }

  getTeam(): Team | undefined {
    const iTeam = this.getItem<ITeam>('team');
    if (iTeam) {
      return new Team(iTeam);
    }
    return undefined;
  }

  removeTeam() {
    this.removeItem('team');
  }

  setQuestions(questions: SecurityQuestion[]) {
    this.setItem('questions', questions);
  }

  getQuestions(): SecurityQuestion[] {
    const answer: SecurityQuestion[] = [];
    const questions = this.getItem<SecurityQuestion[]>('questions');
    if (questions) {
      questions.forEach(quest => {
        answer.push(new SecurityQuestion(quest));
      });
    }
    return answer;
  }

  removeQuestions() {
    this.removeItem('questions');
  }
}
