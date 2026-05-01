import { Component, Input, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SecurityQuestion } from 'scheduler-models/users';
import { AuthService } from '../../../services/auth-service';
import { EmployeeService } from '../../../services/employee-service';
import { SiteService } from '../../../services/site-service';
import { TeamService } from '../../../services/team-service';
import { PasswordStrengthValidator } from '../../../models/validators/password-strength-validator.directive';
import { MustMatchValidator } from '../../../models/validators/must-match-validator.directive';
import { Employee, IEmployee } from 'scheduler-models/scheduler/employees';
import { HttpErrorResponse } from '@angular/common/http';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-employee-security-editor',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    ReactiveFormsModule
  ],
  templateUrl: './employee-security-editor.html',
  styleUrl: './employee-security-editor.scss',
})
export class EmployeeSecurityEditor {
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
  questionForm: FormGroup;
  questions: SecurityQuestion[];
  minimumLengthStyle = signal<string>('background-color: red;');
  minimumLowerStyle = signal<string>('background-color: red;');
  minimumUpperStyle = signal<string>('background-color: red;');
  minimumNumberStyle = signal<string>('background-color: red;');
  minimumSpecialStyle = signal<string>('background-color: red;');
  mustMatchStyle = signal<string>('background-color: red;');
  passwordValid = signal<boolean>(false);

  constructor(
    private authService: AuthService,
    private empService: EmployeeService,
    private siteService: SiteService,
    private teamService: TeamService,
    private builder: FormBuilder
  ) {
    this.profileForm = this.builder.group({
      password: ['', [Validators.required, new PasswordStrengthValidator()]],
      password2: ['', [Validators.required, new MustMatchValidator()]],
    });
    this.questionForm = this.builder.group({
      question1: ['', [Validators.required]],
      answer1: '',
      question2: ['', [Validators.required]],
      answer2: '',
      question3: ['', [Validators.required]],
      answer3: ''
    });
    this.questions = this.teamService.getQuestions();
    if (this.employee === '') {
      const iEmp = this.empService.getEmployee();
      if (iEmp) {
        const emp = new Employee(iEmp);
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
                found = true;
                if (emp.user && emp.user.questions) {
                  emp.user.questions.sort((a,b) => a.compareTo(b));
                  emp.user.questions.forEach(quest => {
                    switch (quest.id) {
                      case 1:
                        this.questionForm.get('question1')?.setValue(quest.question);
                        if (quest.answer !== '') {
                          this.questionForm.get('answer1')?.setValue('ANSWERED')
                        } else {
                          this.questionForm.get('answer1')?.setValue('');
                        }
                        break;
                      case 2:
                        this.questionForm.get('question2')?.setValue(quest.question);
                        if (quest.answer !== '') {
                          this.questionForm.get('answer2')?.setValue('ANSWERED')
                        } else {
                          this.questionForm.get('answer2')?.setValue('');
                        }
                        break;
                      case 3:
                        this.questionForm.get('question3')?.setValue(quest.question);
                        if (quest.answer !== '') {
                          this.questionForm.get('answer3')?.setValue('ANSWERED')
                        } else {
                          this.questionForm.get('answer3')?.setValue('');
                        }
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

  checkPasswords() {
    const passwd1 = this.profileForm.get('password')?.value;
    const passwd2 = this.profileForm.get('password2')?.value;
    const hasMinimum = (passwd1.length >= 10);
    let upper = 0;
    let lower = 0;
    let numeric = 0;
    let special = 0;
    let upperRE = new RegExp("[A-Z]");
    let lowerRE = new RegExp("[a-z]");
    let numericRE = new RegExp("[0-9]");
    let password = passwd1;
    for (var i=0; i < password.length; i++) {
        let ch = password.substring(i, i+1);
        if (upperRE.test(ch)) {
            upper++;
        } else if (lowerRE.test(ch)) {
            lower++;
        } else if (numericRE.test(ch)) {
            numeric++;
        } else {
            special++;
        }
    }
    if (hasMinimum) {
      this.minimumLengthStyle.set('background-color: green;');
    } else {
      this.minimumLengthStyle.set('background-color: red;');
    }
    if (lower > 1) {
      this.minimumLowerStyle.set('background-color: green;');
    } else {
      this.minimumLowerStyle.set('background-color: red;');
    }
    if (upper > 1) {
      this.minimumUpperStyle.set('background-color: green;');
    } else {
      this.minimumUpperStyle.set('background-color: red;');
    }
    if (numeric > 1) {
      this.minimumNumberStyle.set('background-color: green;');
    } else {
      this.minimumNumberStyle.set('background-color: red;');
    }
    if (special > 1) {
      this.minimumSpecialStyle.set('background-color: green;');
    } else {
      this.minimumSpecialStyle.set('background-color: red;');
    }
    if (passwd1.length > 0 && passwd1 === passwd2) {
      this.mustMatchStyle.set('background-color: green;');
    } else {
      this.mustMatchStyle.set('background-color: red;');
    }
    this.passwordValid.set(hasMinimum && lower > 1 && upper > 1 && numeric > 1 
      && passwd1 === passwd2);
  }

  changePassword() {
    let value = this.profileForm.get('password')?.value;
    if (value !== '') {
      this.updateEmployee('password', value);
    }
  }

  updateSecurityQuestion(field: string, id: number) {
    let value = '';
    if (field.substring(0,1).toLowerCase() === 'q') {
      field = `question${id}`;
      value = this.questionForm.get(field)?.value;
      field = 'securityquestion';
    } else {
      field = `answer${id}`;
      value = this.questionForm.controls[field].value;
      field = 'securityanswer';
    }
    this.updateEmployee(field, value, `${id-1}`);
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
  }}
