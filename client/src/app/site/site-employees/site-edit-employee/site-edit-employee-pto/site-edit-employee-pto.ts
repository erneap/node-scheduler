import { Component, computed, signal } from '@angular/core';
import { SiteService } from '../../../../services/site-service';
import { EmployeeLeavesChart } from '../../../../employee/employee-leaves/employee-leaves-chart/employee-leaves-chart';
import { Router } from '@angular/router';

@Component({
  selector: 'app-site-edit-employee-pto',
  imports: [
    EmployeeLeavesChart
  ],
  templateUrl: './site-edit-employee-pto.html',
  styleUrl: './site-edit-employee-pto.scss',
})
export class SiteEditEmployeePTO {
  employeeid = computed(() => this.siteService.selectedEmployee());

  constructor(
    private siteService: SiteService
  ) { }
}
