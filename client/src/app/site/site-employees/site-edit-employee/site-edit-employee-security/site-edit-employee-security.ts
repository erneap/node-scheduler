import { Component, computed } from '@angular/core';
import { EmployeeSecurityEditor } from '../../../../employee/employee-security/employee-security-editor/employee-security-editor';
import { SiteService } from '../../../../services/site-service';

@Component({
  selector: 'app-site-edit-employee-security',
  imports: [
    EmployeeSecurityEditor
  ],
  templateUrl: './site-edit-employee-security.html',
  styleUrl: './site-edit-employee-security.scss',
})
export class SiteEditEmployeeSecurity {
  employeeid = computed(() => this.siteService.selectedEmployee());

  constructor(
    private siteService: SiteService
  ) { }}
