import { Component, Input } from '@angular/core';
import { LeaveGroup, LeaveMonth } from './employee-leaves-chart-other-month/employee-leaves-chart-other-month.models';
import { EmployeeService } from '../../../../services/employee-service';
import { TeamService } from '../../../../services/team-service';
import { EmployeeLeavesChartOtherMonth } from './employee-leaves-chart-other-month/employee-leaves-chart-other-month';

@Component({
  selector: 'app-employee-leaves-chart-other',
  imports: [
    EmployeeLeavesChartOtherMonth
  ],
  templateUrl: './employee-leaves-chart-other.html',
  styleUrl: './employee-leaves-chart-other.scss',
})
export class EmployeeLeavesChartOther {
  private _year: number = 0;
  private _employee: string = '';
  @Input()
  get year(): number {
    return this._year;
  }
  set year(yr: number) {
    this._year = yr;
    this.setEmployeeYear();
  }
  @Input()
  get employee(): string {
    return this._employee;
  }
  set employee(id: string) {
    this._employee = id;
    this.setEmployeeYear();
  }
  leaveMonths: LeaveMonth[];
  actual: number = 0;
  requested: number = 0;
  annual: number = 0;
  carryover: number = 0;
  balance: number = 0;
  balanceClass: string = 'balancepos';

  constructor(
    private empService: EmployeeService,
    private teamService: TeamService
  ) {
    this.leaveMonths = [];
    if (this.year === 0) {
      const now = new Date();
      this.year = now.getFullYear();
    }
    if (this.employee === '') {
      const emp = this.empService.getEmployee();
      if (emp) {
        this.employee = emp.id;
      }
    }
  }

  setEmployeeYear() {
    this.leaveMonths = [];
    this.actual = 0.0;
    this.requested = 0.0;
    this.annual = 0.0;
    this.carryover = 0.0;
    this.balance = 0.0;

    if (this.employee !== '' && this.year !== 0) {
      // find the employee in the team's sites' employees
      const team =  this.teamService.getTeam();
      if (team) {
        team.sites.forEach(site => {
          if (this.leaveMonths.length === 0 && site.employees) {
            site.employees.forEach(emp => {
              if (this.leaveMonths.length === 0 && emp.id === this.employee) {
                // when the employee is found, create the leave months for display
                for (let m=0; m < 12; m++) {
                  const month = new LeaveMonth();
                  month.month = new Date(Date.UTC(this.year, m, 1));
                  const endMonth = new Date(Date.UTC(this.year, m+1, 1));
                  month.active = emp.isActiveBetween(month.month, endMonth);
                  this.leaveMonths.push(month);
                }
                // go through the employee's leaves to find all the leaves that aren't 
                // holidays and are in the year.
                emp.leaves.sort((a,b) => a.compareTo(b));
                emp.leaves.forEach(lv => {
                  if (lv.code.toLowerCase() !== 'h'
                    && lv.leavedate.getUTCFullYear() === this.year) {
                    // if not holiday and in year.  find the appropriate leave month
                    // and add it to the month's leave groups.
                    this.leaveMonths.forEach(lm => {
                      if (lm.month.getUTCMonth() === lv.leavedate.getUTCMonth()) {
                        if (lm.leaveGroups.length > 0) {
                          let added = false;
                          for (let g = 0; g < lm.leaveGroups.length && !added; g++) {
                            const lg = lm.leaveGroups[g];
                            if (lg.addToThisGroup(lv)) {
                              lg.addLeave(lv);
                              lm.leaveGroups[g] = lg;
                              added = true;
                            }
                          }
                          if (!added) {
                            const lg = new LeaveGroup();
                            lg.addLeave(lv);
                            lm.leaveGroups.push(lg);
                          }
                        } else {
                          const lg = new LeaveGroup();
                          lg.addLeave(lv);
                          lm.leaveGroups.push(lg);
                        }
                      }
                    });
                    if (lv.code.toLowerCase() === 'v') {
                      if (lv.status.toLowerCase() === 'actual') {
                        this.actual += lv.hours;
                      } else {
                        this.requested += lv.hours;
                      }
                    }
                  }
                });
                this.annual = 0;
                this.carryover = 0;
                emp.balances.sort((a,b) => a.compareTo(b));
                emp.balances.forEach(bal => {
                  if (bal.year === this.year) {
                    this.annual = bal.annual;
                    this.carryover = bal.carryover;
                    this.balance = (this.annual + this.carryover) 
                      - (this.actual + this.requested);
                    if (this.balance < 0) {
                      this.balanceClass = "balanceneg";
                    }
                  }
                });
                if (this.annual === 0.0) {
                  if (emp.balances.length > 0) {
                    const lastYear = emp.balances[emp.balances.length - 1].year
                    const lastBalance = emp.balances[emp.balances.length - 1].annual;
                    let lastCarry = emp.balances[emp.balances.length - 1].carryover;
                    let total = lastBalance + lastCarry;
                    emp.leaves.forEach(lv => {
                      if (lv.code.toLowerCase() === 'v' 
                        && lv.leavedate.getUTCFullYear() === lastYear) {
                        total -= lv.hours;
                      }
                    });
                    if (total > 40.0) { 
                      total = 40.0;
                    }
                    this.annual = lastBalance;
                    this.carryover = total;
                    this.balance = (this.annual + this.carryover)
                      - (this.actual + this.requested);
                  }
                }
              }
            });
          }
        });
      }
    }
  }
}
