import { Component, input, Input, signal } from '@angular/core';
import { Item } from '../../../../../general/list/list.model';
import { Employee, IEmployee, Schedule, Variation } from 'scheduler-models/scheduler/employees';
import { AuthService } from '../../../../../services/auth-service';
import { EmployeeService } from '../../../../../services/employee-service';
import { SiteService } from '../../../../../services/site-service';
import { TeamService } from '../../../../../services/team-service';
import { Workcode } from 'scheduler-models/scheduler/labor';
import { Workcenter } from 'scheduler-models/scheduler/sites/workcenters/workcenter';
import { Team } from 'scheduler-models/scheduler/teams';
import { form, FormField } from '@angular/forms/signals';
import { List } from "../../../../../general/list/list";
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MAT_MOMENT_DATE_FORMATS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { SiteEditEmployeeVariationEditorSchedule } from './site-edit-employee-variation-editor-schedule/site-edit-employee-variation-editor-schedule';
import { HttpErrorResponse } from '@angular/common/http';

interface VariationData {
  variationid: number;
  start: Date;
  end: Date;
  mids: boolean;
  showAll: boolean;
}

@Component({
  selector: 'app-site-edit-employee-variation-editor',
  imports: [
    FormField,
    MatFormField,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
    List,
    MatCheckboxModule,
    SiteEditEmployeeVariationEditorSchedule
  ],
  templateUrl: './site-edit-employee-variation-editor.html',
  styleUrl: './site-edit-employee-variation-editor.scss',
  providers: [
    { provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { useUtc: true } },
    {
        provide: DateAdapter,
        useClass: MomentDateAdapter,
        deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    },
    { provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS },
  ]
})
export class SiteEditEmployeeVariationEditor {
  private _employee: string = '';
  @Input()
  get employee(): string {
    return this._employee;
  }
  set employee(id: string) {
    this._employee = id;
    this.setEmployeeList();
  }
  variationList = signal<Variation[]>([]);
  list = signal<Item[]>([]);
  site = signal<string>('');
  listheight = input<number>(0);
  listwidth = input<number>(280);
  selectedID = signal<string>('-1');
  selectedVariation = signal<Variation>(new Variation());
  schedule = signal<Schedule>(new Schedule());
  workcodes = signal<Workcode[]>([]);
  workcenters = signal<Workcenter[]>([]);
  variationModel = signal<VariationData>({
    variationid: -1,
    start: new Date(),
    end: new Date(),
    mids: false,
    showAll: false,
  });
  variationForm = form(this.variationModel);

