import { Component, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { SecurityQuestionData } from '../forgot-question/forgot-question';
import { AuthService } from '../../../services/auth-service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-forgot-email',
  imports: [
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './forgot-email.html',
  styleUrl: './forgot-email.scss',
})
export class ForgotEmail {
  msgSent = signal<boolean>(false);
  question = signal<string>('');
  questionModel = signal<SecurityQuestionData>({
    email: '',
    questionid: -1,
    answer: '',
    password1: '',
    password2: ''
  });
  questionForm = form(this.questionModel, (s) => {
    required(s.answer);
  });
  passwordValid = signal<boolean>(false);
  minimumLengthStyle = signal<string>('background-color: red;');
  minimumLowerStyle = signal<string>('background-color: red;');
  minimumUpperStyle = signal<string>('background-color: red;');
  minimumNumberStyle = signal<string>('background-color: red;');
  minimumSpecialStyle = signal<string>('background-color: red;');
  mustMatchStyle = signal<string>('background-color: red;');

  constructor(
    public authService: AuthService,
    private router: Router
  ) {  }

  checkPasswords() {
    const passwd1 = this.questionForm.password1().value();
    const passwd2 = this.questionForm.password2().value();
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

  onSendEmail() {
    this.authService.startEmailReset(this.authService.forgotEmail()).subscribe({
      next: (res) => {
        this.msgSent.set(true);
        this.questionForm.email().value.set(this.authService.forgotEmail());
        this.questionForm.answer().value.set('');
        this.questionForm.password1().value.set('');
        this.questionForm.password2().value.set('');
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

  onSubmit() {
    if (this.questionForm().valid() && this.passwordValid()) {
      this.authService.answerEmailReset(this.questionForm.email().value(),
        this.questionForm.answer().value(),
        this.questionForm.password1().value()).subscribe({
        next: (res) => {
          this.router.navigate(['/reset/complete'])
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
}
