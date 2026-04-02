import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../../services/auth-service';
import { EmployeeService } from '../../../services/employee-service';
import { SiteService } from '../../../services/site-service';
import { TeamService } from '../../../services/team-service';
import { Employee, IEmployee } from 'scheduler-models/scheduler/employees';
import { HttpErrorResponse } from '@angular/common/http';
import { Company } from 'scheduler-models/scheduler/teams/company';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-employee-company-editor',
  imports: [
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    ReactiveFormsModule
  ],
  templateUrl: './employee-company-editor.html',
  styleUrl: './employee-company-editor.scss',
})
export class EmployeeCompanyEditor {
  private _employee: string = '';
  @Input()
  get employee(): string {
    return this._employee;
  }
  set employee(id: string) {
    this._employee = id;
    this.setEmployee();
  }
  profileForm: FormGroup;

  constructor(
    private authService: AuthService,
    private empService: EmployeeService,
    private siteService: SiteService,
    private teamService: TeamService,
    private builder: FormBuilder
  ) {
    this.profileForm = this.builder.group({
      company: ['', [Validators.required]],
      employeeid: ['', [Validators.required]],
      alternateid: '',
      jobtitle: '',
      rank: '',
      costcenter: '',
      division: ''
    });
    if (this.employee === '') {
      const emp = this.empService.getEmployee();
      if (emp) {
        this.employee = emp.id;
      }
    }
  }

  /**
   * This method will establish the data to the editing form.
   * STEPS:
   * 1) Get the team the employee belongs to.
   * 2) Step through the sites/employees to find the employee with the identifier.
   * 3) Set the profile form with the user name and company information.
   */
  setEmployee() {
    if (this.employee !== '') {
      const team = this.teamService.getTeam();
      if (team) {
        let found = false;
        team.sites.forEach(site => {
          if (!found && site.employees) {
            site.employees.forEach(emp => {
              if (!found && emp.id === this.employee) {
                found = true;
                this.profileForm.controls['company'].setValue(emp.companyinfo.company);
                this.profileForm.controls['employeeid'].setValue(
                  emp.companyinfo.employeeid);
                if (emp.companyinfo.alternateid) {
                  this.profileForm.controls['alternateid'].setValue(
                    emp.companyinfo.alternateid);
                } else {
                  this.profileForm.controls['alternateid'].setValue('');
                }
                if (emp.companyinfo.jobtitle) {
                  this.profileForm.controls['jobtitle'].setValue(
                    emp.companyinfo.jobtitle);
                } else {
                  this.profileForm.controls['jobtitle'].setValue('');
                }
                if (emp.companyinfo.rank) {
                  this.profileForm.controls['rank'].setValue(
                    emp.companyinfo.rank);
                } else {
                  this.profileForm.controls['rank'].setValue('');
                }
                if (emp.companyinfo.costcenter) {
                  this.profileForm.controls['costcenter'].setValue(
                    emp.companyinfo.costcenter);
                } else {
                  this.profileForm.controls['costcenter'].setValue('');
                }
                if (emp.companyinfo.division) {
                  this.profileForm.controls['division'].setValue(
                    emp.companyinfo.division);
                } else {
                  this.profileForm.controls['division'].setValue('');
                }
              }
            });
          }
        });
      }
    }
  }

  updateUserField(field: string) {
    let value: string = '';
    let id = "";
    switch(field.toLowerCase()) {
      case "company":
        value = this.profileForm.value.company;
        break;
      case "employeeid":
        value = this.profileForm.value.employeeid;
        break;
      case "alternateid":
        value = this.profileForm.value.alternateid;
        break;
      case "jobtitle":
        value = this.profileForm.value.jobtitle;
        break;
      case "rank":
        value = this.profileForm.value.rank;
        break;
      case "costcenter":
        value = this.profileForm.value.costcenter;
        break;
      case "division":
        value = this.profileForm.value.division;
        break;
      default:
        return;
    }
    this.empService.updateEmployee(this.employee, field, value).subscribe({
      next: res => {
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
          const user = this.authService.getUser();
          if (user && user.id === employee.id) {
            this.authService.setUser(employee.user);
          }
        }
      },
      error: err => {
        console.log(err);
        if (err instanceof HttpErrorResponse) {
          if (err.status >= 400 && err.status < 500) {
            this.authService.statusMessage.set(`${err.status} - ${err.error.message}`)
          }
        }
      }
    })
  }

  getTeamCompanies(): Company[] {
    const answer: Company[] = [];
    const team = this.teamService.getTeam();
    if (team && team.companies) {
      team.companies.forEach(co => {
        answer.push(new Company(co));
      });
      answer.sort((a,b) => a.compareTo(b));
    }
    return answer;
  }}
