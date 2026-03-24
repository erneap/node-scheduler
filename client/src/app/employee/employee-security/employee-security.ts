import { Component, Input } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PasswordStrengthValidator } from '../../models/validators/password-strength-validator.directive';
import { MustMatchValidator } from '../../models/validators/must-match-validator.directive';
import { SecurityQuestion } from 'scheduler-models/users';
import { TeamService } from '../../services/team-service';
import { MatSelectModule } from '@angular/material/select';
import { EmployeeService } from '../../services/employee-service';
import { Employee, IEmployee } from 'scheduler-models/scheduler/employees';
import { AuthService } from '../../services/auth-service';
import { SiteService } from '../../services/site-service';
import { item } from '../../general/list/list.model';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-employee-security',
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    ReactiveFormsModule
  ],
  templateUrl: './employee-security.html',
  styleUrl: './employee-security.scss',
})
export class EmployeeSecurity {
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
  questions: SecurityQuestion[];

  constructor(
    private authService: AuthService,
    private empService: EmployeeService,
    private siteService: SiteService,
    private teamService: TeamService,
    private builder: FormBuilder
  ) {
    this.profileForm = this.builder.group({
      password: ['', [new PasswordStrengthValidator()]],
      password2: ['', [new MustMatchValidator()]],
      question1: ['', [Validators.required]],
      answer1: '',
      question2: ['', [Validators.required]],
      answer2: '',
      question3: ['', [Validators.required]],
      answer3: ''
    });
    this.questions = this.teamService.getQuestions();
    console.log(this.employee);
    if (this.employee === '') {
      const iEmp = this.empService.getEmployee();
      if (iEmp) {
        const emp = new Employee(iEmp);
        console.log(emp.id);
        this.employee = emp.id;
      }
    }
  }

  setEmployee() {
    if (this.employee !== '') {
      const team = this.teamService.getTeam();
      if (team) {
        let found = false;
        team.sites.forEach(site => {
          if (!found && site.employees) {
            site.employees.forEach(emp => {
              if (!found && emp.id === this.employee) {
                console.log(emp.user);
                found = true;
                if (emp.user && emp.user.questions) {
                  console.log(emp.user.lastName);
                  emp.user.questions.sort((a,b) => a.compareTo(b));
                  emp.user.questions.forEach(quest => {
                    console.log(JSON.stringify(quest));
                    switch (quest.id) {
                      case 1:
                        this.profileForm.get('question1')?.setValue(quest.question);
                        break;
                      case 2:
                        this.profileForm.get('question2')?.setValue(quest.question);
                        break;
                      case 3:
                        this.profileForm.get('question3')?.setValue(quest.question);
                        break;
                    }
                  });
                }
              }
            });
          }
        });
      }
    }
  }

  getPasswordError(): string {
    let answer: string = ''
    if (this.profileForm.get('password')?.hasError('required')) {
      answer = "Required";
    }
    if (this.profileForm.get('password')?.hasError('passwordStrength')) {
      if (answer !== '') {
        answer += ', ';
      }
      answer += "Minimum(s)";
    }
    return answer;
  }

  getVerifyError(): string {
    let answer: string = ''
    if (this.profileForm.get('password2')?.hasError('required')) {
      answer = "Required";
    }
    if (this.profileForm.get('password2')?.hasError('matching')) {
      if (answer !== '') {
        answer += ', ';
      }
      answer += "Doesn't match";
    }
    return answer;
  }

  updateSecurityQuestion(field: string, id: number) {
    let value = '';
    if (field.substring(0,1).toLowerCase() === 'q') {
      field = `question${id}`;
      value = this.profileForm.get(field)?.value;
      field = 'securityquestion';
    } else {
      field = `answer${id}`;
      value = this.profileForm.controls[field].value;
      field = 'securityanswer';
    }
    this.updateEmployee(field, value, (id-1).toString());
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
}
