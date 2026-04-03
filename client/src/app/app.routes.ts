import { Routes } from '@angular/router';
import { Login } from './authentication/login/login';
import { MustChange } from './authentication/must-change/must-change';
import { EmployeeSchedule } from './employee/employee-schedule/employee-schedule';
import { NotAuthorized } from './authentication/not-authorized/not-authorized';
import { EmployeeLeaves } from './employee/employee-leaves/employee-leaves';
import { EmployeeProfile } from './employee/employee-profile/employee-profile';
import { EmployeeCompany } from './employee/employee-company/employee-company';
import { EmployeeSecurity } from './employee/employee-security/employee-security';
import { EmployeeLeaveRequests } from './employee/employee-leave-requests/employee-leave-requests';
import { EmployeeContactInformation } from './employee/employee-contact-information/employee-contact-information';
import { EmployeeSpecialties } from './employee/employee-specialties/employee-specialties';
import { SiteSchedule } from './site//site-schedules/site-schedule/site-schedule';
import { SiteCoverage } from './site/site-schedules/site-coverage/site-coverage';
import { SiteMidsListing } from './site/site-schedules/site-mids-listing/site-mids-listing';
import { TeamQuery } from './team/team-query/team-query';
import { SiteEmployees } from './site/site-employees/site-employees';
import { SiteEditEmployeePTO } from './site/site-employees/site-edit-employee/site-edit-employee-pto/site-edit-employee-pto';
import { SiteNewEmployee } from './site/site-employees/site-new-employee/site-new-employee';
import { SiteEditEmployee } from './site/site-employees/site-edit-employee/site-edit-employee';
import { SiteEditEmployeeLeaveRequests } from './site/site-employees/site-edit-employee/site-edit-employee-leave-requests/site-edit-employee-leave-requests';
import { SiteEditEmployeeProfile } from './site/site-employees/site-edit-employee/site-edit-employee-profile/site-edit-employee-profile';
import { SiteEditEmployeeSecurity } from './site/site-employees/site-edit-employee/site-edit-employee-security/site-edit-employee-security';
import { SiteEditEmployeeCompany } from './site/site-employees/site-edit-employee/site-edit-employee-company/site-edit-employee-company';
import { SiteEditEmployeeContacts } from './site/site-employees/site-edit-employee/site-edit-employee-contacts/site-edit-employee-contacts';
import { SiteEditEmployeeSpecialties } from './site/site-employees/site-edit-employee/site-edit-employee-specialties/site-edit-employee-specialties';
import { SiteEditEmployeeLeaves } from './site/site-employees/site-edit-employee/site-edit-employee-leaves/site-edit-employee-leaves';
import { SiteEditEmployeeLeaveBalances } from './site/site-employees/site-edit-employee/site-edit-employee-leave-balances/site-edit-employee-leave-balances';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'mustchange', component: MustChange },
  { path: 'unauthorized', component: NotAuthorized },
  { path: 'employee',
    children: [
      { path: '', redirectTo: 'employee/schedule', pathMatch: 'full'},
      { path: 'schedule', component: EmployeeSchedule},
      { path: 'leaveschart', component: EmployeeLeaves },
      { path: 'profile', component: EmployeeProfile },
      { path: 'company', component: EmployeeCompany },
      { path: 'security', component: EmployeeSecurity },
      { path: 'leaverequest', component: EmployeeLeaveRequests },
      { path: 'contacts', component: EmployeeContactInformation },
      { path: 'specialties', component: EmployeeSpecialties },
      { path: '**', component: EmployeeSchedule},
    ]
  },
  { path: 'site', 
    children: [
      { path: '', redirectTo: 'site/schedule/schedule', pathMatch: 'full'},
      { path: 'schedule',
        children: [
          { path: '', redirectTo: 'site/schedule/schedule', pathMatch: 'full' },
          { path: 'schedule', component: SiteSchedule },
          { path: 'coverage', component: SiteCoverage },
          { path: 'mids', component: SiteMidsListing },
          { path: '**', component: SiteSchedule },
        ]
      },
      { path: 'employees', component: SiteEmployees,
        children: [
          {path: 'new', component: SiteNewEmployee },
          { path: 'edit', component: SiteEditEmployee,
            children: [
              { path: '', redirectTo: '/site/employees/edit/pto', pathMatch: 'full' },
              { path: 'pto', component: SiteEditEmployeePTO },
              { path: 'leaves', component: SiteEditEmployeeLeaves },
              { path: 'balances', component: SiteEditEmployeeLeaveBalances },
              { path: 'leaverequests', component: SiteEditEmployeeLeaveRequests },
              { path: 'personal', component: SiteEditEmployeeProfile },
              { path: 'security', component: SiteEditEmployeeSecurity },
              { path: 'company', component: SiteEditEmployeeCompany },
              { path: 'contacts', component: SiteEditEmployeeContacts },
              { path: 'specialties', component: SiteEditEmployeeSpecialties },
              { path: '**', component: SiteEditEmployeePTO }
            ]
          }
        ]
       },
      { path: '**', component: SiteSchedule },
    ]
  },
  { path: 'query', component: TeamQuery },
  { path: '**', redirectTo: '/login' }
];
