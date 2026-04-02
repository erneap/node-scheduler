import { Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterOutlet, RouterLinkWithHref } from '@angular/router';
import { Employee } from 'scheduler-models/scheduler/employees';

@Component({
  selector: 'app-site-edit-employee',
  imports: [
    RouterOutlet,
    MatToolbarModule,
    MatButtonModule,
    RouterLinkWithHref
],
  templateUrl: './site-edit-employee.html',
  styleUrl: './site-edit-employee.scss',
})
export class SiteEditEmployee {
  
}
