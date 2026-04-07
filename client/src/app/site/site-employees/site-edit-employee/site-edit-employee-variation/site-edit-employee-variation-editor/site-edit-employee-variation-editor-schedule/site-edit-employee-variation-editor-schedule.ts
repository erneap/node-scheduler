import { Component, input, Input, output, signal } from '@angular/core';
import { disabled, form, FormField, hidden } from '@angular/forms/signals';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SiteEditEmployeeAssignmentEditorWorkday } from '../../../site-edit-employee-assignment/site-edit-employee-assignment-editor/site-edit-employee-assignment-editor-schedule/site-edit-employee-assignment-editor-workday/site-edit-employee-assignment-editor-workday';
import { ISchedule, Schedule } from 'scheduler-models/scheduler/employees';
import { Workcode } from 'scheduler-models/scheduler/labor';
import { Workcenter } from 'scheduler-models/scheduler/sites/workcenters/workcenter';
import { MatCheckboxModule } from '@angular/material/checkbox';

interface ScheduleData {
  scheduleid: string;
  scheduleDays: string;
  showDates: boolean;
}

@Component({
  selector: 'app-site-edit-employee-variation-editor-schedule',
  imports: [
    FormField,
    MatIconModule,
    MatInputModule,
    MatCheckboxModule,
    MatTooltipModule,
    SiteEditEmployeeAssignmentEditorWorkday
  ],
  templateUrl: './site-edit-employee-variation-editor-schedule.html',
  styleUrl: './site-edit-employee-variation-editor-schedule.scss',
})
export class SiteEditEmployeeVariationEditorSchedule {
  private _schedule: Schedule = new Schedule();
  private _start: Date = new Date();
  private _end: Date = new Date();
  @Input()
  get schedule(): Schedule {
    return this._schedule;
  }
  set schedule(sch: ISchedule) {
    this._schedule = new Schedule(sch);
    this.scheduleForm.scheduleid().value.set('0');
    this.scheduleForm.scheduleDays().value.set(`${sch.workdays.length}`);
    const show = (sch.showdates) ? sch.showdates : false;
    this.scheduleForm.showDates().value.set(show);
  }

  workcodes = input<Workcode[]>([]);
  workcenters = input<Workcenter[]>([]);
  height = input<number>(250);
  width = input<number>(582);
  @Input()
  get start(): Date {
    return this._start;
  }
  set start(date: Date) {
    this._start = new Date(date);
  }
  @Input()
  get end(): Date {
    return this._end;
  }
  set end(date: Date) {
    this._end = new Date(date);
  }
  changed = output<string>();
  scheduleModel = signal<ScheduleData>({
    scheduleid: '0',
    scheduleDays: '7',
    showDates: false,
  });
  scheduleForm = form(this.scheduleModel, (schemaPath) => {
    hidden(schemaPath.scheduleDays, ({valueOf}) => valueOf(schemaPath.showDates));
  });
  days = [ '7', '14', '21', '28', '56'];

  /**
   * This method is used to update the schedule, either to change schedule or
   * change the number of workdays in the schedule
   * @param field The string value for which field to use in the update
   */
  changeSchedule(field: string) {
    let chgString = '';
    if (field.toLowerCase() === 'days') {
      chgString = `0|chgdays|${this.scheduleModel().scheduleDays}`;
    } else if (field.toLowerCase() === 'dates') {
      chgString = `0|showdates|${this.scheduleModel().showDates}`;
    }
    if (chgString !== '') {
      this.changed.emit(chgString);
    }
  }

  /**
   * This method is used to pass workday changes to the next parent via the 
   * output.  We append the schedule id to the begining of the string.
   * @param chg The change output of the workday editors.
   */
  onChanged(chg: string) {
    let chgString = `${this.scheduleModel().scheduleid}|day|${chg}`;
    this.changed.emit(chgString);
  }

  /**
   * This method will provide the style information for the schedule as a string.
   */
  displayStyle(): string {
    let winheight = window.innerHeight - 300;
    if (this.height() < winheight) {
      return `width: ${this.width()}px;height: ${this.height()}px;`
        + `max-height: ${this.height()}px;overflow-y: auto;`
    } else {
      return `width: ${this.width()}px;height: ${winheight}px;`
        + `max-height: ${winheight}px;overflow-y: auto;`
    }
  }

  disableDate(date?: Date): boolean {
    if (this.scheduleForm.showDates().value() && date) {
      return (date.getTime() < this.start.getTime() 
        || date.getTime() > this.end.getTime());
    }
    return false;
  }
}
