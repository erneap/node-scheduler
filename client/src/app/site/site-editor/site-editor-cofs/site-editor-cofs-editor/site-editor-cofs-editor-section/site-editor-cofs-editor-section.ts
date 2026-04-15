import { Component, input, Input, signal } from '@angular/core';
import { List } from '../../../../../general/list/list';
import { ListMultiple } from '../../../../../general/list-multiple/list-multiple';
import { form, FormField, required } from '@angular/forms/signals';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { Item } from '../../../../../general/list/list.model';
import { Section } from 'scheduler-models/scheduler/sites/reports';
import { AuthService } from '../../../../../services/auth-service';
import { SiteService } from '../../../../../services/site-service';
import { TeamService } from '../../../../../services/team-service';
import { MatDialog } from '@angular/material/dialog';
import { Team } from 'scheduler-models/scheduler/teams';
import { Company } from 'scheduler-models/scheduler/teams/company';
import { LaborCode } from 'scheduler-models/scheduler/labor';
import { MatIconModule } from '@angular/material/icon';
import { ISite, Site } from 'scheduler-models/scheduler/sites';
import { HttpErrorResponse } from '@angular/common/http';
import { ConfirmationDialog } from '../../../../../general/confirmation-dialog/confirmation-dialog';

interface SectionData {
  company: string;
  label: string;
  signature: string;
  showUnit: boolean;
  laborcodes: string[];
}

