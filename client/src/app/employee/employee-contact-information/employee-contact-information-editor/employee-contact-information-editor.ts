import { Component, Input } from '@angular/core';
import { EmployeeContactInformationItem } from '../employee-contact-information-item/employee-contact-information-item';
import { Contact, Employee } from 'scheduler-models/scheduler/employees';
import { EmployeeService } from '../../../services/employee-service';
import { TeamService } from '../../../services/team-service';
import * as teams from 'scheduler-models/scheduler/teams';

@Component({
  selector: 'app-employee-contact-information-editor',
  imports: [
    EmployeeContactInformationItem
  ],
  templateUrl: './employee-contact-information-editor.html',
  styleUrl: './employee-contact-information-editor.scss',
})
export class EmployeeContactInformationEditor {
  private _employee: string = '';
  @Input()
  get employee(): string {
    return this._employee;
  }
  set employee(id: string) {
    this._employee = id;
  }
  contactTypes: teams.Contact[];

  constructor(
    private empService: EmployeeService,
    private teamService: TeamService
  ) {
    this.contactTypes = [];
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new teams.Team(iTeam);
      team.contacttypes.forEach(ct => {
        this.contactTypes.push(new teams.Contact(ct));
      });
      this.contactTypes.sort((a,b) => a.compareTo(b));
    }
    if (this.employee === '') {
      const iEmp = this.empService.getEmployee();
      if (iEmp) {
        const emp = new Employee(iEmp);
        this.employee = emp.id;
      }
    }
  }}
