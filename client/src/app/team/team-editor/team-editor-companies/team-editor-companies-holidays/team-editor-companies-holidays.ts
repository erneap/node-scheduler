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
import { HttpErrorResponse } from '@angular/common/http';
import { ConfirmationDialog } from '../../../../general/confirmation-dialog/confirmation-dialog';

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

  // These next two method are for the complex computation for showing the sort movement
  // arrows for the holiday list display.
  // the sort up arrow will display if the regular holiday or float holiday is greater 
  // than 1 in position, within it's respective list portion.
  showSortUp(): boolean {
    if (this.selectedItem().toLowerCase() !== 'new') {
      const [htype, sort] = this.selectedItem().split('|');
      return ((htype.toLowerCase() === 'h' && this.holidayPos() > 1) 
        || (htype.toLowerCase() === 'f' && this.floatPos() > 1))
    }
    return false;
  }

  // The sort down arrow will display if the regular holiday or float holiday is less than
  // the number of of total respective holidays within their list portion.
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

  /**
   * This method is used to initiate and respond to the Add button click.  First, we check
   * if the form is complete (type and name). then we send the information to the API for
   * inclusion to the team/company object's holiday list.  After process, a new team 
   * object is passed back and handled by the service.  We need to update the holiday list
   * and find the new holiday in the company's holiday list and determine the identifier
   * used by the list, then select it to display its data for editing.
   */
  onAdd() {
    if (this.holidayform().valid()) {
      const name = this.holidayform.name().value();
      this.teamService.addHoliday(this.team(), this.company, name,
        this.holidayform.holidayType().value()).subscribe({
        next: (res) => {
          // the team is already handled, so we need to update the list and pick the new
          // holiday for display
          this.setHolidays();
          const iTeam = this.teamService.getTeam();
          if (iTeam) {
            const team = new Team(iTeam);
            team.companies.forEach(co => {
              if (co.id.toLowerCase() === this.company.toLowerCase()) {
                if (co.holidays && co.holidays.length > 0) {
                  co.holidays.forEach(hol => {
                    if (hol.name === name) {
                      const id = `${hol.id}|${hol.sort}`;
                      this.selectItem(id);
                    }
                  });
                }
              }
            });
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

  /**
   * This method is used to initiate and respond to a request to update a holiday (name,
   * position within its respective list portion, and actual dates).  A single field or 
   * date member is updated by each call.  When processed, the API returns the new Team
   * object which is handled by the service.  All we need to do is update the holiday 
   * list.
   * @param field The string value to signify which field is to be updated.
   */
  onUpdate(field: string) {
    if (this.selectedItem().toLowerCase() !== 'new') {
      const [holtype, sort] = this.selectedItem().split('|');
      const hid = `${holtype.toLowerCase()}${sort}`;
      let useField = field;
      let value = '';
      switch (field.toLowerCase()) {
        case "name":
          value = this.holidayform.name().value();
          break;
        case "up":
        case "down":
          useField = 'move';
          value = field.toLowerCase();
          break;
        case "addactual":
          value = dateToString(this.holidayform.actual().value())
          break;
      }
      this.teamService.updateHoliday(this.team(), this.company, hid, useField, 
        value).subscribe({
        next: (res) => {
          // the team is already handled, so we need to update the list, then update 
          // the holiday display.
          this.setHolidays();
          this.selectItem(`${holtype}|${sort}`);
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
   * This method is a special case for the delete clicks for each set actual date.  It 
   * will send an updateHoliday request with the field name of 'deleteactual' and the
   * string date to delete.  The response is the same as the updateHoliday method.
   * @param date The string value for the date to delete from the holiday's actual list
   */
  onDeleteActual(date: string) {
      const [holtype, sort] = this.selectedItem().split('|');
      const hid = `${holtype.toLowerCase()}${sort}`;
      this.teamService.updateHoliday(this.team(), this.company, hid, 'deleteactual', 
        date).subscribe({
        next: (res) => {
          // the team is already handled, so we need to update the list, then update 
          // the holiday display.
          this.setHolidays();
          this.selectItem(`${holtype}|${sort}`);
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

  /**
   * This method will initiate and handle response for a deletion request, after 
   * confirmation that the deletion should take place.  It uses the team service's 
   * delete holiday method to place the request to the API and upon completions, handles
   * the response by updating the holiday list and selecting 'new' for the selected 
   * holiday.
   */
  onDelete() {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'Team Company Holiday Delete Confirmation',
        message: 'Are you sure you want to delete this holiday?',
        negativeButtonTitle: 'No',
        affirmativeButtonTitle: 'Yes'
      }
    });
    dialogRef.afterClosed().subscribe(result => {
      if (result.toLowerCase() === 'yes') {
        const [holtype, sort] = this.selectedItem().split('|');
        const hid = `${holtype.toLowerCase()}${sort}`;
        this.teamService.deleteHoliday(this.team(), this.company, hid).subscribe({
          next: (res) => {
            // the team is already handled, so we need to update the list, then update 
            // the holiday display.
            this.setHolidays();
            this.selectItem(`new`);
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
