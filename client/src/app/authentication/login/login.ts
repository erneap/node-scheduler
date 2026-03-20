import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth-service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { IUser, SecurityQuestion, User } from 'scheduler-models/users';
import { EmployeeService } from '../../services/employee-service';
import { SiteService } from '../../services/site-service';
import { TeamService } from '../../services/team-service';
import { InitialResponse } from 'scheduler-models/scheduler/web';
import { Employee } from 'scheduler-models/scheduler/employees';
import { Site } from 'scheduler-models/scheduler/sites';
import { Team } from 'scheduler-models/scheduler/teams';
import { NoticeService } from '../../services/notice-service';

@Component({
  selector: 'app-login',
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  loginForm: FormGroup;

  constructor(
    public authService: AuthService,
    public employeeService: EmployeeService,
    public siteService: SiteService,
    public teamService: TeamService,
    private noticeService: NoticeService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(30),
      ]],
    });
  }

  login() {
    if (this.loginForm.valid) {
      const email = this.loginForm.value.email;
      const passwd = this.loginForm.value.password;
      this.authService.login(email, passwd).subscribe({
        next: (res) => {
          this.authService.statusMessage.set('User logged in');
          const user = new User(res.body as IUser);
          let permission = false;
          user.permissions.forEach(perm => {
            if (perm.application.toLowerCase() === 'scheduler') {
              permission = true;
            }
          });
          if (permission) {
            this.authorized();
          } else {
            this.authService.statusMessage.set('No Permission for Application');
            this.router.navigate(['unauthorized']);
          }
        },
        error: (err) => {
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

  authorized() {
    const user = this.authService.getUser();
    this.noticeService.startNotices();
    if (user) {
      this.employeeService.getInitial(user.id).subscribe({
        next: (res) => {
          const initial = (res.body as InitialResponse);
          if (initial) {
            if (initial.employee) {
              this.employeeService.setEmployee(initial.employee);
            }
            if (initial.site) {
              this.siteService.setSite(initial.site);
            }
            if (initial.team) {
              this.teamService.setTeam(initial.team);
            }
            if (initial.questions) {
              this.teamService.questions = [];
              initial.questions.forEach(quest => {
                this.teamService.questions.push(new SecurityQuestion(quest));
              });
              this.teamService.questions.sort((a,b) => a.compareTo(b));
            }
            const now = new Date();
            const pwdAge = (now.getTime() - user.passwordExpires.getTime()) / (24 * 3600000);
            if (user.badAttempts < 0 || pwdAge > 180) {
              // must change actions page
              this.authService.statusMessage.set('User must change password');
              this.router.navigate(['/mustchange']);
            } else {
              this.router.navigate(['/employee/schedule']);
            }
          } else {
            this.authService.statusMessage.set('No initial data provided');
          }
        },
        error: (err) => {
          console.log(err);
          if (err instanceof HttpErrorResponse) {
            if (err.status >= 400 && err.status < 500) {
              this.authService.statusMessage.set(`${err.status} - ${err.error.message}`)
            }
          }
        }
      });
    }
  }
}
