import { Component, computed, input } from '@angular/core';
import { Employee } from 'scheduler-models/scheduler/employees';
import { SiteService } from '../../../../services/site-service';
import { SiteEditEmployeeVariationEditor } from './site-edit-employee-variation-editor/site-edit-employee-variation-editor';

@Component({
  selector: 'app-site-edit-employee-variation',
  imports: [
    SiteEditEmployeeVariationEditor
  ],
  templateUrl: './site-edit-employee-variation.html',
  styleUrl: './site-edit-employee-variation.scss',
})
export class SiteEditEmployeeVariation {
  employee = computed(() => this.siteService.selectedEmployee);

  constructor(
    private siteService: SiteService
  ) {}
}
