import { Component, signal } from '@angular/core';
import { Employee, IEmployee } from 'scheduler-models/scheduler/employees';
import { TeamService } from '../../services/team-service';
import { Team } from 'scheduler-models/scheduler/teams';
import { AuthService } from '../../services/auth-service';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { List } from '../../general/list/list';
import { Item } from '../../general/list/list.model';

@Component({
  selector: 'app-team-query',
  imports: [
    MatCardModule,
    List
  ],
  templateUrl: './team-query.html',
  styleUrl: './team-query.scss',
})
export class TeamQuery {
  employees = signal<Employee[]>([]);
  employeeList = signal<Item[]>([]);
  teamid = signal<string>('');

  constructor(
    private authService: AuthService,
    private teamService: TeamService
  ) {
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      this.teamid.set(team.id);
    }
    this.setEmployees();
  }

  setEmployees() {
    this.teamService.getSimpleQuery(this.teamid()).subscribe({
      next: (res) => {
        const tEmployees = res.body as IEmployee[];
        console.log(tEmployees.length);
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
}
