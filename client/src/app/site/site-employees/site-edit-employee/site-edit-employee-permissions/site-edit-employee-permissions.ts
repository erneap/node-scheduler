import { Component, computed } from '@angular/core';
import { SiteService } from '../../../../services/site-service';
import { SiteEditEmployeePermissionsEditor } from './site-edit-employee-permissions-editor/site-edit-employee-permissions-editor';

@Component({
  selector: 'app-site-edit-employee-permissions',
  imports: [
    SiteEditEmployeePermissionsEditor
  ],
  templateUrl: './site-edit-employee-permissions.html',
  styleUrl: './site-edit-employee-permissions.scss',
})
export class SiteEditEmployeePermissions {
  employee = computed(() => this.siteService.selectedEmployee())

  constructor(
    private siteService: SiteService
  ) {}
}
