import { Component, input } from '@angular/core';
import { Employee } from 'scheduler-models/scheduler/employees';
import * as teams from 'scheduler-models/scheduler/teams';
import * as employee from 'scheduler-models/scheduler/employees';

@Component({
  selector: 'app-team-query-contact',
  imports: [],
  templateUrl: './team-query-contact.html',
  styleUrl: './team-query-contact.scss',
})
export class TeamQueryContact {
  contactType = input<teams.Contact>(new teams.Contact());
  contacts = input<employee.Contact[]>([]);

  getContact(): string {
    let answer = ' ';
    this.contacts().forEach(contact => {
      if (this.contactType().id === contact.typeid) {
        answer = contact.value;
      }
    })
    return answer;
  }
}
