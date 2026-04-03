import { Component, computed} from '@angular/core';
import { SiteService } from '../../../../services/site-service';
import { SiteEditEmployeeLeavesChart } from './site-edit-employee-leaves-chart/site-edit-employee-leaves-chart';

@Component({
  selector: 'app-site-edit-employee-leaves',
  imports: [
    SiteEditEmployeeLeavesChart
  ],
  templateUrl: './site-edit-employee-leaves.html',
  styleUrl: './site-edit-employee-leaves.scss',
})
export class SiteEditEmployeeLeaves {
  employee = computed(() => this.siteService.selectedEmployee());

  constructor(
    private siteService: SiteService,
  ) {}
}
