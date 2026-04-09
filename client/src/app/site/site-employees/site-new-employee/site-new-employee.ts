import { Component, signal } from '@angular/core';
import { email, form, FormField, required, validate } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormField } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../../../services/auth-service';
import { EmployeeService } from '../../../services/employee-service';
import { SiteService } from '../../../services/site-service';
import { TeamService } from '../../../services/team-service';
import { Company } from 'scheduler-models/scheduler/teams/company';
import { Workcenter } from 'scheduler-models/scheduler/sites/workcenters/workcenter';
import { LaborCode, Workcode } from 'scheduler-models/scheduler/labor';
import { Team } from 'scheduler-models/scheduler/teams';
import { Site } from 'scheduler-models/scheduler/sites';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MAT_MOMENT_DATE_FORMATS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { Assignment, Employee, IEmployee, Schedule, Workday } from 'scheduler-models/scheduler/employees';
import { SiteEditEmployeeAssignmentEditorWorkday } from '../site-edit-employee/site-edit-employee-assignment/site-edit-employee-assignment-editor/site-edit-employee-assignment-editor-schedule/site-edit-employee-assignment-editor-workday/site-edit-employee-assignment-editor-workday';
import { User } from 'scheduler-models/users';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Item } from '../../../general/list/list.model';

interface NewEmployeData {
  email: string;
  first: string;
  middle: string;
  last: string;
  password1: string;
  password2: string;
  company: string;
  employeeid: string;
  jobtitle: string;
  laborcode: string;
  workcenter: string;
  start: Date;
  workdays: Workday[];
}
interface ErrorMessage {
  field: string;
  message: string;
}

