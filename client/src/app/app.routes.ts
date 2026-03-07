import { Routes } from '@angular/router';
import { Login } from './authenticate/login/login';
import { EmployeeScheduleComponent } from './employee/employee-schedule/employee-schedule.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: '/employee',
    children: [
      { path: '', redirectTo: '/employee/schedule', pathMatch: 'full' },
      { path: 'schedule', component: EmployeeScheduleComponent },
      { path: '**', component: EmployeeScheduleComponent }
    ]
  },
  { path: '**', component: Login }
];
