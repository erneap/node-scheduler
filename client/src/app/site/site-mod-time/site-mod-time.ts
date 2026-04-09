import { Component } from '@angular/core';
import { EmployeeService } from '../../services/employee-service';
import { SiteService } from '../../services/site-service';
import { TeamService } from '../../services/team-service';
import { Team } from 'scheduler-models/scheduler/teams';

@Component({
  selector: 'app-site-mod-time',
  imports: [],
  templateUrl: './site-mod-time.html',
  styleUrl: './site-mod-time.scss',
})
export class SiteModTime {

  constructor(
    private empService: EmployeeService,
    private siteService: SiteService,
    private teamService: TeamService
  ) {
    const iEmp = this.empService.getEmployee();
    let company = '';
    if (iEmp) {
      company = iEmp.companyinfo.company;
    }
    const now = new Date();

    let modstart = new Date(0);
    let modend = new Date(0);
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      team.companies.forEach(co => {
        if (co.id.toLowerCase() === company.toLowerCase() && co.modperiods.length > 0) {
          co.modperiods.forEach(mod => {
            if (mod.start.getTime() <= now.getTime() 
              && mod.end.getTime() >= now.getTime()) {
              modstart = new Date(mod.start);
              modend = new Date(mod.end);
            }
          });
        }
      });
    }
    while (modstart.getUTCDay() !== 6) {
      modstart = new Date(modstart.getTime() - (24 * 3600000));
    }
  }
}
