import { Injectable, signal } from '@angular/core';
import { CacheService } from './cache.service';
import { Employee } from 'scheduler-models/scheduler/employees';
import { InitialResponse } from 'scheduler-models/scheduler/web';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService extends CacheService {
  private schedulerUrl = `${environment.schedulerUrl}`;
  employee = signal(new Employee());

  constructor(
    private http: HttpClient
  ) {
    super();
  }

  getInitial(userid: string): Observable<HttpResponse<InitialResponse>> {
    const url = `${this.schedulerUrl}/initial/${userid}`;
    return this.http.get<InitialResponse>(url, {observe: 'response' });
  }
}
