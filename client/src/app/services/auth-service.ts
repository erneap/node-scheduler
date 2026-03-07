import { computed, Injectable, signal } from '@angular/core';
import { CacheService } from './cache.service';
import { AuthenticationRequest } from 'scheduler-node-models/users'
import { InitialResponse } from 'scheduler-node-models/scheduler/web';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, Observable, of } from 'rxjs';
import { IUser, User } from '../models/users';

@Injectable({
  providedIn: 'root',
})
export class AuthService extends CacheService {
  public accessToken = signal('');
  public refreshToken = signal('');
  public message = signal('');
  public user = signal(new User);
  isLoggedIn = computed(() => this.user() && this.accessToken() !== '');

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    super();
  }

  login(userid: string, password: string): Observable<HttpResponse<IUser>> {
    const url = '/api/authentication/authenticate';
    const data: AuthenticationRequest = {
      emailAddress: userid,
      password: password,
      application: 'scheduler'
    };
    return this.http.post<IUser>(url, data, { observe: 'response'}).pipe(
     map(res => {
        const iUser = res.body;
        if (iUser && iUser !== null) {
          this.user.set(new User(iUser as IUser))

          // get the authorization header from the response
          const token = res.headers.get('authorization');
          if (token) {
            this.accessToken.set(token);
          }

          // get the refresh token from the response
          const refresh = res.headers.get('refreshToken');
          if (refresh) {
            this.refreshToken.set(refresh);
          }
        }
        return res;
      }));
  }

  initialData(id?: string): Observable<InitialResponse> {
    if (id === '' && this.user() && this.user().id !== '') {
      id = this.user().id;
    }
    const url = `/api/scheduler/initial/${id}`;
    return this.http.get<InitialResponse>(url);
  }
}
