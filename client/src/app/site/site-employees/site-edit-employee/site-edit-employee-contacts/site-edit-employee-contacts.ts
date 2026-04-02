import { Component, computed } from '@angular/core';
import { SiteService } from '../../../../services/site-service';
import { EmployeeContactInformationEditor } from '../../../../employee/employee-contact-information/employee-contact-information-editor/employee-contact-information-editor';

@Component({
  selector: 'app-site-edit-employee-contacts',
  imports: [
    EmployeeContactInformationEditor
  ],
  templateUrl: './site-edit-employee-contacts.html',
  styleUrl: './site-edit-employee-contacts.scss',
})
export class SiteEditEmployeeContacts {
  employeeid = computed(() => this.siteService.selectedEmployee());

  constructor(
    private siteService: SiteService
  ) { }}
