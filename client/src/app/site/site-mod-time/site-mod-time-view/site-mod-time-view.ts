import { Component, signal } from '@angular/core';
import { MonthPeriod, WeekPeriod } from '../site-mod-time.models';
import { Employee } from 'scheduler-models/scheduler/employees';
import { EmployeeService } from '../../../services/employee-service';
import { SiteService } from '../../../services/site-service';
import { TeamService } from '../../../services/team-service';
import { Team } from 'scheduler-models/scheduler/teams';
import { Site } from 'scheduler-models/scheduler/sites';
import { SiteModTimeMonth } from '../site-mod-time-month/site-mod-time-month';

@Component({
  selector: 'app-site-mod-time-view',
  imports: [
    SiteModTimeMonth
  ],
  templateUrl: './site-mod-time-view.html',
  styleUrl: './site-mod-time-view.scss',
})
export class SiteModTimeView {
  months = signal<MonthPeriod[]>([]);
  employees = signal<Employee[]>([]);
  start = signal<Date>(new Date());
  end = signal<Date>(new Date());
  expandAllText = signal<string>('+');

  formatter = Intl.DateTimeFormat('en-US', {
    year: '2-digit',
    month: '2-digit',
  });

  constructor(
    private empService: EmployeeService,
    private siteService: SiteService,
    private teamService: TeamService
  ) {
    const iEmp = this.empService.getEmployee();
    let company = '';
    if (iEmp) {
      company = iEmp.companyinfo.company;
    }
    const now = new Date();

    let modstart = new Date(0);
    let modend = new Date(0);
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      team.companies.forEach(co => {
        if (co.id.toLowerCase() === company.toLowerCase() && co.modperiods.length > 0) {
          co.modperiods.forEach(mod => {
            if (mod.start.getTime() <= now.getTime() 
              && mod.end.getTime() >= now.getTime()) {
              modstart = new Date(mod.start);
              modend = new Date(mod.end);
            }
          });
        }
      });
    }
    while (modstart.getUTCDay() !== 6) {
      modstart = new Date(modstart.getTime() - (24 * 3600000));
    }
    let start = new Date(modstart);
    while (start.getUTCDay() !== 5) {
      start = new Date(start.getTime() + (24 * 3600000));
    }

    const months: MonthPeriod[] = [];
    let period: MonthPeriod | undefined;
    while (start.getTime() <= modend.getTime() && start.getTime() <= now.getTime()) {
      if (!period || (period && period.month.getTime() < modstart.getTime()) 
        || (period && period.month.getUTCMonth() !== start.getUTCMonth())) {
        period = new MonthPeriod();
        period.month = new Date(start);
        period.expand = (start.getUTCMonth() === now.getUTCMonth() 
          && start.getUTCFullYear() === now.getUTCFullYear());
        months.push(period);
      }
      const week = new WeekPeriod();
      week.start = new Date(start.getTime() - (6 * 24 * 3600000));
      week.end = new Date(start);
      period.weeks.push(week);
      period.weeks.sort((a,b) => b.compareTo(a));
      start = new Date(start.getTime() + (7 * 24 * 3600000));
    }
    months.sort((a,b) => b.compareTo(a));
    this.months.set(months);
    this.start.set(modstart);
    this.end.set(modend);
    this.setEmployees();
  }

  setEmployees() {
    const eList: Employee[] = [];
    const iSite = this.siteService.getSite();
    if (iSite) {
      const site = new Site(iSite);
      if (site.employees) {
        site.employees.forEach(emp => {
          if (emp.hasModTime(this.start(), this.end())) {
            eList.push(new Employee(emp));
          }
        });
      }
    }
    this.employees.set(eList);
  }

  setExpandAll() {
    const tMonths: MonthPeriod[] = []
    if (this.expandAllText().toLowerCase() === '+') {
      this.months().forEach(month => {
        month.expand = true;
        tMonths.push(new MonthPeriod(month));
      });
      this.expandAllText.set('-');
    } else {
      const now = new Date();
      this.months().forEach(month => {
        if (now.getUTCFullYear() === month.month.getUTCFullYear() 
          && now.getUTCMonth() === month.month.getUTCMonth()) {
          month.expand = true;
        } else {
          month.expand = false;
        }

        tMonths.push(new MonthPeriod(month));
      });
      this.expandAllText.set('+');
    }
    tMonths.sort((a,b) => b.compareTo(a));
    this.months.set(tMonths);
  }

  getDataClass(part: string, i: number): string {
    let answer = 'name ';
    answer += ((i % 2) === 0) ? 'even' : 'odd';
    answer += (part.toLowerCase() === 'name') ? 'total' : 'bal';
    return answer;
  }

  dataStyle(field: string): string {
    if (field.toLowerCase() === 'name') {
      return 'width: 200px;';
    }
    return 'width: 50px;';
  }

  getTotalValue(emp: Employee): string {
    if (this.months().length > 0) {
      let total = emp.getModTime( 
        this.months()[this.months().length - 1].startDate(), 
        this.months()[0].endDate());
      return total.toFixed(1);
    }
    return '0.0';
  }

  onChange(chg: string) {
    const parts = chg.toLowerCase().split("|")
    const bExpand = (parts[1] === 'true');
    let totals = 0;
    this.months().forEach(month => {
      if (month.month.getTime() === Number(parts[0])) {
        month.expand = bExpand;
      }
      if (month.expand) {
        totals++;
      }
    });
    if (totals < this.months().length) {
      this.expandAllText.set('+');
    } else {
      this.expandAllText.set('-');
    }
  }
}
