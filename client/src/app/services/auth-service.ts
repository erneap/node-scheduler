import { Injectable, signal } from '@angular/core';
import { CacheService } from './cache.service';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthenticationRequest, IUser, User } from 'scheduler-node-models/users';
import { map, Observable } from 'rxjs';
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
      application: 'scheduler'
    }
    return this.http.post<IUser>(url, data, { observe: 'response' }).pipe(
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
    )
  }

  logout() {

  }
}
