import { Injectable, signal } from '@angular/core';
import { CacheService } from './cache.service';
import { environment } from '../../environments/environment';
import { Team } from 'scheduler-node-models/scheduler/teams';
import { HttpClient } from '@angular/common/http';
import { SecurityQuestion } from 'scheduler-node-models/users';

@Injectable({
  providedIn: 'root',
})
export class TeamService extends CacheService {
  private schedulerUrl = `${environment.schedulerUrl}`;
  team = signal(new Team());
  questions: SecurityQuestion[] = [];

  constructor(
    private http: HttpClient
  ) {
    super();
  }
}
