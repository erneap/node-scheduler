import { Routes } from '@angular/router';
import { Login } from './authentication/login/login';
import { MustChange } from './authentication/must-change/must-change';
import { EmployeeSchedule } from './employee/employee-schedule/employee-schedule';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'mustchange', component: MustChange },
  { path: 'employee',
    children: [
      { path: '', redirectTo: 'employee/schedule', pathMatch: 'full'},
      { path: 'schedule', component: EmployeeSchedule},
      { path: '**', component: EmployeeSchedule},
    ]
  },
  { path: '**', redirectTo: '/login' }

];
