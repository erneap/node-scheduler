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
import { Employee } from 'scheduler-models/scheduler/employees';

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
    private empService: EmployeeService,
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
                        this.profileForm.controls['question1'].setValue(quest.question);
                        break;
                      case 2:
                        this.profileForm.controls['question2'].setValue(quest.question);
                        break;
                      case 3:
                        this.profileForm.controls['question3'].setValue(quest.question);
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
}
