import { computed, Injectable, signal } from '@angular/core';
import { CacheService } from './cache.service';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthenticationRequest, IUser, UpdateUserRequest, User } 
  from 'scheduler-models/users';
import { map, Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService extends CacheService {
  private authUrl  = `${environment.authUrl}`;
  statusMessage = signal('');
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
  })
  refreshToken = signal('');
  accessToken = signal('');

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    super();
    const iUser = this.getUser();
    this.isAuthenticated = (iUser !== undefined);
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
        } else {
          this.removeItem('user');
          this.removeItem('accesstoken');
          this.removeItem('refreshtoken')
          this.isAuthenticated = false;
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
}
