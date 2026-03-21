import { Component, Input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { EmployeeService } from '../../services/employee-service';
import { EmployeeLeavesChart } from './employee-leaves-chart/employee-leaves-chart';

@Component({
  selector: 'app-employee-leaves',
  imports: [
    MatCardModule,
    EmployeeLeavesChart
  ],
  templateUrl: './employee-leaves.html',
  styleUrl: './employee-leaves.scss',
})
export class EmployeeLeaves {
  private employeeid: string = '';
  @Input()
  get employee(): string {
    return this.employeeid;
  }
  set employee(id: string) {
    this.employeeid = id;
  }

  constructor(
    private empService: EmployeeService
  ) {
    if (this.employeeid === '') {
      const employee = this.empService.getEmployee();
      if (employee) {
        this.employeeid = employee.id;
      }
    }
  }
}
