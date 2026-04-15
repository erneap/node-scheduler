import { ChangeDetectionStrategy, Component, Input, model, signal } from '@angular/core';
import { AuthService } from '../../../../services/auth-service';
import { SiteService } from '../../../../services/site-service';
import { MatDialog } from '@angular/material/dialog';
import { Item } from '../../../../general/list/list.model';
import { Team } from 'scheduler-models/scheduler/teams';
import { TeamService } from '../../../../services/team-service';
import { List } from '../../../../general/list/list';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MAT_MOMENT_DATE_FORMATS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { form, FormField, required } from '@angular/forms/signals';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { ISite, Site } from 'scheduler-models/scheduler/sites';
import { CofSReport, Section } from 'scheduler-models/scheduler/sites/reports';
import { HttpErrorResponse } from '@angular/common/http';
import { ConfirmationDialog } from '../../../../general/confirmation-dialog/confirmation-dialog';
import { SiteEditorCofsEditorSection } from './site-editor-cofs-editor-section/site-editor-cofs-editor-section';

interface CofSData {
  name: string;
  filename: string;
  unit: string;
  start: Date;
  end: Date;
}

@Component({
  selector: 'app-site-editor-cofs-editor',
  imports: [
    List,
    FormField,
    FormsModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
    SiteEditorCofsEditorSection
  ],
  templateUrl: './site-editor-cofs-editor.html',
  styleUrl: './site-editor-cofs-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { useUtc: true } },
    {
        provide: DateAdapter,
        useClass: MomentDateAdapter,
        deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
    },
    { provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS },
  ]
})
export class SiteEditorCofsEditor {
  private _site: string = '';
  @Input()
  get site(): string {
    return this._site;
  }
  set site(id: string) {
    this._site = id;
    this.setCofSList();
  }
  team = signal<string>('');
  list = signal<Item[]>([]);
  selectedCofS = signal<string>('new');
  readonly showAll = model(false);
  sections = signal<Section[]>([]);
  cofsModel = signal<CofSData>({
    name: '',
    filename: '',
    unit: '',
    start: new Date(),
    end: new Date()
  });
  cofsForm = form(this.cofsModel, schema => {
    required(schema.name);
    required(schema.filename);
    required(schema.unit);
    required(schema.start);
    required(schema.end);
  });
  

