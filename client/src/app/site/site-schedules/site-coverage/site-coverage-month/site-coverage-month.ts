import { Component, signal } from '@angular/core';
import { Site } from 'scheduler-models/scheduler/sites';
import { IScheduleWorkcenter, ScheduleWorkcenter } from 'scheduler-models/scheduler/sites/schedule';
import { AuthService } from '../../../../services/auth-service';
import { SiteService } from '../../../../services/site-service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { SiteCoverageMonthWorkcenter } from './site-coverage-month-workcenter/site-coverage-month-workcenter';

@Component({
  selector: 'app-site-coverage-month',
  imports: [
    ReactiveFormsModule,
    MatSelectModule,
    MatInputModule,
    MatIconModule,
    MatExpansionModule,
    SiteCoverageMonthWorkcenter
  ],
  templateUrl: './site-coverage-month.html',
  styleUrl: './site-coverage-month.scss',
})
export class SiteCoverageMonth {
  months: string[] = new Array("January", "February", "March", "April", "May",
  "June", "July", "August", "September", "October", "November", "December");

  workcenters = signal<ScheduleWorkcenter[]>([]);
  month = signal<Date>(new Date());
  site = signal<Site>(new Site());

  monthForm: FormGroup;

  constructor(
    private authService: AuthService,
    private siteService: SiteService,
    private builder: FormBuilder
  ) {
    const iSite = this.siteService.getSite();
    this.site.set(new Site(iSite));
    const now = new Date();
    this.month.set(new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1)));
    this.monthForm = this.builder.group({
      month: this.month().getUTCMonth(),
      year: this.month().getUTCFullYear(),
    });
    this.getMonth();
    
  }

  getMonth() {
    const user = this.authService.getUser();
    if (user) {
      this.siteService.getSiteSchedule(user.id, this.month()).subscribe({
        next: (res) => {
          const wkctrs: ScheduleWorkcenter[] = [];
          const data = res.body as IScheduleWorkcenter[];
          data.forEach(wc => {
            wkctrs.push(new ScheduleWorkcenter(wc));
          });
          wkctrs.sort((a,b) => a.compareTo(b));
          this.workcenters.set(wkctrs);
        },
        error: (err) => {
          console.log(err);
          if (err instanceof HttpErrorResponse) {
            if (err.status >= 400 && err.status < 500) {
              this.authService.statusMessage.set(`${err.status} - ${err.error.message}`)
            }
          }
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
    this.getMonth();
  }

  selectMonth() {
    const iMonth = this.monthForm.get('month')?.value
    const iYear = this.monthForm.get('year')?.value;
    if (iMonth && iYear) {
      this.month.set(new Date(Date.UTC(Number(iYear), Number(iMonth), 1)));
      this.getMonth();
    }
  }
}
