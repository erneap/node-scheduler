import { Component, Input, signal } from '@angular/core';
import { EmployeeService } from '../../services/employee-service';
import { MatCardModule } from '@angular/material/card';
import { EmployeeProfileEditor } from './employee-profile-editor/employee-profile-editor';

@Component({
  selector: 'app-employee-profile',
  imports: [
    MatCardModule,
    EmployeeProfileEditor
],
  templateUrl: './employee-profile.html',
  styleUrl: './employee-profile.scss',
})
export class EmployeeProfile {
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
