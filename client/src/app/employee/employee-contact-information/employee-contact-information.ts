import { Component, Input } from '@angular/core';
import { Contact, Team } from 'scheduler-models/scheduler/teams';
import { TeamService } from '../../services/team-service';
import { MatCardModule } from '@angular/material/card';
import { EmployeeContactInformationItem } from './employee-contact-information-item/employee-contact-information-item';
import { EmployeeService } from '../../services/employee-service';
import { Employee } from 'scheduler-models/scheduler/employees';

@Component({
  selector: 'app-employee-contact-information',
  imports: [
    MatCardModule,
    EmployeeContactInformationItem
  ],
  templateUrl: './employee-contact-information.html',
  styleUrl: './employee-contact-information.scss',
})
export class EmployeeContactInformation {
  private _employee: string = '';
  @Input()
  get employee(): string {
    return this._employee;
  }
  set employee(id: string) {
    this._employee = id;
  }
  contactTypes: Contact[];

  constructor(
    private empService: EmployeeService,
    private teamService: TeamService
  ) {
    this.contactTypes = [];
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      team.contacttypes.forEach(ct => {
        this.contactTypes.push(new Contact(ct));
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
  }
}
