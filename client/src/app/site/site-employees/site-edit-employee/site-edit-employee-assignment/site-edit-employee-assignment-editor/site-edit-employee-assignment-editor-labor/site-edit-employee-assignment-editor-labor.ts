import { Component, Input, input, output, signal } from '@angular/core';
import { Assignment } from 'scheduler-models/scheduler/employees';
import { LaborCode } from 'scheduler-models/scheduler/labor';
import { SiteEditEmployeeAssignmentEditorLaborCode } from './site-edit-employee-assignment-editor-labor-code/site-edit-employee-assignment-editor-labor-code';

interface LaborCodeItem {
  chargenumber: string;
  extension: string;
  checked: boolean;
}

@Component({
  selector: 'app-site-edit-employee-assignment-editor-labor',
  imports: [
    SiteEditEmployeeAssignmentEditorLaborCode
  ],
  templateUrl: './site-edit-employee-assignment-editor-labor.html',
  styleUrl: './site-edit-employee-assignment-editor-labor.scss',
})
export class SiteEditEmployeeAssignmentEditorLabor {
  private _laborcodes: LaborCode[] = [];
  private _assignment: Assignment = new Assignment();
  @Input()
  get laborcodes(): LaborCode[] {
    return this._laborcodes;
  }
  set laborcodes(codes: LaborCode[]) {
    this._laborcodes = codes;
    this.setCodes();
  }
  @Input()
  get assignment(): Assignment {
    return this._assignment;
  }
  set assignment(asgmt: Assignment) {
    this._assignment = asgmt;
    this.setCodes();
  }
  list = signal<LaborCodeItem[]>([])
  height = input<number>(250);
  width = input<number>(250);
  changed = output<string>();

  /**
   * This method will decide whether or not a labor code's checkbox will be checked
   * by comparing charge number/extension pairs with the assignment.
   * @param chargenumber The string value for the charge number
   * @param extension The string value for the charge number extension
   * @returns a boolean value to say if the charge number/extension was found in the
   * assignment.
   */
  isChecked(chargenumber: string, extension: string): boolean {
    let answer = false;
    this.assignment.laborcodes.forEach(lc => {
      if (lc.chargenumber.toLowerCase() === chargenumber.toLowerCase()
        && lc.extension.toLowerCase() === extension.toLowerCase()) {
        answer = true;
      }
    });
    return answer;
  }

  /**
   * This method is used to create a list of charge number/extension (labor code items)
   * for use in the list of labor codes.
   */
  setCodes() {
    const tList: LaborCodeItem[] = [];
    if (this.laborcodes.length > 0 && this.assignment.id >= 0) {
      this.laborcodes.forEach(lc => {
        tList.push({
          chargenumber: lc.chargeNumber,
          extension: lc.extension,
          checked: this.isChecked(lc.chargeNumber, lc.extension)
        });
      });
    }
    this.list.set(tList);
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

  /**
   * This method is used to feed the output of this display to its parent object.
   * @param chg A string value received from child objects
   */
  onChanged(chg: string) {
    this.changed.emit(chg);
  }
}
