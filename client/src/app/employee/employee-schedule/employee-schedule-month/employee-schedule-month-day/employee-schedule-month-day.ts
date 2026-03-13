import { Component, input, OnInit, signal } from '@angular/core';
import { Workday } from 'scheduler-node-models/scheduler/employees';
import { SiteService } from '../../../../services/site-service';
import { TeamService } from '../../../../services/team-service';

@Component({
  selector: 'app-employee-schedule-month-day',
  imports: [],
  templateUrl: './employee-schedule-month-day.html',
  styleUrl: './employee-schedule-month-day.scss',
})
export class EmployeeScheduleMonthDay implements OnInit {
  workday = input.required<Workday>();
  month = input.required<Date>();
  dateClass = signal('');
  cellStyle = signal('');

  constructor(
    private siteService: SiteService,
    private teamService: TeamService
  ) { }

  ngOnInit(): void {
    let bkColor = 'ffffff';
    let txColor = '000000';
    if (this.workday()) {
      if (this.workday().code !== '' && this.workday().hours > 0) {
        if (this.teamService.team()) {
          let found = false;
          this.teamService.team().workcodes.forEach(wc => {
            if (!found && wc.id.toLowerCase() === this.workday().code.toLowerCase()) {
              found = true;
              bkColor = wc.backcolor;
              txColor = wc.textcolor;
              if (bkColor.toLowerCase() === 'ffffff'
                && this.workday().date?.getUTCMonth() !== this.month().getUTCMonth()) {
                bkColor = 'C0C0C0';
                txColor = '000000';
              }
            }
          });
        } else if (this.workday().date?.getUTCMonth() !== this.month().getUTCMonth()) {
          bkColor = 'C0C0C0';
          txColor = '000000';
        } else {
          bkColor = 'ffffff';
          txColor = '000000';
        }
      }
      const today = new Date();
      let classes = 'dayOfMonth ';
      if (this.workday().date) {
        if (today.getFullYear() === this.workday().date?.getUTCFullYear()
          && today.getMonth() === this.workday().date?.getUTCMonth()
          && today.getDate() === this.workday().date?.getUTCDate()) {
          classes += 'today';
        } else if (this.workday().date?.getUTCDay() === 0
          || this.workday().date?.getUTCDay() === 6) {
          classes += 'weekend';
        } else {
          classes += 'weekday';
        }
      }
      this.dateClass.set(classes);
    }
    this.cellStyle.set(`background-color: #${bkColor};color: #${txColor};`);
  }
}
