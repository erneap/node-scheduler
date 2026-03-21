import { Component, Input, input } from '@angular/core';
import { Employee, IEmployee, Leave } from 'scheduler-models/scheduler/employees';
import { Holiday } from 'scheduler-models/scheduler/teams/company';
import { TeamService } from '../../../../services/team-service';
import { EmployeeService } from '../../../../services/employee-service';
import { EmployeeLeavesChartHolidaysHoliday } from './employee-leaves-chart-holidays-holiday/employee-leaves-chart-holidays-holiday';

@Component({
  selector: 'app-employee-leaves-chart-holidays',
  imports: [
    EmployeeLeavesChartHolidaysHoliday
  ],
  templateUrl: './employee-leaves-chart-holidays.html',
  styleUrl: './employee-leaves-chart-holidays.scss',
})
export class EmployeeLeavesChartHolidays {
  private iYear = 0;
  private employeeID = '';
  @Input()
  get year(): number {
    return this.iYear;
  }
  set year(y: number) {
    this.iYear = y;
    this.setEmployee();
  }
  @Input()
  get employee(): string {
    return this.employeeID;
  }
  set employee(value: string) {
    this.employeeID = value;
    this.setEmployee();
  }
  holidays: Holiday[];

  constructor(
    private empService: EmployeeService,
    private teamService: TeamService
  ) {
    this.holidays = [];
    if (this.year === 0) {
      const now = new Date();
      this.year = now.getFullYear();
    }
    const emp = this.empService.getEmployee();
    if (emp) {
      this.employeeID = emp.id;
      this.setEmployee();
    }
  }

  setEmployee() {
    if (this.employeeID !== '' && this.year !== 0) {
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
        this.holidays.forEach((hol, h) => {
          if (employee) {
            hol.active = this.isActive(hol, employee);
          }
          this.holidays[h] = hol;
        })
        const leaves: Leave[] = [];
        employee.leaves.forEach(lv => {
          if (lv.code.toLowerCase() === 'h'
            && lv.leavedate.getFullYear() === this.year) {
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
              if (!lv.used && hol.active && hol.leaves 
                && hol.getLeaveTotals() + lv.hours <= 8.0) {
                hol.leaves.push(new Leave(lv));
                lv.used = true;
                leaves[l] = lv;
                this.holidays[h] = hol;
              }
              this.holidays[h] = hol;
            });
          }
        });
        let holCount = this.holidays.length - 1;
        let holiday: Holiday | undefined = this.holidays[holCount];
        while (holiday && !holiday.active && holCount >= 0) {
          holCount--;
          if (holCount >= 0) {
            holiday = this.holidays[holCount];
          } else {
            holiday = undefined
          }
        }
        leaves.forEach(lv => {
          if (!lv.used && holiday && holiday.leaves) {
            holiday.leaves.push(new Leave(lv));
          }
        });
        if (holiday) {
          this.holidays[holCount] = holiday;
        }
      }
    }
  }

  isActive(holiday: Holiday, employee: Employee): boolean {
    employee.assignments.sort((a,b) => a.compareTo(b));
    const now = new Date();
    let year = this.year;
    if (!year) {
      year = now.getFullYear();
    }
    const actual = holiday.getActual(year)
    const startasgmt = employee.assignments[0];
    const endasgmt = employee.assignments[
      employee.assignments.length - 1];
    if (actual) {
      return (actual.getTime() >= startasgmt.startDate.getTime() &&
        actual.getTime() <= endasgmt.endDate.getTime());
    }
    return true;
  }

  getHolidaysRemaining(): string {
    let total = 0;
    let holidays = 0;
    this.holidays.forEach(hol => {
      if (hol.active) {
        holidays++;
        let holTotal = 0;
        if (hol.leaves) {
          hol.leaves.forEach(lv => {
            if (lv.status.toLowerCase() === 'actual') {
              holTotal += lv.hours;
            };
          })
        }
        if (holTotal >= 8) {
          total++;
        }
      }
    });
    return (holidays - total).toFixed(0);
  }

  getHolidayHoursRemaining(): string {
    let total = 0;
    let holidays = 0;
    this.holidays.forEach(hol => {
      if (hol.active) {
        holidays++;
        if (hol.leaves) {
          hol.leaves.forEach(lv => {
            if (lv.status.toLowerCase() === 'actual') {
              total += lv.hours;
            };
          })
        }
      }
    });
    return ((holidays * 8) - total).toFixed(1);
  }

  getHolidaysHoursTaken(): string {
    let total = 0;
    this.holidays.forEach(hol => {
      if (hol.leaves) {
        hol.leaves.forEach(lv => {
          if (lv.status.toLowerCase() === 'actual') {
            total += lv.hours;
          };
        })
      }
    });
    return total.toFixed(1)
  }
}
