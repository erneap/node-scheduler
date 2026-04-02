import { Component, Input, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltip } from '@angular/material/tooltip';
import { List } from '../../../general/list/list';
import { Item } from '../../../general/list/list.model';
import { AuthService } from '../../../services/auth-service';
import { EmployeeService } from '../../../services/employee-service';
import { SiteService } from '../../../services/site-service';
import { TeamService } from '../../../services/team-service';
import { Employee, IEmployee } from 'scheduler-models/scheduler/employees';
import { HttpErrorResponse } from '@angular/common/http';
import { Company } from 'scheduler-models/scheduler/teams/company';

@Component({
  selector: 'app-employee-profile-editor',
  imports: [
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatTooltip,
    ReactiveFormsModule,
    List,
  ],
  templateUrl: './employee-profile-editor.html',
  styleUrl: './employee-profile-editor.scss',
})
export class EmployeeProfileEditor {
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
  selectedEmail = signal<string>('');
  emailList = signal<Item[]>([]);

  constructor(
    private authService: AuthService,
    private empService: EmployeeService,
    private siteService: SiteService,
    private teamService: TeamService,
    private builder: FormBuilder
  ) {
    this.profileForm = this.builder.group({
      email: ['', [Validators.required, Validators.email]],
      first: ['', [Validators.required]],
      middle: '',
      last: ['', [Validators.required]],
      editor: ['', [Validators.email]]
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
                if (emp.user) {
                  this.profileForm.controls['email'].setValue(emp.user.emailAddress);
                  this.profileForm.controls['first'].setValue(emp.user.firstName);
                  this.profileForm.controls['middle'].setValue(emp.user.middleName);
                  this.profileForm.controls['last'].setValue(emp.user.lastName);
                } else {
                  this.profileForm.controls['email'].setValue(emp.email);
                  this.profileForm.controls['first'].setValue(emp.name.firstname);
                  this.profileForm.controls['middle'].setValue(emp.name.middlename);
                  this.profileForm.controls['last'].setValue(emp.name.lastname);
                }
                let emailList: Item[] = [];
                if (emp.user) {
                  emailList.push({
                    id: emp.user.emailAddress,
                    value: emp.user.emailAddress
                  });
                  if (emp.user.additionalEmails.length > 0) {
                    emp.user.additionalEmails.forEach(em => {
                      emailList.push({
                        id: em,
                        value: em
                      });
                    });
                  }
                }
                this.emailList.set(emailList);
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
      case "email":
        value = this.profileForm.value.email;
        break;
      case "first":
        value = this.profileForm.value.first;
        break;
      case "middle":
        value = this.profileForm.value.middle;
        break;
      case "last":
        value = this.profileForm.value.last;
        break;
      default:
        return;
    }
    this.updateEmployee(field, value);
  }

  updateEmployee(field: string, value: string, optional?: string) {
    this.empService.updateEmployee(this.employee, field, value, optional).subscribe({
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
          if (iEmp.user) {
            const emailList: Item[] = [];
            emailList.push({
              id: iEmp.user.emailAddress,
              value: iEmp.user.emailAddress
            });
            if (iEmp.user.additionalEmails) {
              iEmp.user.additionalEmails.forEach(em => {
                emailList.push({
                  id: em,
                  value: em
                });
              });
            }
            this.emailList.set(emailList);
          }
        }
      },
      error: err => {
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
  }

  setEmailClass(email: string): string {
    let answer = 'item';
    if (email.toLowerCase() === this.selectedEmail().toLowerCase()) {
      answer += " selected";
    }
    return answer;
  }

  selectEmail(email: string) {
    if (email !== 'new') {
      this.selectedEmail.set(email);
      this.profileForm.controls['editor'].setValue(email);
    } else {
      this.selectedEmail.set('');
      this.profileForm.controls['editor'].setValue('');
    }
  }

  onClear() {
    this.selectedEmail.set('');
    this.profileForm.controls['editor'].setValue('');
  }

  async onDelete() {
    const value = this.profileForm.value.editor;
    if (value !== '') {
      this.profileForm.controls['editor'].setValue('');
      this.selectedEmail.set('');
      this.updateEmployee('removeemail', value);
    }
  }

  async onAdd() {
    const value = this.profileForm.value.editor;
    if (value !== '') {
      this.updateEmployee('addemail', value);
    }
  }

  onUpdate() {
    const value = this.profileForm.value.editor;
    if (value !== '' && this.selectedEmail() !== '') {
      this.updateEmployee('updateemail', value, this.selectedEmail());
      this.selectedEmail.set(value);
    } 
  }}
