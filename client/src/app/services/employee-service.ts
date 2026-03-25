import { Injectable, signal } from '@angular/core';
import { CacheService } from './cache.service';
import { Employee, IEmployee, NewEmployeeLeaveRequest } from 'scheduler-models/scheduler/employees';
import { InitialResponse } from 'scheduler-models/scheduler/web';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UpdateRequest } from 'scheduler-models/general';

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

  updateEmployee(empID: string, field: string, value: string, optional?: string)
    : Observable<HttpResponse<Employee>> {
    const url = `${this.schedulerUrl}/employee`;
    const data: UpdateRequest = {
      id: empID,
      field: field,
      value: value
    };
    if (optional) {
      data.optional = optional;
    }
    return this.http.put<Employee>(url, data, { observe: 'response' }).pipe(
      map(res => {
        const iEmployee = (res.body as IEmployee );
        if (iEmployee) {
          const employee = new Employee(iEmployee);
          const tEmp = this.getEmployee();
          if (tEmp && tEmp.id === employee.id) {
            this.setEmployee(employee);
          }
        }
        return res
      })
    );
  }

  addLeaveRequest(empID: string, start: Date, end: Date, primary: string, 
    cmt?: string): Observable<HttpResponse<Employee>> {
    const url = `${this.schedulerUrl}/employee/request`;
    const data: NewEmployeeLeaveRequest = {
      employee: empID,
      startdate: start,
      enddate: end, 
      code: primary,
      comment: cmt
    };
    return this.http.post<Employee>(url, data, { observe: 'response' }).pipe(
      map(res => {
        const iEmployee = (res.body as IEmployee );
        if (iEmployee) {
          const employee = new Employee(iEmployee);
          const tEmp = this.getEmployee();
          if (tEmp && tEmp.id === employee.id) {
            this.setEmployee(employee);
          }
        }
        return res
      })
    );
  }
}
