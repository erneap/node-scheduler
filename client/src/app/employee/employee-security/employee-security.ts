import { Component, Input, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PasswordStrengthValidator } from '../../models/validators/password-strength-validator.directive';
import { MustMatchValidator } from '../../models/validators/must-match-validator.directive';
import { SecurityQuestion } from 'scheduler-models/users';
import { TeamService } from '../../services/team-service';
import { MatSelectModule } from '@angular/material/select';
import { EmployeeService } from '../../services/employee-service';
import { Employee, IEmployee } from 'scheduler-models/scheduler/employees';
import { AuthService } from '../../services/auth-service';
import { SiteService } from '../../services/site-service';
import { HttpErrorResponse } from '@angular/common/http';
import { EmployeeSecurityEditor } from './employee-security-editor/employee-security-editor';

@Component({
  selector: 'app-employee-security',
  imports: [
    MatCardModule,
    EmployeeSecurityEditor
  ],
  templateUrl: './employee-security.html',
  styleUrl: './employee-security.scss',
})
export class EmployeeSecurity {
  employee = signal<string>('');

  constructor(
    private authService: AuthService,
    private empService: EmployeeService,
    private siteService: SiteService,
    private teamService: TeamService,
    private builder: FormBuilder
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