@Component({
  selector: 'app-site-editor-cofs-editor-section',
  imports: [
    List,
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './site-editor-cofs-editor-section.html',
  styleUrl: './site-editor-cofs-editor-section.scss',
})
export class SiteEditorCofsEditorSection {
  private _cofs: number = -1;
  private _sections: Section[] = [];
  @Input()
  get cofs(): number {
    return this._cofs;
  }
  set cofs(id: number) {
    this._cofs = id;
    this.setSections();
  }
  @Input()
  get sections(): Section[] {
    return this._sections;
  }
  set sections(list: Section[]) {
    this._sections = [];
    list.forEach(section => {
      this._sections.push(new Section(section));
    });
    this._sections.sort((a,b) => a.compareTo(b));
    this.setSections();
  }
  list = signal<Item[]>([]);
  laborcodes = signal<Item[]>([]);
  companies = signal<Company[]>([]);
  team = signal<string>('');
  site = input<string>('');
  sectionPos = signal<number>(-1);
  sectionLength = signal<number>(0);
  selectedSection = signal<string>('new');
  selectedLaborCodes = signal<string[]>([]);
  sectionModel = signal<SectionData>({
    company: '',
    label: '',
    signature: '',
    showUnit: false,
    laborcodes: []
  });
  sectionForm = form(this.sectionModel, schema => {
    required(schema.company);
    required(schema.label);
    required(schema.signature);
  })

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
      const companies: Company[] = [];
      team.companies.forEach(co => {
        companies.push(new Company(co));
      });
      companies.sort((a,b) => a.compareTo(b));
      this.companies.set(companies);
    }
  }

  setSections() {
    const list: Item[] = [];
    let found = false;
    list.push({
      id: 'new',
      value: 'Add New Section'
    });
    if (this.sections.length > 0) {
      this.sections.forEach(section => {
        list.push({
          id: `${section.id}`,
          value: section.label,
        });
      });
      this.sectionLength.set(this.sections.length);
    } else {
      const iTeam = this.teamService.getTeam();
      if (iTeam) {
        const team = new Team(iTeam);
        team.sites.forEach(site => {
          if (site.id.toLowerCase() === this.site().toLowerCase()) {
            site.cofs.forEach(cofs => {
              if (cofs.id === this.cofs) {
                cofs.sections.sort((a,b) => a.compareTo(b));
                this.sectionLength.set(cofs.sections.length);
                cofs.sections.forEach(section => {
                  list.push({
                    id: `${section.id}`,
                    value: section.label
                  });
                  if (section.id === Number(this.selectedSection())) {
                    found = true;
                  }
                });
              }
            });
          }
        });
      }
    }
    if (!found) {
      this.selectedSection.set('new');
    }
    this.list.set(list);
  }

  selectSection(id: string) {
    this.selectedSection.set(id);
    if (id.toLowerCase() === 'new') {
      this.sectionForm.company().value.set('');
      this.sectionForm.label().value.set('');
      this.sectionForm.signature().value.set('');
      this.sectionForm.showUnit().value.set(false);
      this.sectionForm.laborcodes().value.set([]);
      this.sectionPos.set(-1);
      this.selectedLaborCodes.set([]);
      this.laborcodes.set([]);
    } else {
      const iTeam = this.teamService.getTeam();
      if (iTeam) {
        const team = new Team(iTeam);
        team.sites.forEach(site => {
          if (site.id.toLowerCase() === this.site().toLowerCase()) {
            site.cofs.forEach(cofs => {
              if (cofs.id === this.cofs) {
                cofs.sections.forEach((section, s) => {
                  if (section.id === Number(this.selectedSection())) {
                    this.sectionPos.set(s);
                    this.sectionForm.company().value.set(section.company);
                    this.sectionForm.label().value.set(section.label);
                    this.sectionForm.signature().value.set(section.signature);
                    this.sectionForm.showUnit().value.set(section.showunit);

                    const labor: string[] = [];
                    section.laborcodes.forEach(lc => {
                      labor.push(`${lc.chargeNumber}|${lc.extension}`)
                    });
                    this.setLaborCodes();
                    this.sectionForm.laborcodes().value.set(labor);
                  }
                });
              }
            });
          }
        });
      }
    }
  }

  setLaborCodes() {
    const codes: LaborCode[] = [];
    const list: Item[] = [];
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      team.sites.forEach(site => {
        if (site.id.toLowerCase() === this.site().toLowerCase()) {
          site.cofs.forEach(cofs => {
            if (cofs.id === this.cofs) {
              site.forecasts.forEach(forecast => {
                if (forecast.companyid === this.sectionForm.company().value()
                  && forecast.endDate.getTime() >= cofs.startdate.getTime()
                  && forecast.startDate.getTime() <= cofs.enddate.getTime()) {
                  forecast.laborCodes.forEach(lc => {
                    codes.push(new LaborCode(lc));
                  });
                } 
              });
            }
          });
        }
      });
    }
    codes.sort((a,b) => a.compareTo(b));
    codes.forEach(lc => {
      list.push({
        id: `${lc.chargeNumber}|${lc.extension}`,
        value: `${lc.chargeNumber} - ${lc.extension}`
      });
    });
    this.laborcodes.set(list);
  }

  selectLaborcodes(codes: string[]) {
    this.selectedLaborCodes.set(codes);
    this.onChange('laborcodes');
  }

  onAdd() {
    if (this.sectionForm().valid()) {
      this.siteService.addCofSSection(this.team(), this.site(), this.cofs, 
        this.sectionForm.label().value(), this.sectionForm.company().value(),
        this.sectionForm.signature().value(), 
        this.sectionForm.showUnit().value()).subscribe({
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
                    if (cofs.id === this.cofs) {
                      cofs.sections.sort((a,b) => a.compareTo(b));
                      const section = cofs.sections[cofs.sections.length - 1];
                      this.selectedSection.set(`${section.id}`);
                    }
                  })
                }
              });
              if (!found) {
                team.sites.push(site);
              }
              this.teamService.setTeam(team);
              this.setSections();
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

  onChange(field: string) {
    if (this.selectedSection().toLowerCase() !== 'new') {
      let useField = field;
      let value = '';
      switch (field.toLowerCase()) {
        case "company":
          value = this.sectionForm.company().value();
          this.setLaborCodes();
          break;
        case "label":
          value = this.sectionForm.label().value();
          break;
        case "signature":
          value = this.sectionForm.signature().value();
          break;
        case "showunit":
          value = (this.sectionForm.showUnit().value()) ? 'true' : 'false';
          break;
        case "up":
        case "down":
          useField = 'move';
          value = field;
          break;
        case "laborcodes":
          let codes = '';
          this.sectionForm.laborcodes().value().forEach(lc => {
            if (codes !== '') {
              codes += ',';
            }
            codes += lc;
          })
          value = codes;
          break;
      }
      this.siteService.updateCofS(this.team(), this.site(), this.cofs, useField,
        value, Number(this.selectedSection())).subscribe({
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
                }
              });
              if (!found) {
                team.sites.push(site);
              }
              this.teamService.setTeam(team);
              this.setSections();
              this.selectSection(this.selectedSection());
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
        title: 'CofS Report Section Delete Confirmation',
        message: 'Are you sure you want to delete this CofS Report Section?',
        negativeButtonTitle: 'No',
        affirmativeButtonTitle: 'Yes'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.toLowerCase() === 'yes') {
        this.siteService.updateCofS(this.team(), this.site(), this.cofs, 
          'removesection', this.selectedSection(), -1).subscribe({
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
                  }
                });
                if (!found) {
                  team.sites.push(site);
                }
                this.teamService.setTeam(team);
                this.setSections();
                this.selectSection('new');
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
