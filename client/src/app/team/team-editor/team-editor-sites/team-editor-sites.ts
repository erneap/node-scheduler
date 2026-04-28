import { Component, computed, signal } from '@angular/core';
import { TeamService } from '../../../services/team-service';
import { Item } from '../../../general/list/list.model';
import { Team } from 'scheduler-models/scheduler/teams';
import { Router, RouterOutlet } from '@angular/router';
import { List } from '../../../general/list/list';
import { MatButtonModule } from '@angular/material/button';
import { ConfirmationDialog } from '../../../general/confirmation-dialog/confirmation-dialog';
import { MatDialog } from '@angular/material/dialog';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../services/auth-service';

@Component({
  selector: 'app-team-editor-sites',
  imports: [
    List,
    MatButtonModule,
    RouterOutlet
  ],
  templateUrl: './team-editor-sites.html',
  styleUrl: './team-editor-sites.scss',
})
export class TeamEditorSites {
  team = signal<string>('');

  constructor(
    private authService: AuthService,
    public teamService: TeamService,
    private router: Router,
    private dialog: MatDialog
  ) { 
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      this.team.set(team.id);
    }
    this.setList();
    this.selectSite('new');
  }

  setList() {
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

  onDelete() {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'Site Delete Confirmation',
        message: 'Are you sure you want to delete this site?',
        negativeButtonTitle: 'No',
        affirmativeButtonTitle: 'Yes'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.toLowerCase() === 'yes') {
        this.teamService.deleteSite(this.team(), this.teamService.selectedSite()).subscribe({
          next: (res) => {
            this.setList();
            this.teamService.selectedSite.set('new');
            this.router.navigate(['/team/sites/new']);
          },
          error: (err) => {
            if (err instanceof HttpErrorResponse) {
              if (err.status >= 400 && err.status < 500) {
                this.authService.statusMessage.set(`${err.status} - ${err.error.message}`)
              }
            }
          }
        });
      }
    });
  }
}
