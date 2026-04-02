import { Component, signal } from '@angular/core';
import { Employee, IEmployee } from 'scheduler-models/scheduler/employees';
import { TeamService } from '../../services/team-service';
import { Contact, Specialty, Team } from 'scheduler-models/scheduler/teams';
import { AuthService } from '../../services/auth-service';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { List } from '../../general/list/list';
import { Item } from '../../general/list/list.model';
import { TeamQueryContact } from './team-query-contact/team-query-contact';

@Component({
  selector: 'app-team-query',
  imports: [
    MatCardModule,
    List,
    TeamQueryContact
  ],
  templateUrl: './team-query.html',
  styleUrl: './team-query.scss',
})
export class TeamQuery {
  employees = signal<Employee[]>([]);
  employeeList = signal<Item[]>([]);
  teamid = signal<string>('');
  contactTypeList = signal<Contact[]>([]);
  specialtiesList = signal<Specialty[]>([]);
  selectedEmployee = signal<Employee>(new Employee());

  constructor(
    private authService: AuthService,
    private teamService: TeamService
  ) {
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      this.teamid.set(team.id);
      const specList: Specialty[] = [];
      const cTypesList: Contact[] = [];
      team.contacttypes.forEach(ct => {
        cTypesList.push(new Contact(ct));
      });
      cTypesList.sort((a,b) => a.compareTo(b));
      team.specialties.forEach(spec => {
        specList.push(new Specialty(spec));
      });
      specList.sort((a,b) => a.compareTo(b));
      this.contactTypeList.set(cTypesList);
      this.specialtiesList.set(specList);
    }
    this.setEmployees();
  }

  setEmployees() {
    this.teamService.getSimpleQuery(this.teamid()).subscribe({
      next: (res) => {
        const tEmployees = res.body as IEmployee[];
        if (tEmployees.length > 0) {
          const list: Employee[] = [];
          const eList: Item[] = [];
          tEmployees.forEach(iEmp => {
            const emp = new Employee(iEmp);
            list.push(emp);
            eList.push({
              id: emp.id,
              value: `${emp.name.getLastFirst()} (${emp.site.toUpperCase()})`
            });
          });
          this.employees.set(list);
          this.employeeList.set(eList);
        }
      },
      error: (err) => {
        console.log(err);
        if (err instanceof HttpErrorResponse) {
          if (err.status >= 400 && err.status < 500) {
            this.authService.statusMessage.set(`${err.status} - ${err.error.message}`)
          }
        }
      }
    });
  }

  onSelect(id: string) {
    this.employees().forEach(iEmp => {
      const emp = new Employee(iEmp);
      if (emp.id === id) {
        this.selectedEmployee.set(emp);
      }
    })
  }

  getSpecialtyName(id: number): string {
    let answer = '';
    this.specialtiesList().forEach(spec => {
      if (spec.id === id) {
        answer = spec.name;
      }
    });
    return answer;
  }
}
