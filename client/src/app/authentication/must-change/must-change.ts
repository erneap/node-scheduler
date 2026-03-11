import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth-service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { IUser, User } from 'scheduler-node-models/users';
import { PasswordStrengthValidator } from '../../models/validators/password-strength-validator.directive';
import { MustMatchValidator } from '../../models/validators/must-match-validator.directive';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-must-change',
  imports: [
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    ReactiveFormsModule
  ],
  templateUrl: './must-change.html',
  styleUrl: './must-change.scss',
})
export class MustChange {
  private _snackbar = inject(MatSnackBar);
  loginForm: FormGroup;

  constructor(
    public authService: AuthService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {
    this.loginForm = this.formBuilder.group({
      oldpwd: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(30),
      ]],
      password: ['',[
        new PasswordStrengthValidator()
      ]],
      password2: ['',[
        new MustMatchValidator()
      ]]
    });
    // check to ensure that a user is available in storage, if not, go to login
    // if present, check for must change, if not, go to first page.
    if (this.authService.getUser().id === '') {
      this.router.navigate(['/login']);
    } else {
      const now = new Date();
      const days = (now.getTime() - this.authService.getUser().passwordExpires.getTime()) 
        / (24 * 3600000);
      if (this.authService.getUser().badAttempts >= 0 && days <= 180) {
        this.authService.isAuthenticated.set(true);
      }
    }
  }

  getPasswordError(): string {
    let answer: string = ''
    if (this.loginForm.get('password')?.hasError('required')) {
      answer = "Required";
    }
    if (this.loginForm.get('password')?.hasError('passwordStrength')) {
      if (answer !== '') {
        answer += ', ';
      }
      answer += "Minimum(s)";
    }
    return answer;
  }

  getVerifyError(): string {
    let answer: string = ''
    if (this.loginForm.get('password2')?.hasError('required')) {
      answer = "Required";
    }
    if (this.loginForm.get('password2')?.hasError('matching')) {
      if (answer !== '') {
        answer += ', ';
      }
      answer += "Doesn't match";
    }
    return answer;
  }

  change() {
    if (this.loginForm.valid) {
      const user = new User(this.authService.getUser());
      const oldpwd = this.loginForm.value.oldpwd;
      const passwd = this.loginForm.value.password;
      if (oldpwd.toLowerCase() === passwd.toLowerCase()) {
        this._snackbar.open("Previous and New Passwords can't match!", 'Close');
      } else {
        this.authService.mustChange(user.id, oldpwd, passwd).subscribe({
          next: (res) => {
            this.authService.statusMessage.set('Password changed');
            const user = new User(res.body as IUser);
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
}
