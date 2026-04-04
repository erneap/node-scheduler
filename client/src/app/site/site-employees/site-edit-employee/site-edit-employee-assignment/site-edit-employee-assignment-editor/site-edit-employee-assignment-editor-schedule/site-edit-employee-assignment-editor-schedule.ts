import { Component, input, Input, output, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Schedule } from 'scheduler-models/scheduler/employees';
import { Workcode } from 'scheduler-models/scheduler/labor';
import { Workcenter } from 'scheduler-models/scheduler/sites/workcenters/workcenter';
import { SiteEditEmployeeAssignmentEditorWorkday } from './site-edit-employee-assignment-editor-workday/site-edit-employee-assignment-editor-workday';
import { MatTooltip } from '@angular/material/tooltip';

interface ScheduleData {
  scheduleid: string;
  scheduleDays: string;
}

@Component({
  selector: 'app-site-edit-employee-assignment-editor-schedule',
  imports: [
    FormField,
    MatIconModule,
    MatInputModule,
    MatTooltip,
    SiteEditEmployeeAssignmentEditorWorkday
  ],
  templateUrl: './site-edit-employee-assignment-editor-schedule.html',
  styleUrl: './site-edit-employee-assignment-editor-schedule.scss',
})
export class SiteEditEmployeeAssignmentEditorSchedule {
  private _schedule: Schedule = new Schedule();
  @Input()
  get schedule(): Schedule {
    return this._schedule;
  }
  set schedule(sch: Schedule) {
    this._schedule = new Schedule(sch);
    this.scheduleForm.scheduleDays().value.set(`${this.schedule.workdays.length}`)
    this.scheduleForm.scheduleid().value.set(`${this.schedule.id}`)
  }

  workcodes = input<Workcode[]>([]);
  workcenters = input<Workcenter[]>([]);
  schedules = input<string[]>([]);
  height = input<number>(250);
  width = input<number>(582);
  changed = output<string>();
  scheduleModel = signal<ScheduleData>({
    scheduleid: '0',
    scheduleDays: '7',
  });
  scheduleForm = form(this.scheduleModel);
  days = [ '7', '14', '21', '28', '56'];

  /**
   * This method is used to update the schedule, either to change schedule or
   * change the number of workdays in the schedule
   * @param field The string value for which field to use in the update
   */
  changeSchedule(field: string) {
    let chgString = '';
    if (field.toLowerCase() === 'id') {
      chgString = `${this.scheduleModel().scheduleid}|chgsch`;
    } else if (field.toLowerCase() === 'days') {
      chgString = `${this.scheduleModel().scheduleid}|chgdays|`
        + `${this.scheduleModel().scheduleDays}`;
    } else if (field.toLowerCase() === 'delete') {
      chgString = `${this.scheduleModel().scheduleid}|delsch`;
    } else if (field.toLowerCase() === 'add') {
      chgString = `-1|addsch`;
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
}
