import { Component, computed } from '@angular/core';
import { SiteService } from '../../../../services/site-service';
import { EmployeeProfileEditor } from '../../../../employee/employee-profile/employee-profile-editor/employee-profile-editor';

@Component({
  selector: 'app-site-edit-employee-profile',
  imports: [
    EmployeeProfileEditor
  ],
  templateUrl: './site-edit-employee-profile.html',
  styleUrl: './site-edit-employee-profile.scss',
})
export class SiteEditEmployeeProfile {
  employeeid = computed(() => this.siteService.selectedEmployee());

  constructor(
    private siteService: SiteService
  ) { }
}