  constructor(
    private authService: AuthService,
    private siteService: SiteService,
    private teamService: TeamService,
    private dialog: MatDialog
  ) {
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      this.team.set(team.id);
    }
  }

  getSelectedCofS(): number {
    return Number(this.selectedCofS());
  }

  setCofSList() {
    let bFound = false;
    if (this.selectedCofS() === 'new') {
      bFound = true;
    }
    const cList: Item[] = [];
    cList.push({
      id: 'new',
      value: 'Add New CofS Description'
    });
    const formatter = Intl.DateTimeFormat('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
    const now = new Date();
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      team.sites.forEach(site => {
        if (site.id.toLowerCase() === this.site.toLowerCase()) {
          if (site.cofs && site.cofs.length > 0) {
            site.cofs.sort((a,b) => b.compareTo(a));
            site.cofs.forEach(cofs => {
              if (this.showAll() || cofs.startdate.getTime() > now.getTime()
                || cofs.enddate.getTime() >= now.getTime()) {
                if (`${cofs.id}` === this.selectedCofS()) {
                  bFound = true;
                }
                cList.push({
                  id: `${cofs.id}`,
                  value: `${cofs.name} (${formatter.format(cofs.startdate)} - `
                    + `${formatter.format(cofs.enddate)})`
                });
              }
            });
          }
        }
      })
    }
    if (!bFound) {
      this.selectedCofS.set('new');
    }
    this.list.set(cList);
  }

  changeShow() {
    this.setCofSList();
  }

  selectCofS(id: string) {
    this.selectedCofS.set(id);
    if (id.toLowerCase() === 'new') {
      this.cofsForm.name().value.set('');
      this.cofsForm.filename().value.set('');
      this.cofsForm.unit().value.set('');
      this.cofsForm.start().value.set(new Date());
      this.cofsForm.end().value.set(new Date());
      this.sections.set([]);
    } else {
      const iTeam = this.teamService.getTeam();
      if (iTeam) {
        const team = new Team(iTeam);
        team.sites.forEach(site => {
          if (site.id.toLowerCase() === this.site.toLowerCase()) {
            if (site.cofs && site.cofs.length > 0) {
              site.cofs.forEach(cofs => {
                if (Number(id) === cofs.id) {
                  this.cofsForm.name().value.set(cofs.name);
                  this.cofsForm.filename().value.set(cofs.shortname);
                  this.cofsForm.unit().value.set(cofs.unit);
                  this.cofsForm.start().value.set(new Date(cofs.startdate));
                  this.cofsForm.end().value.set(new Date(cofs.enddate));
                  this.sections.set(cofs.sections);
                }
              })
            }
          }
        })
      }
    }
  }

  onChange(field: string) {
    if (this.selectedCofS() !== 'new') {
      let useField = field;
      let value = '';
      switch (field.toLowerCase()) {
        case "name":
          value = this.cofsForm.name().value();
          break;
        case "filename":
          useField = 'short';
          value = this.cofsForm.filename().value();
          break;
        case "unit":
          value = this.cofsForm.unit().value();
          break;
        case "start":
          value = this.dateToString(this.cofsForm.start().value());
          break;
        case "end":
          value = this.dateToString(this.cofsForm.end().value());
          break;
      }
      this.siteService.updateCofS(this.team(), this.site, 
        Number(this.selectedCofS()), useField, value, -1).subscribe({
        next: (res) => {
          const iSite = res.body as ISite;
          if (iSite) {
            const site = new Site(iSite);
            this.siteService.selectedSite.set(site);
            const iTeam = this.teamService.getTeam();
            if (iTeam) {
              let found = false;
              const team = new Team(iTeam);
              team.sites.forEach((tsite, s) => {
                if (tsite.id.toLowerCase() === site.id.toLowerCase()) {
                  found = true;
                  team.sites[s] = site;
                  site.cofs.forEach(cofs => {
                    if (cofs.id === Number(this.selectedCofS())) {
                      this.sections.set(cofs.sections);
                    }
                  })
                }
              });
              if (!found) {
                team.sites.push(site);
              }
              this.teamService.setTeam(team);
              this.setCofSList();
            }
          }
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

  private dateToString(date: Date): string {
    date = new Date(date);
    let answer = `${date.getUTCFullYear()}-`;
    if (date.getUTCMonth() < 9) {
      answer += '0';
    }
    answer += `${date.getUTCMonth() + 1}-`;
    if (date.getUTCDate() < 10) {
      answer += '0';
    }
    answer += `${date.getUTCDate()}`;
    return answer;
  }

  onAdd() {
    if (this.selectedCofS().toLowerCase() === 'new') {
      this.siteService.addCofS(this.team(), this.site, 
        this.cofsForm.name().value(), this.cofsForm.filename().value(), 
        this.cofsForm.unit().value(), new Date(this.cofsForm.start().value()), 
        new Date(this.cofsForm.end().value())).subscribe({
        next: (res) => {
          const iSite = res.body as ISite;
          if (iSite) {
            const site = new Site(iSite);
            this.siteService.selectedSite.set(site);
            const iTeam = this.teamService.getTeam();
            if (iTeam) {
              let cofsID = 'new';
              let found = false;
              const team = new Team(iTeam);
              team.sites.forEach((tsite, s) => {
                if (tsite.id.toLowerCase() === site.id.toLowerCase()) {
                  found = true;
                  team.sites[s] = site;
                  let mCofs: CofSReport = new CofSReport();
                  site.cofs.forEach(cofs => {
                    if (cofs.id > mCofs.id) {
                      mCofs = new CofSReport(cofs);
                    }
                  });
                  cofsID = `${mCofs.id}`;
                }
              });
              if (!found) {
                team.sites.push(site);
              }
              this.teamService.setTeam(team);
              this.setCofSList();
              this.selectCofS(cofsID);
            }
          }
        },
        error: (err) => {
          if (err instanceof HttpErrorResponse) {
            if (err.status >= 400 && err.status < 500) {
              this.authService.statusMessage.set(`${err.status} - ${err.error.message}`)
            }
          }
        }
      });
    }
  }

  onDelete() {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'CofS Report Delete Confirmation',
        message: 'Are you sure you want to delete this CofS Report?',
        negativeButtonTitle: 'No',
        affirmativeButtonTitle: 'Yes'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.toLowerCase() === 'yes') {
        this.siteService.deleteCofS(this.team(), this.site, Number(this.selectedCofS())).subscribe({
          next: (res) => {
            const iSite = res.body as ISite;
            if (iSite) {
              const site = new Site(iSite);
              this.siteService.selectedSite.set(site);
              const iTeam = this.teamService.getTeam();
              if (iTeam) {
                let cofsID = 'new';
                let found = false;
                const team = new Team(iTeam);
                team.sites.forEach((tsite, s) => {
                  if (tsite.id.toLowerCase() === site.id.toLowerCase()) {
                    found = true;
                    team.sites[s] = site;
                  }
                });
                if (!found) {
                  team.sites.push(site);
                }
                this.teamService.setTeam(team);
                this.setCofSList();
                this.selectCofS('new');
              }
            }
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
    });
  }
}
