import { Component, computed } from '@angular/core';
import { EmployeeLeaveRequestsViewer } from '../../../../employee/employee-leave-requests/employee-leave-requests-viewer/employee-leave-requests-viewer';
import { SiteService } from '../../../../services/site-service';

@Component({
  selector: 'app-site-edit-employee-leave-requests',
  imports: [
    EmployeeLeaveRequestsViewer
  ],
  templateUrl: './site-edit-employee-leave-requests.html',
  styleUrl: './site-edit-employee-leave-requests.scss',
})
export class SiteEditEmployeeLeaveRequests {
  employeeid = computed(() => this.siteService.selectedEmployee());

  constructor(
    private siteService: SiteService
  ) {}
}
