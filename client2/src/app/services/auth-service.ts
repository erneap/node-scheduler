import { Injectable, signal } from '@angular/core';
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
  isAuthenticated = signal(false);
  refreshToken = signal('');
  accessToken = signal('');

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    super();
  }

  getUser(): User {
    const iUser = this.getItem<IUser>('user');
    if (iUser) {
      return new User(iUser);
    }
    return new User();
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
          this.isAuthenticated.set(true);
          if (res.headers.has('authorization')) {
            this.accessToken.set(res.headers.get('authorization') as string);
          } else if (res.headers.has('Authorization')) {
            this.accessToken.set(res.headers.get('Authorization') as string);
          }
          if (res.headers.has('refreshtoken')) {
            this.refreshToken.set(res.headers.get('refreshtoken') as string);
          } else if (res.headers.has('Refreshtoken')) {
            this.refreshToken.set(res.headers.get('Refreshtoken') as string);
          }
        } else {
          this.setItem('user', new User());
          this.isAuthenticated.set(false);
        }
        return res;
      })
    );
  }

  logout(): Observable<any> {
    if (this.getItem('user')) {
      const user = new User(this.getItem('user'));
      const url = `${this.authUrl}/authenticate/${user.id}`;
      return this.http.delete<any>(url);
    } else {
      return of({ "message": 'No recorded user'});
    }
  }

  mustChange(userid: string, oldpwd: string, newpwd: string) {
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
          this.isAuthenticated.set(true);
        } else {
          this.setItem('user', new User());
          this.isAuthenticated.set(false);
        }
        return res;
      })
    );
  }
}
