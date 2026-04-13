import { Component, input, Input, output, signal } from '@angular/core';
import { Forecast, IForecast } from 'scheduler-models/scheduler/sites/reports/forecast';
import { Item } from '../../../../../general/list/list.model';
import { Period } from 'scheduler-models/scheduler/sites/reports/period';
import { AuthService } from '../../../../../services/auth-service';
import { SiteService } from '../../../../../services/site-service';
import { TeamService } from '../../../../../services/team-service';
import { Team } from 'scheduler-models/scheduler/teams';

interface ForecastPeriodData {
  outofcycle: Date;
}

@Component({
  selector: 'app-site-editor-forecast-editor-period',
  imports: [],
  templateUrl: './site-editor-forecast-editor-period.html',
  styleUrl: './site-editor-forecast-editor-period.scss',
})
export class SiteEditorForecastEditorPeriod {
  private _report: string = '';
  @Input()
  set forecast(id: string) {
    this._report = id;
    this.setPeriods();
  }
  get forecast(): string {
    return this._report;
  }
  site = input<string>('');
  team = signal<string>('');
  changed = output<Forecast>();
  periods = signal<Item[]>([]);
  selectedPeriod = signal<string>('');
  periodMap = new Map<string, Period>();

  constructor(
    protected authService: AuthService,
    protected siteService: SiteService,
    protected teamService: TeamService,
  ) {
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      this.team.set(team.id);
    }
  }

  setPeriods() {

  }
}
