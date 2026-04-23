import { Component, computed } from '@angular/core';
import { TeamService } from '../../../services/team-service';
import { Item } from '../../../general/list/list.model';
import { Team } from 'scheduler-models/scheduler/teams';
import { Router, RouterOutlet } from '@angular/router';
import { List } from '../../../general/list/list';

@Component({
  selector: 'app-team-editor-sites',
  imports: [
    List,
    RouterOutlet
  ],
  templateUrl: './team-editor-sites.html',
  styleUrl: './team-editor-sites.scss',
})
export class TeamEditorSites {

  constructor(
    public teamService: TeamService,
    private router: Router
  ) { 
    if (this.teamService.sites().length === 0) {
      const slist: Item[] = [];
      slist.push({id: 'new', value: 'Add New Site'});
      const iTeam = this.teamService.getTeam();
      if (iTeam) {
        const team = new Team(iTeam);
        team.sites.forEach(site => {
          slist.push({id: site.id, value: site.name});
        });
      }
      this.teamService.sites.set(slist);
    }
    this.selectSite('new');
  }

  selectSite(id: string) {
    this.teamService.selectedSite.set(id);
    if (id.toLowerCase() === 'new') {
      const url = '/team/sites/new';
      this.router.navigate([url]);
    } else {
      const url = '/team/sites/edit';
      this.router.navigate([url]);
    }
  }
}
