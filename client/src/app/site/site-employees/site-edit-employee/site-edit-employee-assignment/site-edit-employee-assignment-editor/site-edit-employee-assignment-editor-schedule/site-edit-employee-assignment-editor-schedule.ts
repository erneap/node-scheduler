import { Component, input, Input, output, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { Schedule } from 'scheduler-models/scheduler/employees';
import { Workcode } from 'scheduler-models/scheduler/labor';
import { Workcenter } from 'scheduler-models/scheduler/sites/workcenters/workcenter';
import { SiteEditEmployeeAssignmentEditorWorkday } from './site-edit-employee-assignment-editor-workday/site-edit-employee-assignment-editor-workday';

interface ScheduleData {
  scheduleid: number;
  scheduleDays: number;
}

@Component({
  selector: 'app-site-edit-employee-assignment-editor-schedule',
  imports: [
    FormField,
    MatIconModule,
    MatInputModule,
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
    this.scheduleForm.scheduleDays().value.set(this.schedule.workdays.length)
    this.scheduleForm.scheduleid().value.set(this.schedule.id)
  }

  workcodes = input<Workcode[]>([]);
  workcenters = input<Workcenter[]>([]);
  schedules = input<number>(1);
  height = input<number>(250);
  width = input<number>(580);
  changed = output<string>();
  scheduleModel = signal<ScheduleData>({
    scheduleid: 0,
    scheduleDays: 7,
  });
  scheduleForm = form(this.scheduleModel);

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
}
