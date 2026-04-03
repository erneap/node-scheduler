import { Component, computed, signal } from '@angular/core';
import { AuthService } from '../../../../services/auth-service';
import { EmployeeService } from '../../../../services/employee-service';
import { SiteService } from '../../../../services/site-service';
import { TeamService } from '../../../../services/team-service';
import { AnnualLeave } from 'scheduler-models/scheduler/employees';
import { SiteEditEmployeeLeaveBalancesChart } from './site-edit-employee-leave-balances-chart/site-edit-employee-leave-balances-chart';

@Component({
  selector: 'app-site-edit-employee-leave-balances',
  imports: [
    SiteEditEmployeeLeaveBalancesChart
  ],
  templateUrl: './site-edit-employee-leave-balances.html',
  styleUrl: './site-edit-employee-leave-balances.scss',
})
export class SiteEditEmployeeLeaveBalances {
  employee = computed(() => this.siteService.selectedEmployee());
  
  constructor(
    private siteService: SiteService,
  ) {}
}
