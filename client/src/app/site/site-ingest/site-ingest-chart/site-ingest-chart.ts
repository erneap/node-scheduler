import { Component, ElementRef, signal, viewChild, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { form, FormField, required } from '@angular/forms/signals';
import { Company } from 'scheduler-models/scheduler/teams/company';
import { SiteService } from '../../../services/site-service';
import { TeamService } from '../../../services/team-service';
import { Team } from 'scheduler-models/scheduler/teams';
import { Site } from 'scheduler-models/scheduler/sites';
import { EmployeeService } from '../../../services/employee-service';
import { Employee } from 'scheduler-models/scheduler/employees';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../../services/auth-service';
import { SiteIngestChartMonth } from './site-ingest-chart-month/site-ingest-chart-month';
import { Workcode } from 'scheduler-models/scheduler/labor';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface IngestData {
  company: string;
  files: string;
}

@Component({
  selector: 'app-site-ingest-chart',
  imports: [
    FormField,
    FormsModule,
    SiteIngestChartMonth,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './site-ingest-chart.html',
  styleUrl: './site-ingest-chart.scss',
})
export class SiteIngestChart {
  fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');
  company = signal<string>('');
  ingestMethod = signal<string>('manual');
  companies = signal<Company[]>([]);
  uploadFiles = signal<File[]>([]);
  uploadModel = signal<IngestData>({
    company: '',
    files: ''});
  uploadForm = form(this.uploadModel, s => {
    required(s.files);
  });
  team = signal<string>('');
  site = signal<string>('');
  month = signal<string>('');
  user = signal<string>('');
  workcodes = signal<Map<string, Workcode>>(new Map<string, Workcode>());

  constructor(
    private authService: AuthService,
    private empService: EmployeeService,
    private siteService: SiteService,
    private teamService: TeamService
  ) {
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      this.team.set(team.id);
      const companies: Company[] = [];
      team.companies.forEach(co => {
        companies.push(new Company(co));
      });
      companies.sort((a,b) => a.compareTo(b));
      this.companies.set(companies);
      const workcodes = new Map<string, Workcode>();
      team.workcodes.forEach(wc => {
        workcodes.set(wc.id, new Workcode(wc));
      });
      this.workcodes.set(workcodes);
    }
    const iSite = this.siteService.getSite();
    if (iSite) {
      const site = new Site(iSite);
      this.site.set(site.id);
    }
    const iEmp = this.empService.getEmployee();
    if (iEmp) {
      const employee = new Employee(iEmp);
      this.user.set(employee.id);
      this.uploadForm.company().value.set(employee.companyinfo.company);
      this.onChangeCompany();
    }
    const now = new Date();
    let date = `${now.getUTCFullYear()}-`;
    if (now.getUTCMonth() < 9) {
      date += '0';
    }
    date += `${now.getUTCMonth() + 1}-01`;
    this.month.set(date);
  }

  onChangeCompany() {
    const company = this.uploadForm.company().value();
    this.companies().forEach(co => {
      if (company.toLowerCase() === co.id.toLowerCase()) {
        this.ingestMethod.set(co.ingest.toLowerCase());
      }
    })
    this.company.set(company);
  }

  onFilesChange(event: any) {
    const list: File[] = [];
    for (let i=0; i < event.target.files.length; i++) {
      list.push(event.target.files[i]);
    }
    this.uploadFiles.set(list);
  }

  onClear() {
    this.uploadFiles.set([]);
  }

  onSubmit() {
    const formData = new FormData();
    formData.append("userid", this.user());
    formData.append("team", this.team());
    formData.append("site", this.site());
    formData.append("company", this.company());
    formData.append("start", this.month());
    this.uploadFiles().forEach(file => {
      formData.append("files", file);
    });

    this.siteService.fileIngest(formData).subscribe({
      next: (res) => {
        this.siteService.getIngestMonth(this.team(), this.site(), this.company(), 
          new Date(Date.parse(this.month()))).subscribe({
            next: (res) => {
              this.uploadForm.files().value.set('');
              this.uploadFiles.set([]);
            },
            error: (err) => {
              if (err instanceof HttpErrorResponse) {
                if (err.status >= 400 && err.status < 500) {
                  this.authService.statusMessage.set(`${err.status} - ${err.error.message}`)
                }
              }
            }
          })
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

  changeMonth(sDate: string) {
    this.month.set(sDate);
  }
}
