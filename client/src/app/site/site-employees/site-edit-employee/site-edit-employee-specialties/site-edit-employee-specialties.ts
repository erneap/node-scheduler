import { Component, computed } from '@angular/core';
import { SiteService } from '../../../../services/site-service';
import { EmployeeSpecialtiesEditor } from '../../../../employee/employee-specialties/employee-specialties-editor/employee-specialties-editor';

@Component({
  selector: 'app-site-edit-employee-specialties',
  imports: [
    EmployeeSpecialtiesEditor
  ],
  templateUrl: './site-edit-employee-specialties.html',
  styleUrl: './site-edit-employee-specialties.scss',
})
export class SiteEditEmployeeSpecialties {
  employeeid = computed(() => this.siteService.selectedEmployee());

  constructor(
    private siteService: SiteService
  ) { }
}
