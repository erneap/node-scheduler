import { Injectable, signal } from '@angular/core';
import { CacheService } from './cache.service';
import { Employee, IEmployee } from 'scheduler-models/scheduler/employees';
import { InitialResponse } from 'scheduler-models/scheduler/web';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService extends CacheService {
  private schedulerUrl = `${environment.schedulerUrl}`;

  constructor(
    private http: HttpClient
  ) {
    super();
  }

  getInitial(userid: string): Observable<HttpResponse<InitialResponse>> {
    const url = `${this.schedulerUrl}/initial/${userid}`;
    return this.http.get<InitialResponse>(url, {observe: 'response' });
  }

  setEmployee(emp: IEmployee) {
    this.setItem('employee', emp);
  }

  getEmployee(): Employee | undefined {
    const iEmp = this.getItem<IEmployee | undefined>('employee');
    if (iEmp) {
      return new Employee(iEmp);
    }
    return undefined;
  }

  removeEmployee() {
    this.removeItem('employee');
  }
}