  constructor(
    private authService: AuthService,
    private empService: EmployeeService,
    private siteService: SiteService,
    private teamService: TeamService
  ) {
    // workcodes are derived from the employee's team, while the workcenters and labor
    // codes are derived from the employee's site.  So get the team and pull in the work
    // (not leave) codes, then find the employee in the various sites' employee list and
    // when found, create the workcenter and laborcode lists from the associated site.
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      const wlist: Workcode[] = [];
      team.workcodes.forEach(wc => {
        if (!wc.isLeave) {
          wlist.push(new Workcode(wc));
        }
      });
      wlist.sort((a,b) => a.compareTo(b));
      this.workcodes.set(wlist);
    }
  }

  listHeight(): number {
    let height = window.innerHeight - 400;
    if (this.listheight() > 0) {
      height = this.listheight();
    }
    return height;
  }

  setEmployeeList() {
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      let found = false;
      const now = new Date();
      const start = new Date(Date.UTC(now.getFullYear() - 1, 0, 1));
      const end = new Date(Date.UTC(now.getFullYear() + 2, 0, 1));
      team.sites.forEach(site => {
        if (!found && site.employees) {
          site.employees.forEach(iEmp => {
            if (!found) {
              const emp = new Employee(iEmp);
              if (emp.id === this.employee) {
                found = true;
                this.site.set(site.id);

                const wclist: Workcenter[] = [];
                site.workcenters.forEach(wc => {
                  wclist.push(new Workcenter(wc));
                });
                wclist.sort((a,b) => a.compareTo(b));
                this.workcenters.set(wclist);

                const vList: Item[] = [];
                vList.push({
                  id: '-1',
                  value: 'Add New Variation'
                });
                const now = new Date();
                const formatter = Intl.DateTimeFormat('en-US', {
                  year: 'numeric',
                  month: 'short',
                  'day': 'numeric'
                });
                const varis: Variation[] = [];
                emp.variations.sort((a,b) => b.compareTo(a));
                emp.variations.forEach(vari => {
                  if (this.variationForm.showAll().value()
                    || vari.startdate.getTime() > now.getTime()
                    || vari.enddate.getTime() > now.getTime()) {
                    let name = '';
                    if (vari.mids) {
                      name += '(MIDS) '
                    }
                    name += `${formatter.format(vari.startdate)} - `
                      + `${formatter.format(vari.enddate)}`
                    vList.push({
                      id: `${vari.id}`,
                      value: name
                    });
                  }
                  varis.push(new Variation(vari));
                });
                this.variationList.set(varis);
                this.list.set(vList);
              }
            }
          });
        }
      });
    }
  }

  showAll() {
    this.setEmployeeList();
  }

  selectVariation(vid: string) {
    this.selectedID.set(vid);
    const id = Number(vid);
    this.variationList().forEach(vari => {
      if (vari.id === id) {
        this.selectedVariation.set(new Variation(vari));
        this.schedule.set(new Schedule(this.selectedVariation().schedule));
        this.variationForm.variationid().value.set(vari.id);
        this.variationForm.start().value.set(vari.startdate);
        this.variationForm.end().value.set(vari.enddate);
        this.variationForm.mids().value.set(vari.mids);
      }
    });
    if (id < 0) {
      this.selectedVariation.set(new Variation());
      this.schedule.set(new Schedule());
      this.variationForm.variationid().value.set(-1);
      this.variationForm.start().value.set(new Date());
      this.variationForm.end().value.set(new Date());
      this.variationForm.mids().value.set(false);
    }
  }

  onChangeVariation(field: string) {
    if (this.selectedVariation().id >= 0) {
      let value = '';
      switch (field.toLowerCase()) {
        case "start":
          value = this.convertDateToString(new Date(this.variationForm.start().value()));
          break;
        case "end":
          value = this.convertDateToString(new Date(this.variationForm.end().value()));
          break;
        case "mids":
          value = `${this.variationForm.mids().value()}`;
          break;
      }
      this.empService.updateVariation(this.employee, this.selectedVariation().id,
        field, value).subscribe({
        next: (res) => {
          const iEmp = res.body as IEmployee;
          if (iEmp) {
            const employee = this.useEmployeeResponse(iEmp);
            this.setEmployeeList();
            employee.variations.forEach(vari => {
              if (vari.id === this.selectedVariation().id) {
                this.selectedVariation.set(new Variation(vari));
                this.schedule.set(new Schedule(vari.schedule));
              }
            });
          }
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

  onAdd() {
    const start = new Date(this.variationForm.start().value());
    this.empService.addVariation(this.employee, this.site(), start).subscribe({
      next: (res) => {
        const iEmp = res.body as IEmployee;
        if (iEmp) {
          const employee = this.useEmployeeResponse(iEmp);
          this.setEmployeeList()
          let max = -1;
          let variation = new Variation();
          employee.variations.forEach(asgmt => {
            if (max < asgmt.id) {
              max = asgmt.id;
              variation = new Variation(asgmt);
            }
          });
          this.selectedVariation.set(variation);
          this.schedule.set(new Schedule(variation.schedule));
          this.selectedID.set(`${variation.id}`);
          this.variationForm.variationid().value.set(variation.id);
          this.variationForm.start().value.set(variation.startdate);
          this.variationForm.end().value.set(variation.enddate);
          this.variationForm.mids().value.set(variation.mids);
        }
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
  
  convertDateToString(date: Date): string {
    let answer = `${date.getUTCFullYear()}-`;
    if (date.getUTCMonth() + 1 < 10) {
      answer += '0';
    }
    answer += `${date.getUTCMonth() + 1}-`;
    if (date.getUTCDate() < 10) {
      answer += '0';
    }
    answer += `${date.getUTCDate()}`;
    return answer;
  }

  useEmployeeResponse(iEmp: IEmployee): Employee {
    const employee = new Employee(iEmp);
    const tEmp = this.empService.getEmployee();
    if (tEmp && tEmp.id === employee.id) {
      this.empService.setEmployee(employee);
    }
    const tSite = this.siteService.getSite();
    let found = false;
    if (tSite && tSite.employees) {
      tSite.employees.forEach((emp, e) => {
        if (!found && emp.id === employee.id && tSite.employees) {
          tSite.employees[e] = new Employee(employee);
          found = true;
          this.siteService.setSite(tSite);
        }
      });
    }
    found = false;
    const tTeam = this.teamService.getTeam();
    if (tTeam) {
      tTeam.sites.forEach((site, s) => {
        if (!found && site.employees) {
          site.employees.forEach((emp, e) => {
            if (!found && emp.id === employee.id && site.employees) {
              site.employees[e] = new Employee(employee);
              found = true;
              this.teamService.setTeam(tTeam);
            }
          });
        }
      });
    }
    return employee;
  }

  onChanged(chg: string) {
    console.log(chg);
    const sparts = chg.split('|');
    if (sparts.length > 1) {
      const action = sparts[1];
      const schid = Number(sparts[0]);
      let workday: number | undefined = undefined;
      let field = '';
      let value = '';
      switch (action.toLowerCase()) {
        case "showdates":
          field = 'dates';
          value = sparts[2];
          break;
      }
      if (field !== '') {
        console.log(field);
        this.empService.updateVariation(this.employee, this.selectedVariation().id, field, 
          value, schid, workday).subscribe({
          next: (res) => {
            const iEmp = res.body as IEmployee;
            if (iEmp) {
              const employee = this.useEmployeeResponse(iEmp);
              this.setEmployeeList();
              employee.variations.forEach(vari => {
                if (vari.id === this.selectedVariation().id) {
                  this.selectedVariation.set(new Variation(vari));
                  this.schedule.set(new Schedule(vari.schedule));
                }
              });
            }
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
  }
}
