import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatButton } from '@angular/material/button';
import { AuthService } from '../../services/auth-service';
import { AppStateService } from '../../services/app-state-service';
import { HttpResponse } from '@angular/common/http';
import { IUser } from 'scheduler-node-models/users';
import { MatDialog } from '@angular/material/dialog';
import { DialogService } from '../../services/dialog-service.service';

@Component({
  selector: 'app-login',
  imports: [
    MatCardModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInput,
    MatIcon,
    MatButton
  ],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  loginForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    public authService: AuthService,
    private appState: AppStateService,
    public dialog: MatDialog,
    private dialogService: DialogService
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

  getPageStyle(): string {
    return `height: ${this.appState.viewHeight}px;width: ${this.appState.viewWidth}px;`;
  }

  login() {
    if (this.loginForm.valid) {
      const email = this.loginForm.get('email')?.value as string;
      const passwd = this.loginForm.get('password')?.value as string;
      if (email !== '' && passwd !== '') {
        this.dialogService.showSpinner();
        this.authService.login(email, passwd).subscribe({
          next: (res: HttpResponse<IUser>) => {
            this.dialogService.closeSpinner();
            console.log(res.body);
            this.authService.message.set('Logged In');
          },
          error: (err: any) => {
            this.dialogService.closeSpinner();
            console.log(err);
          }
        });
      }
    } else {
      this.authService.message.set('Login form invalid');
    }
  }
}
