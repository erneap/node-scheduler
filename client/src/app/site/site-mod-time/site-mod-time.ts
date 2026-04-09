import { Component, signal } from '@angular/core';
import { EmployeeService } from '../../services/employee-service';
import { SiteService } from '../../services/site-service';
import { TeamService } from '../../services/team-service';
import { Team } from 'scheduler-models/scheduler/teams';
import { MonthPeriod, WeekPeriod } from './site-mod-time.models';
import { Employee } from 'scheduler-models/scheduler/employees';
import { Site } from 'scheduler-models/scheduler/sites';

@Component({
  selector: 'app-site-mod-time',
  imports: [],
  templateUrl: './site-mod-time.html',
  styleUrl: './site-mod-time.scss',
})
export class SiteModTime {
  months = signal<MonthPeriod[]>([]);
  employees = signal<Employee[]>([]);
  start = signal<Date>(new Date());
  end = signal<Date>(new Date());

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
      period.weeks.sort((a,b) => a.compareTo(b));
      start = new Date(start.getTime() + (7 * 24 * 3600000));
    }
    months.sort((a,b) => a.compareTo(b));
    this.months.set(months);
    this.start.set(modstart);
    this.end.set(modend);
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
}
