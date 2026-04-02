import { Component, Input, signal } from '@angular/core';
import { TeamService } from '../../services/team-service';
import { MatCardModule } from '@angular/material/card';
import { EmployeeService } from '../../services/employee-service';
import { Employee } from 'scheduler-models/scheduler/employees';
import { EmployeeContactInformationEditor } from './employee-contact-information-editor/employee-contact-information-editor';

@Component({
  selector: 'app-employee-contact-information',
  imports: [
    MatCardModule,
    EmployeeContactInformationEditor
  ],
  templateUrl: './employee-contact-information.html',
  styleUrl: './employee-contact-information.scss',
})
export class EmployeeContactInformation {
  employee = signal<string>('');

  constructor(
    private empService: EmployeeService,
    private teamService: TeamService
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
