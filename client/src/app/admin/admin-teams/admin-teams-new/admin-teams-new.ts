import { Component, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { NewSitePersonnel } from 'scheduler-models/scheduler/sites/web';
import { AuthService } from '../../../services/auth-service';
import { TeamService } from '../../../services/team-service';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AdminTeamsNewPersonnel } from './admin-teams-new-personnel/admin-teams-new-personnel';
import { AdminService } from '../../../services/admin-service';
import { HttpErrorResponse } from '@angular/common/http';
import { ITeam, Team } from 'scheduler-models/scheduler/teams';
import { Item } from '../../../general/list/list.model';

interface NewTeamData {
  name: string;
}

@Component({
  selector: 'app-admin-teams-new',
  imports: [
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    AdminTeamsNewPersonnel
  ],
  templateUrl: './admin-teams-new.html',
  styleUrl: './admin-teams-new.scss',
})
export class AdminTeamsNew {
  personnel = signal<NewSitePersonnel[]>([]);
  teamModel = signal<NewTeamData>({
    name: '',
  });
  teamForm = form(this.teamModel, (s) => {
    required(s.name, { message: '* required'})
  });

  constructor(
    private authService: AuthService,
    private adminService: AdminService,
    private teamService: TeamService,
    private router: Router
  ) {

  }

  updatePerson(person: string) {
    const [action, id, email, first, middle, last, position, password] = person.split('|');
    const people = this.personnel();
    if (action.toLowerCase() === 'add') {
      const person: NewSitePersonnel = {
        id: Number(id),
        email: email,
        first: first,
        middle: middle,
        last: last,
        position: position,
        password: password
      };
      people.push(person);
    } else {
      const pid = Number(id);
      let found = false;
      people.forEach((person, p) => {
        if (!found && person.id === pid) {
          found = true;
          person.email = email;
          person.first = first;
          person.middle = middle;
          person.last = last;
          person.position = position;
          person.password = password;
          people[p] = person;
        }
      });
    }
    this.personnel.set(people);
  }

  onAdd() {
    this.adminService.addTeam(this.teamForm.name().value(), this.personnel()).subscribe({
      next: (res) => {
        const teams = res.body as ITeam[]
        const list: Item[] = [];
        list.push({id: 'new', value: 'Add New Team'});
        teams.forEach(iteam => {
          const team = new Team(iteam);
          if (team.name === this.teamForm.name().value()) {
            this.adminService.selectedTeam.set(team.id);
          }
          list.push({id: team.id, value: team.name });
        });
        this.adminService.teamList.set(list);
        this.router.navigate(['/admin/teams/edit']);
      }, error: (err) => {
        if (err instanceof HttpErrorResponse) {
          if (err.status >= 400 && err.status < 500) {
            this.authService.statusMessage.set(`${err.status} - ${err.error.message}`)
          }
        }
      }
    })
  }
}
