import { Component, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { TeamService } from '../../services/team-service';
import { ITeam, Team } from 'scheduler-models/scheduler/teams';
import { HttpErrorResponse } from '@angular/common/http';

interface TeamData {
  name: string;
}

@Component({
  selector: 'app-team-editor',
  imports: [
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatToolbarModule,
    MatButtonModule,
    RouterOutlet
  ],
  templateUrl: './team-editor.html',
  styleUrl: './team-editor.scss',
})
export class TeamEditor {
  team = signal<string>('');
  teamModel = signal<TeamData>({
    name: '',
  });
  teamForm = form(this.teamModel, (s) => {
    required(s.name);
  })

  constructor(
    private authService: AuthService,
    private teamService: TeamService,
    private router: Router
  ) { 
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      this.team.set(team.id);
      this.teamForm.name().value.set(team.name);
    }
  }

  style(): string {
    const height = window.innerHeight - 70;
    return `height: ${height}px;`;
  }

  choose(view: string) {
    let url = '';
    switch (view.toLowerCase()) {
      case "workcodes":
        url = '/team/workcodes';
        break;
      case "companies":
        url = '/team/companies';
        break;
      case "contacts":
        url = '/team/contacts';
        break;
      case "specialties":
        url = '/team/specialties';
        break;
      case "sites":
        url = '/team/sites';
        break;
    }
    //this.choosen.set(url);
    this.router.navigate([url]);
  }

  onUpdate(field: string) {
    if (field.toLowerCase() === 'name') {
      this.teamService.updateTeam(this.team(), field, this.teamForm.name().value()).subscribe({
        next: (res) => {
          const iTeam = (res.body as ITeam);
          if (iTeam) {
            const team = new Team(iTeam);
            this.teamForm.name().value.set(team.name);
          }
        },
        error: (err) => {
          if (err instanceof HttpErrorResponse) {
            if (err.status >= 400 && err.status < 500) {
              this.authService.statusMessage.set(`${err.status} - ${err.error.message}`)
            }
          }
        }
      })
    }
  }
}
