import { Component, signal } from '@angular/core';
import { Permission, User } from 'scheduler-models/users';
import { AuthService } from '../../services/auth-service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AdminService } from '../../services/admin-service';
import { HttpErrorResponse } from '@angular/common/http';
import { form, FormField } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ConfirmationDialog } from '../../general/confirmation-dialog/confirmation-dialog';

interface PasswordData {
  password1: string;
  password2: string;
}

@Component({
  selector: 'app-admin-accounts',
  imports: [
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
  templateUrl: './admin-accounts.html',
  styleUrl: './admin-accounts.scss',
})
export class AdminAccounts {
  accounts = signal<User[]>([]);
  permissions = signal<Permission[]>([]);
  passwordModel = signal<PasswordData>({
    password1: '',
    password2: '',
  });
  passwordForm = form(this.passwordModel);
  minimumLengthStyle = signal<string>('background-color: red;');
  minimumLowerStyle = signal<string>('background-color: red;');
  minimumUpperStyle = signal<string>('background-color: red;');
  minimumNumberStyle = signal<string>('background-color: red;');
  minimumSpecialStyle = signal<string>('background-color: red;');
  mustMatchStyle = signal<string>('background-color: red;');
  passwordValid = signal<boolean>(false);
  showEdit = signal<boolean>(false);

  constructor(
    private authService: AuthService,
    public adminService: AdminService,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.getAccounts();
    this.adminService.getPermissions().subscribe({
      next: (res) => {
        const list = res.body as Permission[];
        this.permissions.set(list);
      }, error: (err) => {
        if (err instanceof HttpErrorResponse) {
          if (err.status >= 400 && err.status < 500) {
            this.authService.statusMessage.set(`${err.status} - ${err.error.message}`)
          }
        }
      }
    })
  }

  getAccounts() {
    const list: User[] = [];
    this.adminService.getAllAccounts().subscribe({
      next: (res) => {
        const users = res.body as User[];
        users.forEach(usr => {
          list.push(new User(usr));
        });
        list.sort((a,b) => a.compareTo(b));
      }, error: (err) => {
        if (err instanceof HttpErrorResponse) {
          if (err.status >= 400 && err.status < 500) {
            this.authService.statusMessage.set(`${err.status} - ${err.error.message}`)
          }
        }
      }
    });
    this.accounts.set(list);
  }

  getClasses(user: User): string {
    let answer = "flexlayout row center user ";
    const expired = new Date(user.passwordExpires.getTime() + (180 * 24 * 3600000));
    const now = new Date();
    if (user.badAttempts > 2) {
      answer += "locked";
    } else if (expired.getTime() < now.getTime()) {
      const days = Math.floor((now.getTime() - expired.getTime()) / (24 * 3600000));
      if (days > 90) {
        answer += 'old';
      } else {
        answer += 'expired';
      }
    } else {
      answer += 'good';
    }
    return answer;
  }

  getListMaxHeight(): string {
    const height = window.innerHeight - 180;
    return `max-height: ${height}px;`;
  }

  selectUser(id: string) {
    this.showEdit.set(false);
    this.accounts().forEach(user => {
      if (user.id === id) {
        this.showEdit.set(true);
        this.adminService.selectedUser.set(user);

      }
    })
  }

  sendTempPassword() {
    this.adminService.sendTempPassword(this.adminService.selectedUser().id).subscribe({
      next: (res) => {
        const iUser = res.body as User;
        if (iUser) {
          const user = new User(iUser);
          this.accounts().forEach((usr, u) => {
            if (usr.id === user.id) {
              this.accounts()[u] = user;
            }
          });
          this.adminService.selectedUser.set(user);
        }
      }, error: (err) => {
        if (err instanceof HttpErrorResponse) {
          if (err.status >= 400 && err.status < 500) {
            this.authService.statusMessage.set(`${err.status} - ${err.error.message}`)
          }
        }
      }
    })
  }

  hasPermission(app: string, job: string): boolean {
    return this.adminService.selectedUser().hasPermission(app, job);
  }

  handleClick(app: string, job: string, cb: any) {
    let useField = 'addperm';
    if (!cb.target.checked) {
      useField = 'removeperm';
    }
    const value = `${app}-${job}`;

    this.adminService.updateUser(this.adminService.selectedUser().id, useField, value)
      .subscribe({
      next: (res) => {
        const iUser = res.body as User;
        if (iUser) {
          const user = new User(iUser);
          this.accounts().forEach((usr, u) => {
            if (usr.id === user.id) {
              this.accounts()[u] = user;
            }
          });
          this.adminService.selectedUser.set(user);
        }
      }, error: (err) => {
        if (err instanceof HttpErrorResponse) {
          if (err.status >= 400 && err.status < 500) {
            this.authService.statusMessage.set(`${err.status} - ${err.error.message}`)
          }
        }
      }
    })
  }

  unlockUser() {
    this.adminService.updateUser(this.adminService.selectedUser().id, 'unlock', '')
      .subscribe({
      next: (res) => {
        const iUser = res.body as User;
        if (iUser) {
          const user = new User(iUser);
          this.accounts().forEach((usr, u) => {
            if (usr.id === user.id) {
              this.accounts()[u] = user;
            }
          });
          this.adminService.selectedUser.set(user);
        }
      }, error: (err) => {
        if (err instanceof HttpErrorResponse) {
          if (err.status >= 400 && err.status < 500) {
            this.authService.statusMessage.set(`${err.status} - ${err.error.message}`)
          }
        }
      }
    })
  }

  deleteUser() {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'User Delete Confirmation',
        message: 'Are you sure you want to delete this User? This will only happen if '
          + 'there is NO Employee record for this user!',
        negativeButtonTitle: 'No',
        affirmativeButtonTitle: 'Yes'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.toLowerCase() === 'yes') {
        const userid = this.adminService.selectedUser().id;
        this.adminService.deleteUser(userid).subscribe({
          next: (res) => {
            // a successful deletion, so remove user from account list by creating a new
            // list and omitting the user with this id.
            const list: User[] = [];
            this.accounts().forEach(usr => {
              if (usr.id !== userid) {
                list.push(new User(usr));
              }
            });
            this.accounts.set(list);
          }, error: (err) => {
            if (err instanceof HttpErrorResponse) {
              if (err.status >= 400 && err.status < 500) {
                this.authService.statusMessage.set(`${err.status} - ${err.error.message}`)
              }
            }
          }
        })
      }
    });
  }
}
