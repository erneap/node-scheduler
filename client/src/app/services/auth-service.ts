import { computed, Injectable, signal } from '@angular/core';
import { CacheService } from './cache.service';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { AddUserRequest, AuthenticationRequest, ForgotPasswordRequest, IUser, PasswordResetRequest, SecurityQuestionResponse, UpdateUserRequest, User } 
  from 'scheduler-models/users';
import { map, Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { MenuGroup, Message } from 'scheduler-models/general';

@Injectable({
  providedIn: 'root',
})
export class AuthService extends CacheService {
  private authUrl  = `${environment.authUrl}`;
  statusMessage = signal('');
  menuGroups = signal<MenuGroup[]>([]);
  showMenu = signal<boolean>(false);
  isAuthenticated = false;
  mustChange = computed(() => {
    const iUser = this.getItem<IUser>('user');
    if (iUser) {
      const user = new User(iUser);
      const now = new Date();
      const days = (now.getTime() - user.passwordExpires.getTime())  / (24 * 3600000);
      return (user.badAttempts < 0 || days > 120)
    }
    return false;
  });
  interval: any;
  forgotEmail = signal<string>('');

  constructor(
    private http: HttpClient,
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {
    super();
    const iUser = this.getUser();
    this.isAuthenticated = (iUser !== undefined);
    this.startTokenRefresh();
  }

  setUser(iUser: IUser | undefined) {
    if (iUser) {
      this.setItem('user', new User(iUser));
    }
  }

  getUser(): User | undefined {
    const iUser = this.getItem<IUser>('user');
    if (iUser) {
      return new User(iUser);
    }
    return undefined;
  }

  getRefreshToken(): string {
    const token = this.getItem<string>('refreshtoken');
    if (token) {
      return token;
    }
    return '';
  }

  setRefreshToken(token: string) {
    this.setItem('refreshtoken', token);
  }

  removeRefreshToken() {
    this.removeItem('refreshtoken');
  }

  getAccessToken(): string {
    const token = this.getItem<string>('accesstoken');
    if (token) {
      return token;
    }
    return '';
  }

  setAccessToken(token: string) {
    this.setItem('accesstoken', token);
  }

  removeAccessToken() {
    this.removeItem('accesstoken');
  }

  login(userid: string, passwd: string): Observable<HttpResponse<IUser>> {
    const url = `${this.authUrl}/authenticate`;
    const data: AuthenticationRequest = {
      emailAddress: userid,
      password: passwd,
    }
    return this.http.post<IUser>(url, data, { observe: 'response' }).pipe(
      map(res => {
        const user = new User(res.body as IUser);
        if (user.badAttempts <= 2) {
          this.setItem('user', user);
          this.isAuthenticated = true;
          if (res.headers.has('authorization')) {
            this.setAccessToken(res.headers.get('authorization') as string);
          } else if (res.headers.has('Authorization')) {
            this.setAccessToken(res.headers.get('Authorization') as string);
          }
          if (res.headers.has('refreshtoken')) {
            this.setRefreshToken(res.headers.get('refreshtoken') as string);
          } else if (res.headers.has('Refreshtoken')) {
            this.setRefreshToken(res.headers.get('Refreshtoken') as string);
          }
          this.startTokenRefresh();
        } else {
          this.removeItem('user');
          this.removeItem('accesstoken');
          this.removeItem('refreshtoken')
          this.isAuthenticated = false;
          this.stopTokenRefresh();
        }
        return res;
      })
    );
  }

  logout(): Observable<any> {
    if (this.getItem('user')) {
      const user = new User(this.getItem('user'));
      const url = `${this.authUrl}/authenticate/${user.id}`;
      this.removeItem('user');
      this.removeItem('accesstoken');
      this.removeItem('refreshtoken');
      this.isAuthenticated = false;
      this.stopTokenRefresh();
      return this.http.delete<any>(url);
    } else {
      return of({ "message": 'No recorded user'});
    }
  }

  completeMustChange(userid: string, oldpwd: string, newpwd: string) {
    const url = `${this.authUrl}/user`;
    const data: UpdateUserRequest = {
      id: userid,
      field: 'mustchange',
      subfield: oldpwd,
      value: newpwd
    };
    return this.http.put<IUser>(url, data, { observe: 'response' }).pipe(
      map(res => {
        const user = new User(res.body as IUser);
        if (user.badAttempts <= 2) {
          this.setItem('user', user);
          this.isAuthenticated = true;
        } else {
          this.removeItem('user');
          this.isAuthenticated = false;
        }
        return res;
      })
    );
  }

  processRefresh() {
    const url = `${this.authUrl}/refresh`;
    this.http.put<Message>(url, {}, {observe: 'response'}).subscribe({
      next: (res) => {
        const msg = (res.body as Message);
        if (msg.message.toLowerCase() === 'refresh token') {
          if (res.headers.has('authorization')) {
            this.setAccessToken(res.headers.get('authorization') as string);
          } else if (res.headers.has('Authorization')) {
            this.setAccessToken(res.headers.get('Authorization') as string);
          }
          if (res.headers.has('refreshtoken')) {
            this.setRefreshToken(res.headers.get('refreshtoken') as string);
          } else if (res.headers.has('Refreshtoken')) {
            this.setRefreshToken(res.headers.get('Refreshtoken') as string);
          }
        }
      },
      error: (err) => {
          console.log(err);
          if (err instanceof HttpErrorResponse) {
            if (err.status >= 400 && err.status < 500) {
              this.statusMessage.set(`${err.status} - ${err.error.message}`)
            }
          }
      }
    })
  }

  startTokenRefresh() {
    let minutes = 60;
    if (environment.refreshtoken) {
      minutes = environment.refreshtoken;
    }
    if (this.interval && this.interval !== null) {
      clearInterval(this.interval)
    }
    this.interval = setInterval(() => {
      this.processRefresh();
    }, minutes * 60000);
  }

  stopTokenRefresh() {
    if (this.interval && this.interval !== null) {
      clearInterval(this.interval);
    }
  }

  updatePermission(user: string, field: string, value: string): Observable<HttpResponse<IUser>> {
    const url = `${this.authUrl}/user`;
    const data: UpdateUserRequest = {
      id: user,
      field: field,
      value: value
    }
    return this.http.put<IUser>(url, data, { observe: 'response'}).pipe(
      map(res => {
        const iUser = res.body as IUser;
        if (iUser) {
          const user = new User(iUser);
          const itUser = this.getUser();
          if (itUser) {
            const tUser = new User(itUser);
            if (tUser.id === user.id) {
              this.setUser(user);
            }
          }
        }
        return res;
      })
    );
  }

  forgotUser(email: string): Observable<HttpResponse<IUser>> {
    const url = `${this.authUrl}/user/email`;
    const data: AddUserRequest = {
      emailAddress: email,
      firstName: '',
      lastName: '',
      password: '',
      application: ''
    }
    return this.http.post<IUser>(url, data, { observe: 'response'});
  }

  startQuestionReset(email: string): Observable<HttpResponse<SecurityQuestionResponse>> {
    const url = `${this.authUrl}/altreset`;
    const data: ForgotPasswordRequest = {
      emailAddress: email,
    }
    return this.http.post<SecurityQuestionResponse>(url, data, {observe: 'response'});
  }

  answerQuestionReset(email: string, id: number, answer: string, password: string)
    : Observable<HttpResponse<User>> {
    const url = `${this.authUrl}/altreset`;
    const data: PasswordResetRequest = {
      emailAddress: email,
      subid: id,
      resettoken: answer,
      password: password
    };
    return this.http.put<User>(url, data, { observe: 'response'});
  }

  startEmailReset(email: string): Observable<HttpResponse<User>> {
    const url = `${this.authUrl}/reset`;
    const data: ForgotPasswordRequest = {
      emailAddress: email,
    };
    return this.http.post<User>(url, data, { observe: 'response'});
  }

  answerEmailReset(email: string, token: string, password: string): Observable<HttpResponse<User>> {
    const url = `${this.authUrl}/reset`;
    const data: PasswordResetRequest = {
      emailAddress: email,
      resettoken: token,
      password: password,
    };
    return this.http.put<User>(url, data, { observe: 'response'});
  }
}
