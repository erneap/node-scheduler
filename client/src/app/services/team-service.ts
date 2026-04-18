import { Injectable, signal } from '@angular/core';
import { CacheService } from './cache.service';
import { environment } from '../../environments/environment';
import { ITeam, NewWorkcode, Team, UpdateTeam } from 'scheduler-models/scheduler/teams';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { SecurityQuestion } from 'scheduler-models/users';
import { map, Observable } from 'rxjs';
import { Employee } from 'scheduler-models/scheduler/employees';
import { Item } from '../general/list/list.model';

@Injectable({
  providedIn: 'root',
})
export class TeamService extends CacheService {
  private schedulerUrl = `${environment.schedulerUrl}`;
  questions: SecurityQuestion[] = [];
  selectedSite = signal<string>('');
  teamSiteList = signal<Item[]>([])

  constructor(
    private http: HttpClient
  ) {
    super();
  }

  setTeam(iTeam: ITeam) {
    const sList: Item[] = [];
    sList.push({
      id: 'new',
      value: 'Add New Site',
    })
    const team = new Team(iTeam);
    team.sites.forEach(site => {
      sList.push({
        id: site.id,
        value: site.name.toUpperCase(),
      });
    });
    this.teamSiteList.set(sList);
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

  getSimpleQuery(teamid: string): Observable<HttpResponse<Employee[]>> {
    const url = `${this.schedulerUrl}/team/query/${teamid}`;
    return this.http.get<Employee[]>(url, { observe: 'response'});
  }

  updateTeam(team: string, field: string, value: string): Observable<HttpResponse<Team>> {
    const url = `${this.schedulerUrl}/team`;
    const data: UpdateTeam = {
      team: team,
      field: field,
      value: value
    };
    return this.http.put<Team>(url, data, { observe: 'response'}).pipe(
      map(res => {
        const iTeam = (res.body as ITeam );
        if (iTeam) {
          const team = new Team(iTeam);
          const tTeam = this.getTeam();
          if (tTeam && tTeam.id === team.id) {
            this.setTeam(team);
          }
        }
        return res;
      })
    );
  }

  addWorkcode(team: string, id: string, title: string, start: number, shiftcode: string, 
    altcode: string, search: string, isleave: boolean, text: string, back: string)
    : Observable<HttpResponse<Team>> {
    const url = `${this.schedulerUrl}/team/workcode`;
    const data: NewWorkcode = {
      team: team,
      id: id,
      title: title,
      start: start,
      shiftCode: shiftcode,
      altcode: altcode,
      search: search,
      isLeave: isleave,
      textcolor: text,
      backcolor: back
    };
    return this.http.post<Team>(url, data, { observe: 'response'}).pipe(
      map(res => {
        const iTeam = (res.body as ITeam );
        if (iTeam) {
          const team = new Team(iTeam);
          const tTeam = this.getTeam();
          if (tTeam && tTeam.id === team.id) {
            this.setTeam(team);
          }
        }
        return res;
      })
    );
  }

  updateWorkcode(team: string, id: string, field: string, value: string)
    : Observable<HttpResponse<Team>> {
    const url = `${this.schedulerUrl}/team/workcode`;
    const data: UpdateTeam = {
      team: team,
      optid: id,
      field: field,
      value: value
    };
    return this.http.put<Team>(url, data, { observe: 'response'}).pipe(
      map(res => {
        const iTeam = (res.body as ITeam );
        if (iTeam) {
          const team = new Team(iTeam);
          const tTeam = this.getTeam();
          if (tTeam && tTeam.id === team.id) {
            this.setTeam(team);
          }
        }
        return res;
      })
    );
  }

  deleteWorkcode(team: string, id: string): Observable<HttpResponse<Team>> {
    const url = `${this.schedulerUrl}/team/workcode/${team}/${id}`;
    return this.http.delete<Team>(url, { observe: 'response'}).pipe(
      map(res => {
        const iTeam = (res.body as ITeam );
        if (iTeam) {
          const team = new Team(iTeam);
          const tTeam = this.getTeam();
          if (tTeam && tTeam.id === team.id) {
            this.setTeam(team);
          }
        }
        return res;
      })
    );
  }
}
