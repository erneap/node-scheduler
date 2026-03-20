import { Component, Input, input } from '@angular/core';
import { Employee, IEmployee, Leave } from 'scheduler-models/scheduler/employees';
import { Holiday } from 'scheduler-models/scheduler/teams/company';
import { TeamService } from '../../../../services/team-service';
import { EmployeeService } from '../../../../services/employee-service';

@Component({
  selector: 'app-employee-leaves-chart-holidays',
  imports: [],
  templateUrl: './employee-leaves-chart-holidays.html',
  styleUrl: './employee-leaves-chart-holidays.scss',
})
export class EmployeeLeavesChartHolidays {
  year = input<number>();
  private employeeID = '';
  @Input()
  get employeeid(): string {
    return this.employeeID;
  }
  set employeeid(value: string) {
    this.employeeID = value;
    this.setEmployee();
  }
  holidays: Holiday[];

  constructor(
    private empService: EmployeeService,
    private teamService: TeamService
  ) {
    this.holidays = [];
    const emp = this.empService.getEmployee();
    if (emp) {
      this.employeeID = emp.id;
    }
  }

  setEmployee() {
    if (this.employeeID !== '') {
      let employee: Employee | undefined;
      let company: string = '';
      const team = this.teamService.getTeam();
      if (team) {
        team.sites.forEach(site => {
          if (site.employees) {
            site.employees.forEach(emp => {
              if (emp.id === this.employeeID) {
                employee = new Employee(emp);
                company = emp.companyinfo.company;
              }
            })
          }
        });
        this.holidays = [];
        team.companies.forEach(co => {
          if (co.id.toLowerCase() === company.toLowerCase()) {
            co.holidays.forEach(hol => {
              const holiday = new Holiday(hol);
              holiday.leaves = [];
              this.holidays.push(holiday);
            });
          }
        });
        this.holidays.sort((a,b) => a.compareTo(b));
      }
      if (employee && this.holidays.length > 0) {
        const leaves: Leave[] = [];
        employee.leaves.forEach(lv => {
          if (lv.code.toLowerCase() === 'h'
            && lv.leavedate.getFullYear() === this.year()) {
            leaves.push(new Leave(lv));
          }
        });
        leaves.sort((a,b) => a.compareTo(b));
        leaves.forEach((lv, l) => {
          if (lv.tagday) {
            this.holidays.forEach((hol, h) => {
              if (lv.tagday && hol.toString().toLowerCase() === lv.tagday?.toLowerCase()) {
                if (hol.leaves) {
                  hol.leaves.push(new Leave(lv));
                }
                this.holidays[h] = hol;
                lv.used = true;
                leaves[l] = lv;
              }
            });
          }
        });
        leaves.forEach((lv, l) => {
          if (!lv.used) {
            this.holidays.forEach((hol, h) => {
              if (!lv.used && hol.leaves && hol.getLeaveTotals() + lv.hours <= 8.0) {
                hol.leaves.push(new Leave(lv));
                lv.used = true;
                leaves[l] = lv;
                this.holidays[h] = hol;
              }
              this.holidays[h] = hol;
            });
          }
        });
        const holiday = this.holidays[this.holidays.length - 1];
        leaves.forEach(lv => {
          if (!lv.used && holiday.leaves) {
            holiday.leaves.push(new Leave(lv));
          }
        });
        this.holidays[this.holidays.length - 1] = holiday;
      }
    }
  }
}
