import { Component, signal } from '@angular/core';
import { form, minLength, required } from '@angular/forms/signals';
import { Workcode } from 'scheduler-models/scheduler/labor';
import { Item } from '../../../../../general/list/list.model';
import { SiteService } from '../../../../../services/site-service';
import { TeamService } from '../../../../../services/team-service';
import { Team } from 'scheduler-models/scheduler/teams';

interface WkctrShiftData {
  id: string;
  name: string;
  associated: string[];
  paycode: number;
  minimums: number;
}

@Component({
  selector: 'app-site-editor-workcenter-shifts',
  imports: [],
  templateUrl: './site-editor-workcenter-shifts.html',
  styleUrl: './site-editor-workcenter-shifts.scss',
})
export class SiteEditorWorkcenterShifts {
  workcodes = signal<Workcode[]>([]);
  list = signal<Item[]>([]);
  selectedShift = signal<string>('new');

  wkctrShiftModel = signal<WkctrShiftData>({
    id: '',
    name: '',
    associated: [],
    paycode: 1,
    minimums: 0
  });
  shiftForm = form(this.wkctrShiftModel, schema => {
    required(schema.id);
    required(schema.name);
    minLength(schema.associated, 1);
  });

  constructor(
    private siteService: SiteService,
    private teamService: TeamService
  ) {
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      const wclist: Workcode[] = [];
      team.workcodes.forEach(wc => {
        if (!wc.isLeave) {
          wclist.push(new Workcode(wc));
        }
      });
      this.workcodes.set(wclist);
    }
  }

  setShifts() {
    const shifts: Item[] = [];
    shifts.push({
      id: 'new',
      value: 'Add New Shift'
    });
    let found = false;
    this.siteService.selectedSite().workcenters.forEach(wc => {
      if (!found && wc.id.toLowerCase() === this.siteService.selectedWorkcenter()) {
        found = true;
        wc.shifts.forEach(shft => {
          shifts.push({
            id: shft.id,
            value: shft.name
          });
        })
      }
    });
    this.list.set(shifts);
  }

  selectShift(id: string) {
    
  }
}
