import { Component, Input, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { EmployeeService } from '../../services/employee-service';
import { SiteService } from '../../services/site-service';
import { TeamService } from '../../services/team-service';
import { Employee, IEmployee, LeaveRequest } from 'scheduler-models/scheduler/employees';
import { AuthService } from '../../services/auth-service';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialog, DialogData } from '../../general/confirmation-dialog/confirmation-dialog';
import { MatButtonModule } from '@angular/material/button';
import { MessageDialog } from '../../general/message-dialog/message-dialog';
import { Item } from '../../general/list/list.model';
import { EmployeeLeaveRequestsViewer } from './employee-leave-requests-viewer/employee-leave-requests-viewer';

@Component({
  selector: 'app-employee-leave-requests',
  imports: [
    MatCardModule,
    MatButtonModule,
    EmployeeLeaveRequestsViewer
],
  templateUrl: './employee-leave-requests.html',
  styleUrl: './employee-leave-requests.scss',
})
export class EmployeeLeaveRequests {
  employee = signal<string>('');

  constructor(
    private authService: AuthService,
    private empService: EmployeeService,
    private siteService: SiteService,
    private teamService: TeamService,
    private dialog: MatDialog
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
