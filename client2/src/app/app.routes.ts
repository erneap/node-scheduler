import { Routes } from '@angular/router';
import { MustChange } from './authentication/must-change/must-change';
import { Login } from './authentication/login/login';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'mustchange', component: MustChange },
  { path: '**', redirectTo: '/login' }
];
