import { Component, computed } from '@angular/core';
import { SiteEditEmployeeAssignmentEditor } from './site-edit-employee-assignment-editor/site-edit-employee-assignment-editor';
import { SiteService } from '../../../../services/site-service';

@Component({
  selector: 'app-site-edit-employee-assignment',
  imports: [
    SiteEditEmployeeAssignmentEditor
  ],
  templateUrl: './site-edit-employee-assignment.html',
  styleUrl: './site-edit-employee-assignment.scss',
})
export class SiteEditEmployeeAssignment {
  employee = computed(() => this.siteService.selectedEmployee());

  constructor(
    private siteService: SiteService
  ) {}
}
