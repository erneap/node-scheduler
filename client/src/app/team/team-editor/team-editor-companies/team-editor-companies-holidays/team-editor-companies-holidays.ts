import { Component, Input, signal } from '@angular/core';
import { Item } from '../../../../general/list/list.model';
import { AuthService } from '../../../../services/auth-service';
import { TeamService } from '../../../../services/team-service';
import { MatDialog } from '@angular/material/dialog';
import { Team } from 'scheduler-models/scheduler/teams';
import { form, FormField, required } from '@angular/forms/signals';
import { List } from '../../../../general/list/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { dateToString } from '../../../../models/dates';
import { MAT_MOMENT_DATE_ADAPTER_OPTIONS, MAT_MOMENT_DATE_FORMATS, MomentDateAdapter } from '@angular/material-moment-adapter';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';

interface HolidayData {
  holidayType: string;
  name: string;
  sort: number;
  actual: Date;
}

@Component({
  selector: 'app-team-editor-companies-holidays',
  imports: [
    List,
    FormField,
    MatFormFieldModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './team-editor-companies-holidays.html',
  styleUrl: './team-editor-companies-holidays.scss',
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
export class TeamEditorCompaniesHolidays {
  team = signal<string>('');
  private _company: string = '';
  @Input()
  get company(): string {
    return this._company;
  }
  set company(id: string) {
    this._company = id;
    this.setHolidays();
  }
  // this list will contain all the holidays, grouped by holiday type and ordered by their
  // respective sort values.
  list = signal<Item[]>([]);
  selectedItem = signal<string>('new');
  // we need two types of position and length because the sort icon will only display 
  // within their respective type
  holidayPos = signal<number>(-1);
  holidayLength = signal<number>(0);
  floatPos = signal<number>(-1);
  floatLength = signal<number>(0);
  actualsList = signal<Date[]>([]);
  holidayModel = signal<HolidayData>({
    holidayType: 'h',
    name: '',
    sort: 0,
    actual: new Date()
  });
  holidayform = form(this.holidayModel, (s) => {
    required(s.name);
  });

  constructor(
    private authService: AuthService,
    private teamService: TeamService,
    private dialog: MatDialog
  ) {
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      this.team.set(team.id);
    }
  }

  setHolidays() {
    const list: Item[] = [];
    list.push({id: 'new', value: 'Add New Holiday'});
    const iTeam = this.teamService.getTeam();
    if (iTeam) {
      const team = new Team(iTeam);
      team.companies.forEach(co => {
        if (co.id.toLowerCase() === this.company.toLowerCase()) {
          if (co.holidays && co.holidays.length > 0) {
            co.holidays.sort((a,b) => a.compareTo(b));
            let holidays = 0;
            let floats = 0;
            co.holidays.forEach(hol => {
              const hid = `${hol.id.toLowerCase()}|${hol.sort}`;
              list.push({id: hid, value: hol.name});
              if (hol.id.toLowerCase() === 'h') {
                holidays++;
              } else {
                floats++;
              }
            });
            this.holidayLength.set(holidays);
            this.floatLength.set(floats);
          }
        }
      });
    }
    this.list.set(list);
  }

  selectItem(id: string) {
    this.selectedItem.set(id);
    this.holidayPos.set(-1);
    this.floatPos.set(-1);
    if (id.toLowerCase() !== 'new') {
      let [htype, sSort] = id.split('|');
      const sort = Number(sSort);
      const iTeam = this.teamService.getTeam();
      if (iTeam) {
        const team = new Team(iTeam);
        team.companies.forEach(co => {
          if (co.id.toLowerCase() === this.company.toLowerCase()) {
            if (co.holidays && co.holidays.length > 0) {
              co.holidays.forEach(hol => {
                if (hol.id.toLowerCase() === htype.toLowerCase() && hol.sort === sort) {
                  if (hol.id.toLowerCase() === 'h') {
                    this.holidayPos.set(sort);
                  } else {
                    this.floatPos.set(sort);
                  }
                  this.holidayform.holidayType().value.set(hol.id.toLowerCase());
                  this.holidayform.name().value.set(hol.name);
                  this.holidayform.sort().value.set(hol.sort);
                  if (hol.actualdates && hol.actualdates.length > 0) {
                    const now = new Date();
                    const newDates: Date[] = [];
                    hol.actualdates.forEach(ad => {
                      const nDate = new Date(ad);
                      if (nDate.getUTCFullYear() >= now.getUTCFullYear()) {
                        newDates.push(nDate);
                      }
                    });
                    this.actualsList.set(newDates);
                  }
                }
              });
            }
          }
        });
      }
    } else {
      this.holidayform.holidayType().value.set('h');
      this.holidayform.name().value.set('');
      this.holidayform.sort().value.set(-1);
    }
  }

  showSortUp(): boolean {
    if (this.selectedItem().toLowerCase() !== 'new') {
      const [htype, sort] = this.selectedItem().split('|');
      return ((htype.toLowerCase() === 'h' && this.holidayPos() > 1) 
        || (htype.toLowerCase() === 'f' && this.floatPos() > 1))
    }
    return false;
  }

  showSortDown(): boolean {
    if (this.selectedItem().toLowerCase() !== 'new') {
      const [htype, sort] = this.selectedItem().split('|');
      return ((htype.toLowerCase() === 'h' && this.holidayPos() < this.holidayLength()) 
        || (htype.toLowerCase() === 'f' && this.floatPos() < this.floatLength()))
    }
    return false;
  }

  showActuals(): boolean {
    return (this.selectedItem().toLowerCase().startsWith('h'));
  }

  actualString(actual: Date): string {
    return dateToString(actual);
  }

  onUpdate(field: string) {

  }

  onDelete() {

  }
}
