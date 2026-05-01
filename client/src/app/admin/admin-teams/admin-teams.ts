import { Component, signal } from '@angular/core';
import { Item } from '../../general/list/list.model';
import { AuthService } from '../../services/auth-service';
import { TeamService } from '../../services/team-service';
import { Router, RouterOutlet } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AdminService } from '../../services/admin-service';
import { HttpErrorResponse } from '@angular/common/http';
import { ITeam, Team } from 'scheduler-models/scheduler/teams';
import { List } from '../../general/list/list';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-admin-teams',
  imports: [
    List,
    RouterOutlet,
    MatButtonModule
  ],
  templateUrl: './admin-teams.html',
  styleUrl: './admin-teams.scss',
})
export class AdminTeams {
  list = signal<Item[]>([]);

  constructor(
    private authService: AuthService,
    public adminService: AdminService,
    private teamService: TeamService,
    private router: Router,
    private dialog: MatDialog
  ) {
    this.setList();
  }

  setList() {
    const list: Item[] = [];
    list.push({id: 'new', value: 'Add New Team'});
    this.adminService.getAllTeams().subscribe({
      next: (res) => {
        const iTeams = res.body as ITeam[]
        if (iTeams) {
          iTeams.forEach(iteam => {
            const team = new Team(iteam);
            list.push({id: team.id, value: team.name });
          })
        }
      }, error: (err) => {
        if (err instanceof HttpErrorResponse) {
          if (err.status >= 400 && err.status < 500) {
            this.authService.statusMessage.set(`${err.status} - ${err.error.message}`)
          }
        }
      }
    });
    this.list.set(list);
  }

  selectTeam(id: string) {
    this.adminService.selectedTeam.set(id);
    if (id.toLowerCase() === 'new') {
      this.router.navigate(['/admin/teams/new']);
    } else {
      this.router.navigate(['/admin/teams/edit']);
    }
  }

  listHeight(): number {
    return window.innerHeight - 180;
  }
}
