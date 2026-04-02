import { Component, computed } from '@angular/core';
import { SiteService } from '../../../../services/site-service';
import { EmployeeCompanyEditor } from '../../../../employee/employee-company/employee-company-editor/employee-company-editor';

@Component({
  selector: 'app-site-edit-employee-company',
  imports: [
    EmployeeCompanyEditor
  ],
  templateUrl: './site-edit-employee-company.html',
  styleUrl: './site-edit-employee-company.scss',
})
export class SiteEditEmployeeCompany {
  employeeid = computed(() => this.siteService.selectedEmployee());

  constructor(
    private siteService: SiteService
  ) { }}
