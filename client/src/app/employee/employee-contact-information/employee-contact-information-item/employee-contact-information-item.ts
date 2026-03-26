import { Component, Input, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { AuthService } from '../../../services/auth-service';
import { EmployeeService } from '../../../services/employee-service';
import { SiteService } from '../../../services/site-service';
import { TeamService } from '../../../services/team-service';
import { Team } from 'scheduler-models/scheduler/teams';
import { Employee, IEmployee } from 'scheduler-models/scheduler/employees';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-employee-contact-information-item',
  imports: [
    ReactiveFormsModule,
    MatInputModule
  ],
  templateUrl: './employee-contact-information-item.html',
  styleUrl: './employee-contact-information-item.scss',
})
export class EmployeeContactInformationItem {
  private _employee: string = '';
  private _contacttype: number = -1;
  @Input()
  get employee(): string {
    return this._employee;
  }
  set employee(id: string) {
    this._employee = id;
    this.setContact();
  }
  @Input()
  get contacttype(): number {
    return this._contacttype;
  }
  set contacttype(id: number) {
    this._contacttype = id;
    this.setContact();
  }
  itemForm: FormGroup;
  typeName = signal<string>('');

  constructor(
    private authService: AuthService,
    private empService: EmployeeService,
    private siteService: SiteService,
    private teamService: TeamService,
    private builder: FormBuilder
  ) {
    this.itemForm = this.builder.group({
      contact: '',
    })
  }

  setContact() {
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      if (this.contacttype >= 0) {
        team.contacttypes.forEach(ct => {
          if (ct.id === this.contacttype) {
            this.typeName.set(ct.name); 
          }
        });
      }
      if (this.employee !== '' && this.contacttype >= 0) {
        this.itemForm.get('contact')?.setValue('');
        let found = false;
        team.sites.forEach(site => {
          if (!found && site.employees) {
            site.employees.forEach(iEmp => {
              if (!found) {
                const emp = new Employee(iEmp);
                if (emp.id === this.employee) {
                  emp.contactinfo.forEach(ci => {
                    if (ci.typeid === this.contacttype) {
                      this.itemForm.get('contact')?.setValue(ci.value);
                    }
                  });
                  found = true;
                }
              }
            })
          }
        });
      }
    }
  }

  onChange() {
    const sValue = this.itemForm.get('contact')?.value;
    this.empService.updateContactInformation(this.employee, this.contacttype, sValue)
      .subscribe({
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
