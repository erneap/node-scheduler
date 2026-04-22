import { Component, Input, input, signal } from '@angular/core';
import { Item } from '../../../../general/list/list.model';
import { form, FormField, required } from '@angular/forms/signals';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../../../../services/auth-service';
import { TeamService } from '../../../../services/team-service';
import { Team } from 'scheduler-models/scheduler/teams';
import { List } from '../../../../general/list/list';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { HttpErrorResponse } from '@angular/common/http';
import { ConfirmationDialog } from '../../../../general/confirmation-dialog/confirmation-dialog';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MAT_MOMENT_DATE_FORMATS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';

interface ModData {
  year: number;
  start: Date;
  end: Date;
}

@Component({
  selector: 'app-team-editor-companies-modtime',
  imports: [
    List,
    FormField,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule
  ],
  templateUrl: './team-editor-companies-modtime.html',
  styleUrl: './team-editor-companies-modtime.scss',
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
export class TeamEditorCompaniesModtime {
  team = signal<string>('');
  private _company: string = '';
  @Input()
  get company(): string {
    return this._company;
  }
  set company(id: string) {
    this._company = id;
    this.setModTimes();
  }
  list = signal<Item[]>([]);
  modModel = signal<ModData>({
    year: 0,
    start: new Date(),
    end: new Date()
  });
  modForm = form(this.modModel, (s) => {
    required(s.year);
    required(s.start);
    required(s.end);
  });
  selectedItem = signal<string>('new');

  constructor(
    private authService: AuthService,
    private teamService: TeamService,
    private dialog: MatDialog
  ) {
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      this.team.set(team.id);
      this.setModTimes();
    }
  }

  /**
   * This method will be used to set the displayed list of mod period years in this list
   * box, with the new mod period first, then the established mod periods in newest first
   * order.
   */
  setModTimes() {
    const list: Item[] = [];
    list.push({
      id: 'new', value: 'Add New Mod Year'
    });
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      team.companies.forEach(co => {
        if (co.id.toLowerCase() === this.company.toLowerCase()) {
          if (co.modperiods && co.modperiods.length > 0) {
            co.modperiods.sort((a,b) => b.compareTo(a));
            co.modperiods.forEach(mp => {
              const syear = `${mp.year}`;
              list.push({id: syear, value: syear });
            });
            if (this.selectedItem().toLowerCase() === 'new') {
              const choice = `${co.modperiods[0].year}`;
              this.selectItem(choice);
            }
          }
        }
      });
    }
    this.list.set(list);
  }

  /**
   * This method is used to select the single mod period to display for editing.  If new
   * is chosen, reset the form to a default state.
   * @param id The string value for the year to choose.  
   */
  selectItem(id: string) {
    this.selectedItem.set(id);
    if (id.toLowerCase() !== 'new') {
      const iTeam = this.teamService.getTeam();
      if (iTeam) {
        const team = new Team(iTeam);
        team.companies.forEach(co => {
          if (co.modperiods && co.modperiods.length > 0) {
            co.modperiods.forEach(mp => {
              const syear = `${mp.year}`;
              if (id === syear) {
                this.modForm.year().value.set(mp.year);
                this.modForm.start().value.set(new Date(mp.start));
                this.modForm.end().value.set(new Date(mp.end));
              }
            });
          }
        });
      }
    } else {
      this.modForm.year().value.set(0);
      this.modForm.start().value.set(new Date());
      this.modForm.end().value.set(new Date());
    }
  }

  /**
   * This method is used to start the update of the field in the database for the team-
   * company-mod period.
   * @param field the string value for the field that was updated
   */
  onChange(field: string) {
    if (this.selectedItem().toLowerCase() !== 'new') {
      let value = '';
      switch (field.toLowerCase()) {
        case "start":
          value = this.dateToString(this.modForm.start().value());
          break;
        case "end":
          value = this.dateToString(this.modForm.end().value());
          break;
      }
      if (value !== '') {
        this.teamService.updateModPeriod(this.team(), this.company, 
          Number(this.selectedItem()), field, value).subscribe({
          next: (res) => {
            // since the team is already updated, nothing else need be done.
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
  }

  /**
   * This method is used to start the process of adding a new mod period to a team-company.
   */
  onAdd() {
    if (this.modForm().valid()) {
      const sYear = `${this.modForm.year().value()}`;
      this.teamService.addModPeriod(this.team(), this.company, this.modForm.year().value(),
        this.modForm.start().value(), this.modForm.end().value()).subscribe({
        next: (res) => {
          // since the new mod period is created we need to update the display list and 
          // then choose this new year entered.
          this.setModTimes();
          this.selectItem(sYear);
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

  /**
   * This method is used to start the deletion of a mod period from a team-company.  First,
   * we confirm the deletion, then we send the delete request to the service/API.
   */
  onDelete() {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'Team Company ModTime Delete Confirmation',
        message: 'Are you sure you want to delete this mod time?',
        negativeButtonTitle: 'No',
        affirmativeButtonTitle: 'Yes'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.toLowerCase() === 'yes') {
        this.teamService.deleteModPeriod(this.team(), this.company, Number(this.selectedItem())).subscribe({
          next: (res) => {
            // since the new mod period is created we need to update the display list and 
            // then choose this new item in the list.
            this.setModTimes();
            this.selectItem('new');
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

  /**
   * This method is used to clear the selected mod period editor by setting the selected
   * mod period to new.
   */
  onClear() {
    this.selectItem('new');
  }

  /**
   * This private method is used to convert a date to a YYYY-MM-DD date string.
   * @param date The date object to convert
   * @returns A string value in the for YYYY-MM-DD for transmission to the API.
   */
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
}
