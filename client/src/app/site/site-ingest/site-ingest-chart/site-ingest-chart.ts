import { Component, signal } from '@angular/core';
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

interface IngestData {
  company: string;
  files: File[] | null;
}

@Component({
  selector: 'app-site-ingest-chart',
  imports: [
    FormField,
    FormsModule,
    SiteIngestChartMonth

  ],
  templateUrl: './site-ingest-chart.html',
  styleUrl: './site-ingest-chart.scss',
})
export class SiteIngestChart {
  company = signal<string>('');
  companies = signal<Company[]>([]);
  uploadFiles = signal<File[]>([]);
  uploadModel = signal<IngestData>({
    company: '',
    files: null});
  uploadForm = form(this.uploadModel, s => {
    required(s.files);
  });
  team = signal<string>('');
  site = signal<string>('');
  month = signal<string>('');
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
      this.uploadForm.company().value.set(employee.companyinfo.company);
      this.company.set(employee.companyinfo.company);
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
    console.log(company);
    this.company.set(company);
  }

  onFilesChange(event: any) {
    const list: File[] = [];
    for (let i=0; i < event.target.files.length; i++) {
      list.push(event.target.files[i]);
    }
  }

  onSubmit() {
    const formData = new FormData();
    formData.append("team", this.team());
    formData.append("site", this.site());
    formData.append("company", this.company());
    formData.append("start", this.month());
    this.uploadFiles().forEach(file => {
      formData.append("file", file);
    });

    this.siteService.fileIngest(formData).subscribe({
      next: (res) => {
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
