import { Component, signal } from '@angular/core';
import { EmployeeService } from '../../services/employee-service';
import { Employee } from 'scheduler-models/scheduler/employees';
import { MatCardModule } from '@angular/material/card';
import { EmployeeSpecialtiesEditor } from './employee-specialties-editor/employee-specialties-editor';

@Component({
  selector: 'app-employee-specialties',
  imports: [
    MatCardModule,
    EmployeeSpecialtiesEditor
  ],
  templateUrl: './employee-specialties.html',
  styleUrl: './employee-specialties.scss',
})
export class EmployeeSpecialties {
  employee = signal<string>('');

  constructor(
    private empService: EmployeeService,
  ) {
    if (this.employee() === '') {
      const iEmp = this.empService.getEmployee();
      if (iEmp) {
        const emp = new Employee(iEmp);
        this.employee.set(emp.id);
      }
    }
  }
}
