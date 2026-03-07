import { Injectable } from '@angular/core';
import { CacheService } from './cache.service';
import { ITeam, Team } from 'scheduler-node-models/scheduler/teams';

@Injectable({
  providedIn: 'root',
})
export class TeamService extends CacheService {
  constructor(

  ) {
    super();
  }

  getTeam(): Team | undefined{
    const iTeam = this.getItem<ITeam>('current-team');
    if (iTeam) {
      return new Team(iTeam);
    }
    return undefined;
  }

  clearTeam(): void {
    this.removeItem('current-team');
  }

  setTeam(iteam: ITeam) {
    const team = new Team(iteam);
    this.setItem('current-team', team);
  }
}
