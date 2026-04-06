import { Component, Input, signal } from '@angular/core';
import { Item } from '../../../../../general/list/list.model';
import { Employee, Variation } from 'scheduler-models/scheduler/employees';
import { AuthService } from '../../../../../services/auth-service';
import { EmployeeService } from '../../../../../services/employee-service';
import { SiteService } from '../../../../../services/site-service';
import { TeamService } from '../../../../../services/team-service';
import { Workcode } from 'scheduler-models/scheduler/labor';
import { Workcenter } from 'scheduler-models/scheduler/sites/workcenters/workcenter';
import { Team } from 'scheduler-models/scheduler/teams';

interface VariationData {
  variationid: number;
  start: Date;
  end: Date;
  mids: boolean;
}

@Component({
  selector: 'app-site-edit-employee-variation-editor',
  imports: [],
  templateUrl: './site-edit-employee-variation-editor.html',
  styleUrl: './site-edit-employee-variation-editor.scss',
})
export class SiteEditEmployeeVariationEditor {
  private _employee: string = '';
  @Input()
  get employee(): string {
    return this._employee;
  }
  set employee(id: string) {
    this._employee = id;
  }
  list = signal<Item[]>([]);
  site = signal<string>('');
  selectedVariation = signal<Variation>(new Variation());
  workcodes = signal<Workcode[]>([]);
  workcenters = signal<Workcenter[]>([]);

  constructor(
    private authService: AuthService,
    private empService: EmployeeService,
    private siteService: SiteService,
    private teamService: TeamService
  ) {
    // workcodes are derived from the employee's team, while the workcenters and labor
    // codes are derived from the employee's site.  So get the team and pull in the work
    // (not leave) codes, then find the employee in the various sites' employee list and
    // when found, create the workcenter and laborcode lists from the associated site.
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      const wlist: Workcode[] = [];
      team.workcodes.forEach(wc => {
        if (!wc.isLeave) {
          wlist.push(new Workcode(wc));
        }
      });
      wlist.sort((a,b) => a.compareTo(b));
      this.workcodes.set(wlist);
    }
  }

  listHeight(): number {
    const height = window.innerHeight - 300;
    return height;
  }

  setEmployeeList() {
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      let found = false;
      const now = new Date();
      const start = new Date(Date.UTC(now.getFullYear() - 1, 0, 1));
      const end = new Date(Date.UTC(now.getFullYear() + 2, 0, 1));
      team.sites.forEach(site => {
        if (!found && site.employees) {
          site.employees.forEach(iEmp => {
            if (!found) {
              const emp = new Employee(iEmp);
              if (emp.id === this.employee) {
                found = true;
                this.site.set(site.id);

                const wclist: Workcenter[] = [];
                site.workcenters.forEach(wc => {
                  wclist.push(new Workcenter(wc));
                });
                wclist.sort((a,b) => a.compareTo(b));
                this.workcenters.set(wclist);

                const vList: Item[] = [];
                
                this.list.set(vList);
              }
            }
          })
        }
      });
    }
  }
}
