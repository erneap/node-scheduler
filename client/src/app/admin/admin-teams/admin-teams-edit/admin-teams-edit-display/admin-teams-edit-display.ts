import { Component, Input, signal } from '@angular/core';
import { AuthService } from '../../../../services/auth-service';
import { TeamService } from '../../../../services/team-service';
import { User } from 'scheduler-models/users';
import { HttpErrorResponse } from '@angular/common/http';
import { ITeam, Team } from 'scheduler-models/scheduler/teams';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-admin-teams-edit-display',
  imports: [
    MatButtonModule
  ],
  templateUrl: './admin-teams-edit-display.html',
  styleUrl: './admin-teams-edit-display.scss',
})
export class AdminTeamsEditDisplay {
  private _team: string = '';
  @Input()
  get team(): string {
    return this._team;
  }
  set team(id: string) {
    this._team = id;
    this.getTeam();
  }
  name = signal<string>('')
  leadership = signal<User[]>([])

  constructor(
    private authService: AuthService,
    private teamService: TeamService,
    private router: Router
  ) {
    if (this._team === 'new' || this._team === 'new') {
      this.router.navigate(['/admin/teams/new']);
    }
  }

  getTeam() {
    this.authService.statusMessage.set('');
    if (this._team && this._team !== '' && this._team !== 'new') {
      this.teamService.getSelectedTeam(this._team).subscribe({
        next: (res) => {
          const iteam = res.body as ITeam;
          if (iteam) {
            const team = new Team(iteam);
            this.name.set(team.name);
            if (team.employees) {
              const leaders: User[] = [];
              team.employees.forEach(emp => {
                if (emp.user) {
                  if (emp.user.hasPermission('scheduler', 'teamleader') 
                    || emp.user.hasPermission('scheduler', 'admin')) {
                    leaders.push(new User(emp.user));
                  }
                }
              });
              this.leadership.set(leaders);
            }
          }
        }, error: (err) => {
          if (err instanceof HttpErrorResponse) {
            if (err.status >= 400 && err.status < 500) {
              this.authService.statusMessage.set(`${err.status} - ${err.error.message}`)
            }
          }
        }
      });
    } else {
      this.router.navigate(['/admin/teams/new']);
    }
  }
}
