import { Component, Input, signal } from '@angular/core';
import { ListMultiple } from '../../general/list-multiple/list-multiple';
import { Item } from '../../general/list/list.model';
import { AuthService } from '../../services/auth-service';
import { EmployeeService } from '../../services/employee-service';
import { SiteService } from '../../services/site-service';
import { TeamService } from '../../services/team-service';
import { Employee, IEmployee } from 'scheduler-models/scheduler/employees';
import { Team } from 'scheduler-models/scheduler/teams';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-employee-specialties',
  imports: [
    MatCardModule,
    MatIconModule,
    ListMultiple
  ],
  templateUrl: './employee-specialties.html',
  styleUrl: './employee-specialties.scss',
})
export class EmployeeSpecialties {
  private _employee: string = '';
  @Input()
  get employee(): string {
    return this._employee;
  }
  set employee(id: string) {
    this._employee = id;
    this.setLists();
  }
  availableList = signal<Item[]>([]);
  specialtiesList = signal<Item[]>([]);
  availableToPush: string[] = [];
  specialtyToReturn: string[] = [];

  constructor(
    private authService: AuthService,
    private empService: EmployeeService,
    private siteService: SiteService,
    private teamService: TeamService
  ) {
    if (this.employee === '') {
      const iEmp = this.empService.getEmployee();
      if (iEmp) {
        const emp = new Employee(iEmp);
        this.employee = emp.id;
      }
    }
  }

  setLists() {
    if (this.employee !== '') {
      const available: Item[] = [];
      const specialties: Item[] = [];
      this.availableToPush = [];
      this.specialtyToReturn = [];
      const iTeam = this.teamService.getTeam();
      if (iTeam) {
        const team = new Team(iTeam);
        let found = false;
        team.sites.forEach(site => {
          if (!found && site.employees) {
            site.employees.forEach(iEmp => {
              if (!found) {
                const emp = new Employee(iEmp);
                if (emp.id === this.employee) {
                  found = true;
                  team.specialties.forEach(spec => {
                    let sFound = false;
                    emp.specialties.forEach(esp => {
                      if (esp.specialtyid === spec.id) {
                        sFound = true;
                      }
                    });
                    const item = {
                      id: `${spec.id}`,
                      value: spec.name
                    };
                    if (!sFound) {
                      available.push(item);
                    } else {
                      specialties.push(item);
                    }
                  })
                }
              }
            });
          }
        });
      }
      this.availableList.set(available);
      this.specialtiesList.set(specialties);
    }
  }

  onSelectAvailable(item: string) {
    let found = -1;
    this.availableToPush.forEach((i, pos) => {
      if (i === item) {
        found = pos;
      }
    });
    if (found < 0) {
      this.availableToPush.push(item);
    } else {
      this.availableToPush.splice(found, 1);
    }
  }

  onSelectSpecialty(item: string) {
    let found = -1;
    this.specialtyToReturn.forEach((i, pos) => {
      if (i === item) {
        found = pos;
      }
    });
    if (found < 0) {
      this.specialtyToReturn.push(item);
    } else {
      this.specialtyToReturn.splice(found, 1);
    }
  }

  onSend() {
    this.updateSpecialties('add');
  }

  onReturn() {
    this.updateSpecialties('delete');
  }

  updateSpecialties(direction: string) {
    const specialties: number[] = [];
    if (direction.toLowerCase() === 'add') {
      this.availableToPush.forEach(item => {
        specialties.push(Number(item));
      })
    } else {
      this.specialtyToReturn.forEach(item => {
        specialties.push(Number(item))
      });
    }
    this.empService.updateSpecialties(this.employee, direction, specialties).subscribe({
      next: (res) => {
        const iEmp = (res.body as IEmployee);
        if (iEmp) {
          const employee = new Employee(iEmp);
          const tEmp = this.empService.getEmployee();
          if (tEmp && tEmp.id === employee.id) {
            this.empService.setEmployee(employee);
          }
          const tSite = this.siteService.getSite();
          let found = false;
          if (tSite && tSite.employees) {
            tSite.employees.forEach((emp, e) => {
              if (!found && emp.id === employee.id && tSite.employees) {
                tSite.employees[e] = new Employee(employee);
                found = true;
                this.siteService.setSite(tSite);
              }
            });
          }
          found = false;
          const tTeam = this.teamService.getTeam();
          if (tTeam) {
            tTeam.sites.forEach((site, s) => {
              if (!found && site.employees) {
                site.employees.forEach((emp, e) => {
                  if (!found && emp.id === employee.id && site.employees) {
                    site.employees[e] = new Employee(employee);
                    found = true;
                    this.teamService.setTeam(tTeam);
                  }
                });
              }
            });
          }
          this.setLists();
        }
      },
      error: (err) => {
        if (err instanceof HttpErrorResponse) {
          if (err.status >= 400 && err.status < 500) {
            this.authService.statusMessage.set(`${err.status} - ${err.error.message}`)
          }
        }
      }
    });
  }
}
