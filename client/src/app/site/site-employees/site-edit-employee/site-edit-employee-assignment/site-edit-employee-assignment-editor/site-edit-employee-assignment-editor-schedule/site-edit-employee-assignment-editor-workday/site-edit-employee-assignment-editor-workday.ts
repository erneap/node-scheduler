import { Component, input, Input, output, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { Workday } from 'scheduler-models/scheduler/employees';
import { Workcode } from 'scheduler-models/scheduler/labor';
import { Workcenter } from 'scheduler-models/scheduler/sites/workcenters/workcenter';
import { MatTooltip } from "@angular/material/tooltip";

@Component({
  selector: 'app-site-edit-employee-assignment-editor-workday',
  imports: [
    ReactiveFormsModule,
    MatSelectModule,
    MatIconModule,
    MatTooltip
],
  templateUrl: './site-edit-employee-assignment-editor-workday.html',
  styleUrl: './site-edit-employee-assignment-editor-workday.scss',
})
export class SiteEditEmployeeAssignmentEditorWorkday {
  private _workday: Workday = new Workday();
  @Input()
  get workday(): Workday {
    return this._workday;
  }
  set workday(wd: Workday) {
    this._workday = new Workday(wd);
    this.setWorkday();
  }
  workcodes = input<Workcode[]>([]);
  workcenters = input<Workcenter[]>([]);
  hours = signal<string[]>([]);
  showCopy = signal<boolean>(false);
  changed = output<string>();
  workdayForm: FormGroup;

  constructor(
    private builder: FormBuilder
  ) {
    this.hours.set(['', '2', '3', '4', '5', '6', '7', '8', '10', '12']);
    this.workdayForm = this.builder.group({
      code: '',
      workcenter: '',
      hours: ''
    });
  }

  setWorkday() {
    this.workdayForm.get('code')?.setValue(this.workday.code);
    this.workdayForm.get('workcenter')?.setValue(this.workday.workcenter);
    if (this.workday.hours > 0) {
      this.workdayForm.get('hours')?.setValue(`${this.workday.hours}`);
    } else {
      this.workdayForm.get('hours')?.setValue('');
    }
    const bCopy: boolean = (this.workday.code === '' || this.workday.workcenter === ''
      || this.workday.hours === 0);
    this.showCopy.set(bCopy);
  }

  getDayDate(): string {
    const daysOfWeek = [ 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa' ];
    const day = this.workday.id % 7;
    return daysOfWeek[day];
  }

  getDayStyle(): string {
    let bkColor = 'ffffff';
    let txColor = '000000';
    this.workcodes().forEach(wc => {
      if (wc.id.toLowerCase() === this.workday.code.toLowerCase()) {
        bkColor = wc.backcolor;
        txColor = wc.textcolor;
      }
    })
    return `background-color: #${bkColor};color: #${txColor};`;
  }

  onChange(field: string) {
    let chgString = `${this.workday.id}|${field}`;
    if (field.toLowerCase() !== 'copy' && field.toLowerCase() !== 'clear') {
      chgString += `|${this.workdayForm.get(field)?.value}`;
    }
    this.changed.emit(chgString);
  }
}
