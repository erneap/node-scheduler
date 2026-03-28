import { Component, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { SiteScheduleMonth } from './site-schedule-month/site-schedule-month';
import { Workcode } from 'scheduler-models/scheduler/labor';
import { TeamService } from '../../../services/team-service';
import { Team } from 'scheduler-models/scheduler/teams';

@Component({
  selector: 'app-site-schedule',
  imports: [
    MatCardModule,
    SiteScheduleMonth
  ],
  templateUrl: './site-schedule.html',
  styleUrl: './site-schedule.scss',
})
export class SiteSchedule {
  workcodes = signal<Workcode[]>([]);

  constructor(
    private teamService: TeamService
  ) {
    const codes: Workcode[] = [];
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      team.workcodes.forEach(wc => {
        codes.push(new Workcode(wc));
      });
      this.workcodes.set(codes);
    }
  }
}
