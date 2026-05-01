import { Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ForgotPasswordRequest, Permission, UpdateUserRequest, User } from 'scheduler-models/users';
import { Message } from 'scheduler-models/general';
import { Team } from 'scheduler-models/scheduler/teams';

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private authUrl  = `${environment.authUrl}`;
  private schedulerUrl = `${environment.schedulerUrl}`;
  selectedUser = signal<User>(new User());
  selectedTeam = signal<string>('new');

  constructor(
    private http: HttpClient
  ) {}

  getAllAccounts(): Observable<HttpResponse<User[]>> {
    const url = `${this.authUrl}/users`;
    return this.http.get<User[]>(url, { observe: 'response'});
  }

  getPermissions(): Observable<HttpResponse<Permission[]>> {
    const url = `${this.authUrl}/permissions`;
    return this.http.get<Permission[]>(url, {observe: 'response'});
  }

  deleteUser(id: string): Observable<HttpResponse<Message>> {
    const url = `${this.authUrl}/user/${id}`;
    return this.http.delete<Message>(url, { observe: 'response'});
  }

  updateUser(id: string, field: string, value: string): Observable<HttpResponse<User>> {
    const url = `${this.authUrl}/user`;
    const data: UpdateUserRequest = {
      id: id,
      field: field,
      value: value
    };
    return this.http.put<User>(url, data, { observe: 'response'});
  }

  getAllTeams(): Observable<HttpResponse<Team[]>> {
    const url = `${this.schedulerUrl}/teams`;
    return this.http.get<Team[]>(url, {observe: 'response'});
  }

  sendTempPassword(id: string): Observable<HttpResponse<User>> {
    const url = `${this.authUrl}/resetadmin`;
    const data: ForgotPasswordRequest = {
      emailAddress: id
    };
    return this.http.post<User>(url, data, {observe: 'response'});
  }
}
