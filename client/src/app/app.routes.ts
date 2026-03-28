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
import { SiteSchedule } from './site-schedules/site-schedule/site-schedule';

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
          { path: '**', component: SiteSchedule },
        ]
      },
      { path: '**', component: SiteSchedule },
    ]
  },
  { path: '**', redirectTo: '/login' }
];
