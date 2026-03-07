import { Component } from '@angular/core';
import { Site } from 'scheduler-node-models/scheduler/sites';
import { SiteService } from '../../services/site-service';
import { AppStateService } from '../../services/app-state-service';
import { Workcenter } from 'scheduler-node-models/scheduler/sites/workcenters';
import { EmployeeScheduleMonthComponent } 
  from './employee-schedule-month/employee-schedule-month.component';
import { MatCardModule } from '@angular/material/card';

@Component({
    selector: 'app-employee-schedule',
    imports: [ 
      EmployeeScheduleMonthComponent,
      MatCardModule
    ],
    templateUrl: './employee-schedule.component.html',
    styleUrls: ['./employee-schedule.component.scss'],
})
export class EmployeeScheduleComponent {
  workcenters: Workcenter[] = []

  constructor(
    protected siteService: SiteService,
    protected appState: AppStateService
  ) {
    const iSite = this.siteService.getSite();
    if (iSite) {
      const site = new Site(iSite);
      this.workcenters = [];
      if (site.workcenters) {
        site.workcenters.forEach(wc => {
          this.workcenters.push(new Workcenter(wc));
        })
      }
      this.workcenters.sort((a,b) => a.compareTo(b));
    }
  }

  viewClass(): string {
    return "fxLayout flexlayout column topleft";
  }

  cardClass(): string {
    return "background-color: #673ab7;color: white;";
  }

  getWidth(): number {
    let ratio = this.appState.viewWidth / 778; 
    if (ratio > 1.0) {
      ratio = 1.0;
    }
    return Math.floor(714 * ratio);
  }
}
