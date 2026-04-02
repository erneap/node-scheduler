import { Component, Input, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { EmployeeService } from '../../services/employee-service';
import { EmployeeCompanyEditor } from './employee-company-editor/employee-company-editor';

@Component({
  selector: 'app-employee-company',
  imports: [
    MatCardModule,
    EmployeeCompanyEditor
  ],
  templateUrl: './employee-company.html',
  styleUrl: './employee-company.scss',
})
export class EmployeeCompany {
  employee = signal<string>('');

  constructor(
    private empService: EmployeeService,
  ) {
    if (this.employee() === '') {
      const emp = this.empService.getEmployee();
      if (emp) {
        this.employee.set(emp.id);
      }
    }
  }
}
