import { Component, Input, input, signal } from '@angular/core';
import { List } from '../../general/list/list';
import { Item } from '../../general/list/list.model';
import { ISite, Site } from 'scheduler-models/scheduler/sites';
import { AuthService } from '../../services/auth-service';
import { EmployeeService } from '../../services/employee-service';
import { SiteService } from '../../services/site-service';
import { Employee } from 'scheduler-models/scheduler/employees';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Router, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-site-employees',
  imports: [
    List,
    MatCheckboxModule,
    RouterOutlet
],
  templateUrl: './site-employees.html',
  styleUrl: './site-employees.scss',
})
export class SiteEmployees {
  site = signal<Site>(new Site());
  employeeList = signal<Item[]>([]);
  showAllEmployees = signal<boolean>(false);
  selectedEmployeeID = signal<string>('new');
  @Input()
  get siteselect(): Site {
    return this.site();
  }
  set siteselect(site: ISite) {
    this.site.set(new Site(site));
    this.setEmployees();
  }

  constructor(
    private authService: AuthService,
    private empService: EmployeeService,
    private siteService: SiteService,
    private router: Router
  ) {
    const iSite = this.siteService.getSite();
    if (iSite) {
      this.site.set(new Site(iSite));
      this.setEmployees();
      this.selectedEmployeeID.set(this.siteService.selectedEmployee());
      if (this.siteService.selectedEmployee() === 'new') {
        this.router.navigate(['/site/employees/new']);
      } else {
        this.router.navigate(['/site/employees/edit/pto']);
      }
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
    if (this.site().employees) {
      this.site().employees?.forEach(iEmp => {
        const emp = new Employee(iEmp);
        if (this.showAllEmployees()) {
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
    this.employeeList.set(list);
  }

  onSelect(id: string) {
    const oldid = this.siteService.selectedEmployee().toLowerCase();
    this.selectedEmployeeID.set(id);
    this.siteService.selectedEmployee.set(id);
    if (oldid !== 'new' && id.toLowerCase() === 'new') {
      this.router.navigate(['/site/employees/new']);
    } else if (oldid === 'new' && id.toLowerCase() !== 'new') {
      this.router.navigate(['/site/employees/edit']);
    }
  }

  onShowAll(show: boolean) {
    this.showAllEmployees.set(show);
    this.setEmployees();
  }

  editorStyle(): string {
    const width = window.innerWidth - 300;
    const height = window.innerHeight - 140;
    return `margin-left: 20px; height: ${height}px;width: ${width}px;`
      + 'border: solid 1px white;';
  }
}
