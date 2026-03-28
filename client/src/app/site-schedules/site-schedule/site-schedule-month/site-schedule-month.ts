import { Component, signal } from '@angular/core';
import { Site } from 'scheduler-models/scheduler/sites';
import { SiteService } from '../../../services/site-service';
import { Employee } from 'scheduler-models/scheduler/employees';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatTooltip } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { SiteScheduleMonthWorkcenter } from './site-schedule-month-workcenter/site-schedule-month-workcenter';

@Component({
  selector: 'app-site-schedule-month',
  imports: [
    ReactiveFormsModule,
    MatSelectModule,
    MatInputModule,
    MatTooltip,
    MatIconModule,
    MatExpansionModule,
    SiteScheduleMonthWorkcenter
  ],
  templateUrl: './site-schedule-month.html',
  styleUrl: './site-schedule-month.scss',
})
export class SiteScheduleMonth {
  months: string[] = new Array("January", "February", "March", "April", "May",
  "June", "July", "August", "September", "October", "November", "December");

  month = signal<Date>(new Date());
  monthLabel = signal<string>('');
  site = signal<Site>(new Site());
  monthForm: FormGroup;

  constructor(
    private siteService: SiteService,
    private builder: FormBuilder
  ) {
    const iSite = this.siteService.getSite();
    this.site.set(new Site(iSite));
    const now = new Date();
    this.month.set(new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)));
    this.monthLabel.set(`${this.months[now.getMonth()]} ${now.getFullYear()}`);
    this.monthForm = this.builder.group({
      month: this.month().getUTCMonth(),
      year: this.month().getUTCFullYear(),
    });
    this.setEmployeeLists();
  }

  setEmployeeLists() {
    const end = new Date(Date.UTC(this.month().getUTCFullYear(), 
      this.month().getUTCMonth() + 1, 1));
    // clear old employee lists
    this.site().workcenters.forEach((wkctr, w) => {
      wkctr.clearEmployees();
      this.site().workcenters[w] = wkctr;
    });
    // assign working employees to the workcenters
    if (this.site().employees) {
      this.site().employees?.forEach(iEmp => {
        const emp = new Employee(iEmp);
        
        if (emp.atSite(this.site().id, this.month(), end)) {
          this.site().assign(emp, this.month(), end);
        }
      })
    }
  }

  changeMonth(direction: string, size: string) {
    if (size.toLowerCase().substring(0,1) === 'y') {
      if (direction.toLowerCase().substring(0,1) === 'u') {
        this.month.set(new Date(Date.UTC(this.month().getUTCFullYear() + 1, 
          this.month().getUTCMonth(), 1)));
      } else {
        this.month.set(new Date(Date.UTC(this.month().getUTCFullYear() - 1, 
          this.month().getUTCMonth(), 1)));
      }
    } else if (size.toLowerCase().substring(0,1) === 'm') {
      if (direction.toLowerCase().substring(0,1) === 'u') {
        this.month.set(new Date(Date.UTC(this.month().getUTCFullYear(), 
          this.month().getUTCMonth() + 1, 1)));
      } else {
        this.month.set(new Date(Date.UTC(this.month().getUTCFullYear(), 
          this.month().getUTCMonth() - 1, 1)));
      }
    }
    this.monthForm.get('month')?.setValue(this.month().getUTCMonth());
    this.monthForm.get('year')?.setValue(this.month().getUTCFullYear());
    this.setEmployeeLists();
  }

  selectMonth() {

  }

  onPrintSubmit() {

  }
}