@Component({
  selector: 'app-site-new-employee',
  imports: [
    FormField,
    MatFormField,
    MatInputModule,
    MatSelectModule,
    MatExpansionModule,
    MatButtonModule,
    MatDatepickerModule,
    SiteEditEmployeeAssignmentEditorWorkday
  ],
  templateUrl: './site-new-employee.html',
  styleUrl: './site-new-employee.scss',
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
export class SiteNewEmployee {
  site = signal<string>('');
  team = signal<string>('');
  newEmployeeModel = signal<NewEmployeData>({
    email: '',
    first: '',
    middle: '',
    last: '',
    password1: '',
    password2: '',
    company: '',
    employeeid: '',
    jobtitle: '',
    laborcode: '',
    workcenter: '',
    start: new Date(),
    workdays: [],
  });
  newEmployeeForm = form(this.newEmployeeModel, (schema) => {
    required(schema.email, {message: 'required'});
    email(schema.email, {message: 'must be in email format'});
    required(schema.first, {message: 'required'});
    required(schema.last, {message: 'required'});
    required(schema.password1, {message: 'required'});
    required(schema.password2, {message: 'required'});
    required(schema.company, {message: 'required'});
    required(schema.employeeid, {message: 'required'});
    required(schema.jobtitle, {message: 'required'});
    required(schema.laborcode, {message: 'required'});
    required(schema.workcenter, {message: 'required'});
    validate(schema.password1, ({value}) => {
      let upper = 0;
      let lower = 0;
      let numeric = 0;
      const reUpper = new RegExp('[A-Z]');
      const reLower = new RegExp('[a-z]');
      const reNumeric = new RegExp('[0-9]');
      for (let i=0; i < value().length; i++) {
        const ch = value().substring(i,i+1);
        if (reUpper.test(ch)) {
          upper++;
        }
        if (reLower.test(ch)) {
          lower++;
        }
        if (reNumeric.test(ch)) {
          numeric++;
        }
      }
      if (upper < 2 || lower < 2 || numeric < 2 || value().length < 10) {
        let message = '';
        if (value().length < 10) {
          message = 'minimum length 10 characters'
        }
        if (upper < 2) {
          if (message !== '') {
            message += ', ';
          }
          message += 'requires 2 uppercase'
        }
        if (lower < 2) {
          if (message !== '') {
            message += ', ';
          }
          message += 'requires 2 lowercase'
        }
        if (numeric < 2) {
          if (message !== '') {
            message += ', ';
          }
          message += 'requires 2 numeric'
        }
        return {
          kind: 'minimums',
          message: message,
        };
      }
      return null;
    });
    validate(schema.password2, ({value, valueOf}) => {
      const confirm = value();
      const passwd = valueOf(schema.password1);
      if (confirm !== passwd) {
        return {
          kind: 'passwordMismatch',
          message: 'passwords do not match',
        }
      }
      return null;
    });
    validate(schema.workdays, ({value}) => {
      let bAllFields = true;
      value().forEach(wd => {
        if (wd.workcenter !== '' || wd.code !== '' || wd.hours > 0) {
          if (wd.workcenter === '' || wd.code === '' || wd.hours === 0) {
            bAllFields = false;
          }
        }
      });
      
      if (!bAllFields) {
        return {
          kind: 'workdaysComplete',
          message: 'not all workdays are complete',
        };
      }
      return null;
    });
    validate(schema.workdays, ({value}) => {
      let totalHours = 0;
      value().forEach(wd => {
        totalHours += wd.hours;
      });
      
      if (totalHours < 40) {
        return {
          kind: 'workdayshours',
          message: 'workdays must contain 40 hours',
        };
      }
      return null;
    });
  });
  errors = signal<ErrorMessage[]>([]);
  companies = signal<Company[]>([]);
  workcenters = signal<Workcenter[]>([]);
  workcodes = signal<Workcode[]>([]);
  laborcodes = signal<LaborCode[]>([]);

  constructor(
    private authService: AuthService,
    private empService: EmployeeService,
    private siteService: SiteService,
    private teamService: TeamService,
    private router: Router
  ) {
    if (this.companies().length === 0) {
      const iTeam = this.teamService.getTeam();
      if (iTeam) {
        const team = new Team(iTeam);
        this.team.set(team.id);
        const cList: Company[] = [];
        team.companies.forEach(co => {
          cList.push(new Company(co));
        });
        this.companies.set(cList);
        const workList: Workcode[] = [];
        team.workcodes.forEach(wc => {
          if (!wc.isLeave) {
            workList.push(new Workcode(wc));
          }
        })
        this.workcodes.set(workList);
      }
      const iSite = this.siteService.getSite();
      if (iSite) {
        const site = new Site(iSite);
        this.site.set(site.id);
        const wlist: Workcenter[] = [];
        site.workcenters.forEach(wc => {
          wlist.push(new Workcenter(wc));
        });
        this.workcenters.set(wlist);
        const lcList: LaborCode[] = [];
        const now = new Date();
        site.forecasts.forEach(fcst => {
          if (now.getTime() >= fcst.startDate.getTime()
            && now.getTime() <= fcst.endDate.getTime()) {
            fcst.laborCodes.forEach(lc => {
              lcList.push(new LaborCode(lc));
            })
          }
        });
        lcList.sort((a,b) => a.compareTo(b));
        this.laborcodes.set(lcList);
      }
      const sch = new Schedule();
      sch.setScheduleDays(7);
      this.newEmployeeForm.workdays().value.set(sch.workdays);
    }
    this.checkErrors();
  }

  sectionExpanded(): string {
    let answer = '';
    if (!(this.newEmployeeForm.email().valid()
      && this.newEmployeeForm.first().valid()
      && this.newEmployeeForm.last().valid()
      && this.newEmployeeForm.password1().valid()
      && this.newEmployeeForm.password2().valid())) {
      answer = 'basic'
    } else if (!(this.newEmployeeForm.company().valid()
      && this.newEmployeeForm.employeeid().valid()
      && this.newEmployeeForm.jobtitle().valid())) {
      answer = 'company';
    } else if (!(this.newEmployeeForm.laborcode().valid())) {
      answer = 'labor';
    } else if (!(this.newEmployeeForm.workcenter().valid()
      && this.newEmployeeForm.start().valid()
      && this.newEmployeeForm.workdays().valid())) {
      answer = 'assignment'
    }
    return answer;
  }

  checkErrors() {
    const list: ErrorMessage[] = [];
    if (this.newEmployeeForm().invalid()) {
      this.newEmployeeForm.email().errors().forEach(err => {
        list.push({
          field: 'Email',
          message: (err.message) ? err.message : 'problem',
        });
      });
      this.newEmployeeForm.first().errors().forEach(err => {
        list.push({
          field: 'First Name',
          message: (err.message) ? err.message : 'problem',
        });
      });
      this.newEmployeeForm.last().errors().forEach(err => {
        list.push({
          field: 'Last Name',
          message: (err.message) ? err.message : 'problem',
        });
      });
      this.newEmployeeForm.password1().errors().forEach(err => {
        list.push({
          field: 'Password',
          message: (err.message) ? err.message : 'problem',
        });
      });
      this.newEmployeeForm.password2().errors().forEach(err => {
        list.push({
          field: 'Confirm Password',
          message: (err.message) ? err.message : 'problem',
        });
      });
      this.newEmployeeForm.company().errors().forEach(err => {
        list.push({
          field: 'Company',
          message: (err.message) ? err.message : 'problem',
        });
      });
      this.newEmployeeForm.employeeid().errors().forEach(err => {
        list.push({
          field: 'Employee ID',
          message: (err.message) ? err.message : 'problem',
        });
      });
      this.newEmployeeForm.jobtitle().errors().forEach(err => {
        list.push({
          field: 'Job Title',
          message: (err.message) ? err.message : 'problem',
        });
      });
      this.newEmployeeForm.laborcode().errors().forEach(err => {
        list.push({
          field: 'Labor Code',
          message: (err.message) ? err.message : 'problem',
        });
      });
      this.newEmployeeForm.workcenter().errors().forEach(err => {
        list.push({
          field: 'Assignment Workcenter',
          message: (err.message) ? err.message : 'problem',
        });
      });
      this.newEmployeeForm.start().errors().forEach(err => {
        list.push({
          field: 'Assignment Start',
          message: (err.message) ? err.message : 'problem',
        });
      });
      this.newEmployeeForm.workdays().errors().forEach(err => {
        list.push({
          field: 'workdays',
          message: (err.message) ? err.message : 'problem',
        });
      });
    }
    this.errors.set(list);
  }

  changeWorkcenter() {
    const wkctr = this.newEmployeeForm.workcenter().value();
    if (wkctr !== '') {
      const workdays: Workday[] = [];
      let found = false;
      this.newEmployeeForm.workdays().value().forEach(wd => {
        if (wd.code !== '') {
          found = true;
          wd.workcenter = wkctr;
        }
        workdays.push(new Workday(wd));
      });
      if (!found) {
        for (let i=1; i < 6; i++) {
          workdays[i].workcenter = wkctr;
        }
      }
      this.newEmployeeForm.workdays().value.set(workdays);
    }
    this.checkErrors();
  }

  onChangeWorkday(chg: string) {
    const parts = chg.split('|');
    const wdID = Number(parts[0]);
    const field = parts[1];
    const workdays = this.newEmployeeForm.workdays().value();
    
    workdays.forEach((wd, w) => {
      if (wd.id === wdID) {
        switch (field.toLowerCase()) {
          case "code":
            wd.code = parts[2];
            break;
          case "workcenter":
            wd.workcenter = parts[2];
            break;
          case "hours":
            wd.hours = Number(parts[2]);
            break;
          case "copy":
            let wkctr = '';
            let code = '';
            let hours = 0;
            let count = w - 1;
            while (count >= 0 && wkctr === '' && code === '' && hours <= 0) {
              const other = workdays[count];
              wkctr = other.workcenter;
              code = other.code;
              hours = other.hours;
              count--;
            }
            wd.workcenter = wkctr;
            wd.code = code;
            wd.hours = hours;
            break;
          case "clear":
            wd.code = '';
            wd.workcenter = '';
            wd.hours = 0;
            break;
        }
      }
    });
    const wlist: Workday[] = [];
    workdays.forEach(wd => {
      wlist.push(new Workday(wd));
    });
    wlist.sort((a,b) => a.compareTo(b));
    this.newEmployeeForm.workdays().value.set(wlist);
    this.checkErrors()
  }

  onClear() {
    console.log('clear');
    this.newEmployeeForm().reset({
      email: '',
      first: '',
      middle: '',
      last: '',
      password1: '',
      password2: '',
      company: '',
      employeeid: '',
      jobtitle: '',
      laborcode: '',
      workcenter: '',
      start: new Date(),
      workdays: [],
    });
    const sch = new Schedule();
    sch.setScheduleDays(7);
    this.newEmployeeForm.workdays().value.set(sch.workdays);
    this.checkErrors()
  }

  onAdd() {
    if (this.newEmployeeForm().valid()) {
      const employee = new Employee();
      employee.user = new User();
      employee.email = this.newEmployeeForm.email().value();
      employee.team = this.team();
      employee.site = this.site();
      employee.user.emailAddress = employee.email;
      employee.user.firstName = this.newEmployeeForm.first().value();
      employee.name.firstname = this.newEmployeeForm.first().value();
      employee.user.middleName = this.newEmployeeForm.middle().value();
      employee.name.middlename = this.newEmployeeForm.middle().value();
      employee.user.lastName = this.newEmployeeForm.last().value();
      employee.name.lastname = this.newEmployeeForm.last().value();
      employee.user.password = this.newEmployeeForm.password1().value();
      employee.companyinfo.company = this.newEmployeeForm.company().value();
      employee.companyinfo.employeeid = this.newEmployeeForm.employeeid().value();
      employee.companyinfo.jobtitle = this.newEmployeeForm.jobtitle().value();
      const asgmt = new Assignment();
      const lcParts = this.newEmployeeForm.laborcode().value().split('|');
      asgmt.addLaborCode(lcParts[0], lcParts[1]);
      asgmt.site = this.site();
      asgmt.startDate = new Date(this.newEmployeeForm.start().value());
      asgmt.endDate = new Date(Date.UTC(9999, 11, 30));
      asgmt.workcenter = this.newEmployeeForm.workcenter().value();
      const schedule = new Schedule();
      schedule.id = 0;
      this.newEmployeeForm.workdays().value().forEach(wd => {
        schedule.workdays.push(new Workday(wd));
      });
      asgmt.schedules.push(schedule);
      employee.assignments.push(asgmt);
      this.empService.addEmployee(employee).subscribe({
        next: (res) => {
          const iEmp = res.body as IEmployee;
          if (iEmp) {
            const employee = this.useEmployeeResponse(iEmp);
            this.setEmployeeList();
            this.siteService.selectedEmployee.set(employee.id);
            this.router.navigate(['/site/employees/edit/']);
          }
        },
        error: (err) => {
          if (err instanceof HttpErrorResponse) {
            if (err.status >= 400 && err.status < 500) {
              this.authService.statusMessage.set(`${err.status} - ${err.error.message}`)
            }
          }
        }
      })
    }
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
      if (!found) {
        tSite.employees.push(new Employee(employee));
        tSite.employees.sort((a,b) => a.compareTo(b));
        this.siteService.setSite(tSite);
      }
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
      if (site.id.toLowerCase() === employee.site.toLowerCase() && !found) {
        if (site.employees) {
          site.employees.push(new Employee(employee));
          found = true;
          site.employees.sort((a,b) => a.compareTo(b));
          this.teamService.setTeam(tTeam);
        }
      }
      });
    }
    return employee;
  }

  setEmployeeList() {
    const iSite = this.siteService.getSite();
    if (iSite) {
      const site = new Site(iSite);
      const now = new Date();
      if (site.employees) {
        const eList: Item[] = [];
        eList.push({
          id: 'new',
          value: 'Add New Employee'
        });
        site.employees.forEach(iEmp => {
          const emp = new Employee(iEmp);
          if (this.siteService.showAllEmployees()) {
            eList.push({
              id: emp.id,
              value: emp.name.getLastFirst()
            });
          } else {
            if (emp.isActive(now)) {
              eList.push({
                id: emp.id,
                value: emp.name.getLastFirst()
              });
            }
          }
        });
        this.siteService.siteEmployeeList.set(eList);
      }
    }
  }
}
