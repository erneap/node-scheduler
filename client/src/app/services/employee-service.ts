import { Injectable, signal } from '@angular/core';
import { CacheService } from './cache.service';
import { Employee, EmployeeContactSpecialtyUpdate, EmployeeSpecialtiesUpdate, IEmployee, NewEmployeeLeaveRequest } from 'scheduler-models/scheduler/employees';
import { InitialResponse } from 'scheduler-models/scheduler/web';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { UpdateRequest } from 'scheduler-models/general';
import { EmployeeContactInformationItem } from '../employee/employee-contact-information/employee-contact-information-item/employee-contact-information-item';

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
        return res;
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
        return res;
      })
    );
  }

  updateLeaveRequest(employeeid: string, requestid: string, field: string, value: string)
    : Observable<HttpResponse<Employee>> {
    const url = `${this.schedulerUrl}/employee/request`;
    const data: UpdateRequest = {
      id: employeeid,
      optional: requestid,
      field: field,
      value: value
    };
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
        return res;
      })
    );
  }

  deleteLeaveRequest(empID: string, requestid: string): Observable<HttpResponse<Employee>> {
    const url = `${this.schedulerUrl}/employee/request/${empID}/${requestid}`;
    return this.http.delete<Employee>(url, { observe: 'response' }).pipe(
      map(res => {
        const iEmployee = (res.body as IEmployee );
        if (iEmployee) {
          const employee = new Employee(iEmployee);
          const tEmp = this.getEmployee();
          if (tEmp && tEmp.id === employee.id) {
            this.setEmployee(employee);
          }
        }
        return res;
      })
    );
  }

  updateContactInformation(empid: string, contacttype: number, value: string)
    : Observable<HttpResponse<Employee>> {
    const url = `${this.schedulerUrl}/employee/contact`;
    const data: EmployeeContactSpecialtyUpdate = {
      employee: empid,
      contactid: 0,
      typeid: contacttype,
      value: value
    };
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
        return res;
      })
    );
  }

  updateSpecialties(empid: string, action: string, specialties: number[]): Observable<HttpResponse<Employee>> {
    const url = `${this.schedulerUrl}/employee/specialties`;
    const data: EmployeeSpecialtiesUpdate = {
      employee: empid,
      action: action,
      specialties: specialties
    };
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
        return res;
      })
    );
  }
}
