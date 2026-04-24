import { Component, computed, Input, input, signal } from '@angular/core';
import { List } from '../../general/list/list';
import { Item } from '../../general/list/list.model';
import { Site } from 'scheduler-models/scheduler/sites';
import { AuthService } from '../../services/auth-service';
import { EmployeeService } from '../../services/employee-service';
import { SiteService } from '../../services/site-service';
import { Employee } from 'scheduler-models/scheduler/employees';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Router, RouterOutlet } from '@angular/router';
import { MatTooltip } from "@angular/material/tooltip";
import { MatIcon } from "@angular/material/icon";
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmationDialog } from '../../general/confirmation-dialog/confirmation-dialog';
import { Message } from 'scheduler-models/general';
import { TeamService } from '../../services/team-service';
import { Team } from 'scheduler-models/scheduler/teams';

@Component({
  selector: 'app-site-employees',
  imports: [
    List,
    MatCheckboxModule,
    RouterOutlet,
    MatTooltip,
    MatIcon,
    MatButtonModule
],
  templateUrl: './site-employees.html',
  styleUrl: './site-employees.scss',
})
export class SiteEmployees {
  private _site: string = '';
  @Input()
  get site(): string {
    return this._site;
  }
  set site(id: string) {
    this._site = id;
    this.setEmployees();
  }
  employeeList = signal<Item[]>([]);
  selectedEmployeeID = computed(() => this.siteService.selectedEmployee());
  url = signal<string>('');

  constructor(
    private authService: AuthService,
    private empService: EmployeeService,
    public siteService: SiteService,
    private teamService: TeamService,
    private router: Router,
    private dialog: MatDialog
  ) {
    const url = window.location.pathname;
    if (url.toLowerCase().startsWith('/site/editor')) {
      this.url.set('/site/editor/employees');
    } else if (url.toLowerCase().startsWith('/team/sites/edit/employees')) {
      this.url.set('/team/sites/edit/employees');
    } else {
      this.url.set('/site/employees');
    }
    if (this.teamService.selectedSite() === '' || this.url().startsWith('/site/employee')) {
      const iSite = this.siteService.getSite();
      if (iSite) {
        const site = new Site(iSite);
        this.site = site.id;
        this.teamService.selectedSite.set(site.id);
      }
    }
    this.setEmployees();
    if (this.siteService.selectedEmployee() === 'new') {
      this.router.navigate([`${this.url()}/new`]);
    } else {
      this.router.navigate([`${this.url()}/edit/pto`]);
    }
      
    this.authService.showMenu.set(false);
  }

  getEmployeeListHeight(): number {
    return window.innerHeight - 220;
  }

  setEmployees() {
    const list: Item[] = [];
    const now = new Date();
    list.push({
      id: 'new',
      value: 'Add New Employee'
    });
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      team.sites.forEach(site => {
        if (site.id.toLowerCase() === this.site.toLowerCase()) { 
          if (site.employees) {
            site.employees.forEach(iEmp => {
              const emp = new Employee(iEmp);
              if (this.siteService.showAllEmployees()) {
                list.push({
                  id: emp.id,
                  value: emp.name.getLastFirst()
                });
              } else {
                if (emp.isActive(now)) {
                  list.push({
                    id: emp.id,
                    value: emp.name.getLastFirst()
                  });
                }
              }
            });
          }
        }
      });
    }
    this.siteService.siteEmployeeList.set(list);
  }

  onSelect(id: string) {
    const oldid = this.siteService.selectedEmployee().toLowerCase();
    this.siteService.selectedEmployee.set(id);
    let url = '';
    if (oldid !== 'new' && id.toLowerCase() === 'new') {
      url = `${this.url()}/new`;
    } else if (oldid === 'new' && id.toLowerCase() !== 'new') {
      url = `${this.url()}/edit`;
    }
    if (url !== '') {
      this.router.navigate([url]);
    }
  }

  onShowAll(show: boolean) {
    this.siteService.showAllEmployees.set(show);
    this.setEmployees();
  }

  editorStyle(): string {
    const width = window.innerWidth - 300;
    const height = window.innerHeight - 140;
    return `margin-left: 20px; height: ${height}px;width: ${width}px;`
      + 'border: solid 1px white;';
  }

  deleteEmployee() {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'Employee Delete Confirmation',
        message: 'Are you sure you want to delete this Employee?',
        negativeButtonTitle: 'No',
        affirmativeButtonTitle: 'Yes'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.toLowerCase() === 'yes') {
        const iEmp = this.empService.getEmployee();
        if (iEmp) {
          const emp = new Employee(iEmp);
          this.empService.deleteEmployee(this.siteService.selectedEmployee(), emp.id).subscribe({
            next: (res) => {
              const msg = res.body as Message;
              if (msg.message.toLowerCase() === 'employee deleted') {
                const iSite = this.siteService.getSite();
                if (iSite) {
                  const site = new Site(iSite);
                  if (site.employees) {
                    let found = -1;
                    site.employees.forEach((emp, e) => {
                      if (emp.id === this.siteService.selectedEmployee()) {
                        found = e;
                      }
                    });
                    if (found >= 0) {
                      site.employees.splice(found, 1);
                    }
                  }
                  this.siteService.setSite(site);
                }
                const iTeam = this.teamService.getTeam();
                if (iTeam) {
                  const team = new Team(iTeam);
                  let found = -1;
                  team.sites.forEach(site => {
                    if (found < 0 && site.employees) {
                      site.employees.forEach((emp, e) => {
                        if (emp.id === this.siteService.selectedEmployee()) {
                          found = e;
                        }
                      });
                      if (found >= 0) {
                        site.employees.splice(found, 1);
                      }
                    }
                  });
                  this.teamService.setTeam(team);
                }
              }
            }
          });
        }
        this.setEmployees();
        this.siteService.selectedEmployee.set('new');
        this.router.navigate(['/site/employees/new']);
      }
    });
  }
}
