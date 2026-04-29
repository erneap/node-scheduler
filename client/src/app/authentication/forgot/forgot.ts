import { Component, signal } from '@angular/core';
import { email, form, FormField, required } from '@angular/forms/signals';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { IUser, User } from 'scheduler-models/users';
import { HttpErrorResponse } from '@angular/common/http';

interface ForgotEmailData {
  email: string;
  forgotType: string;
}

@Component({
  selector: 'app-forgot',
  imports: [
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    RouterOutlet
  ],
  templateUrl: './forgot.html',
  styleUrl: './forgot.scss',
})
export class Forgot {
  forgotModel = signal<ForgotEmailData>({
    email: '',
    forgotType: 'email',
  })
  forgotForm = form(this.forgotModel, (s) => {
    required(s.email, { message: 'required'});
    email(s.email, { message: 'must be in email format'});
  });
  showChoice = signal<boolean>(false);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onChange() {
    if (this.forgotForm().valid()) {
      this.authService.forgotEmail.set(this.forgotForm.email().value());
      this.authService.forgotUser(this.forgotForm.email().value()).subscribe({
        next: (res) => {
          const iuser = res.body as IUser;
          if (iuser) {
            const user = new User(iuser);
            this.showChoice.set(user.questions.length > 0);
          } else {
            this.showChoice.set(false);
          }
        }, error: (err) => {
          this.showChoice.set(false);
          if (err instanceof HttpErrorResponse) {
            if (err.status >= 400 && err.status < 500) {
              this.authService.statusMessage.set(`${err.status} - ${err.error.message}`)
            }
          }
        }
      });
    }
  }

  chooseType(ftype: string) {
    console.log(ftype);
    if (ftype.toLowerCase() === 'question') {
      this.router.navigate(['/reset/question']);
    } else {
      this.router.navigate(['/reset/email']);
    }
  }
}
