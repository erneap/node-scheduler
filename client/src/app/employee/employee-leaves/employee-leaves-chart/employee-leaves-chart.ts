import { Component, Input, signal } from '@angular/core';
import { EmployeeLeavesChartHolidays } from './employee-leaves-chart-holidays/employee-leaves-chart-holidays';
import { EmployeeLeavesChartOther } from './employee-leaves-chart-other/employee-leaves-chart-other';
import { TeamService } from '../../../services/team-service';

@Component({
  selector: 'app-employee-leaves-chart',
  imports: [
    EmployeeLeavesChartHolidays,
    EmployeeLeavesChartOther
  ],
  templateUrl: './employee-leaves-chart.html',
  styleUrl: './employee-leaves-chart.scss',
})
export class EmployeeLeavesChart {
  public year = signal(0);
  public showHolidays = true;
  private employeeid = '';
  @Input()
  get employee(): string {
    return this.employeeid;
  }
  set employee(id: string) {
    this.employeeid = id;
    this.setShowHolidays();
  }

  constructor(
    private teamService: TeamService
  ) {
    if (this.year() === 0) {
      const now = new Date();
      this.year.set(now.getFullYear());
    }
  }

  updateYear(direction: string) {
    let year = this.year();
    if (direction.substring(0,1).toLowerCase() === 'u') {
      year++;
    } else if (direction.substring(0,1).toLowerCase() === 'd') {
      year--;
    }
    this.year.set(year);
  }

  setShowHolidays(): void {
    const team = this.teamService.getTeam();
    let answer = false;
    if (team && this.employee !== '') {
      team.sites.forEach(site => {
        if (!answer && site.employees) {
          site.employees.forEach(emp => {
            if (!answer && emp.id === this.employee) {
              team.companies.forEach(co => {
                if (!answer && co.id.toLowerCase() === emp.companyinfo.company.toLowerCase()) {
                  answer = co.holidays.length > 0;
                }
              });
            }
          });
        }
      });
    }
    this.showHolidays = answer;
  }

  getWidthStyle(): string {
    let width = 460;
    if (this.showHolidays) {
      width += 460;
    }
    return `width:${width}px;`;
  }
}
