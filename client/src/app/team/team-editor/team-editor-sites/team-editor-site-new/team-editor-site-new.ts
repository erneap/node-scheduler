import { Component, signal } from '@angular/core';
import { form, FormField, max, min, minLength, required } from '@angular/forms/signals';
import { NewSitePersonnel } from 'scheduler-models/scheduler/sites/web';
import { AuthService } from '../../../../services/auth-service';
import { TeamService } from '../../../../services/team-service';
import { Router } from '@angular/router';
import { Team } from 'scheduler-models/scheduler/teams';
import { HttpErrorResponse } from '@angular/common/http';
import { TeamEditorSiteNewPersonnel } from './team-editor-site-new-personnel/team-editor-site-new-personnel';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { Item } from '../../../../general/list/list.model';

interface NewSiteData {
  siteid: string;
  name: string;
  offset: number;
}
interface ErrorMessage {
  field: string;
  message: string;
}
@Component({
  selector: 'app-team-editor-site-new',
  imports: [
    TeamEditorSiteNewPersonnel,
    FormField,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './team-editor-site-new.html',
  styleUrl: './team-editor-site-new.scss',
})
export class TeamEditorSiteNew {
  team = signal<string>('');
  newSiteModel = signal<NewSiteData>({
    siteid: '',
    name: '',
    offset: 0,
  });
  personnel = signal<NewSitePersonnel[]>([]);
  newSiteForm = form(this.newSiteModel, (s) => {
    required(s.siteid, { message: 'required'});
    required(s.name, {message: 'required'});
    min(s.offset, -12, {message: 'must be more than -12 hours'});
    max(s.offset, 12, {message: 'must be less than 12'});
  });
  errors = signal<ErrorMessage[]>([]);

  constructor(
    private authService: AuthService,
    private teamService: TeamService,
    private router: Router
  ) {
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      this.team.set(team.id);
    }
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
    console.log(this.personnel());
    this.checkErrors();
  }
    
  checkErrors() {
    const list: ErrorMessage[] = [];
    if (this.newSiteForm().invalid()) {
      this.newSiteForm.siteid().errors().forEach(err => {
        list.push({
          field: 'Site ID',
          message: (err.message) ? err.message : 'problem',
        });
      });
      this.newSiteForm.name().errors().forEach(err => {
        list.push({
          field: 'Site Name',
          message: (err.message) ? err.message : 'problem',
        });
      });
      this.newSiteForm.offset().errors().forEach(err => {
        list.push({
          field: 'UTC Offset',
          message: (err.message) ? err.message : 'problem',
        });
      });
      if (this.personnel().length < 1) {
        list.push({
          field: 'Personnel to Assign',
          message: 'must have at least 1 person assigned'
        });
      }
    }
    this.errors.set(list);
  }

  onAdd() {
    if (this.newSiteForm().valid()) {
      this.teamService.addSite(this.team(), this.newSiteForm.siteid().value(), 
        this.newSiteForm.name().value(), this.newSiteForm.offset().value(),
        this.personnel()).subscribe({
        next: (res) => {
          // the updating of the team site list is recorded in cache by the service,
          // so all we need to do is set the new site id as the team selected site
          // and reroute to the edit page.
          this.teamService.selectedSite.set(this.newSiteForm.siteid().value());
          const iTeam = this.teamService.getTeam();
          if (iTeam) {
            const team = new Team(iTeam);
            const list: Item[] = [];
            list.push({id: 'new', value: 'Add New Site'});
            team.sites.forEach(site => {
              list.push({id: site.id.toLowerCase(), value: site.name});
            });
            this.teamService.sites.set(list);
          }
          this.router.navigate(['/team/sites/edit']);
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
  }

  onClear() {
    this.newSiteForm.siteid().value.set('');
    this.newSiteForm.name().value.set('');
    this.newSiteForm.offset().value.set(0);
    this.personnel.set([]);
    this.checkErrors();
  }

  sectionExpanded(): string {
    let answer = '';
    if (!(this.newSiteForm.siteid().valid()
      && this.newSiteForm.name().valid()
      && this.newSiteForm.offset().valid())) {
      answer = 'basic'
    } else if (!(this.personnel().length > 0)) {
      answer = 'personnel';
    } else {
      answer = 'action'
    }
    return answer;
  }
}
