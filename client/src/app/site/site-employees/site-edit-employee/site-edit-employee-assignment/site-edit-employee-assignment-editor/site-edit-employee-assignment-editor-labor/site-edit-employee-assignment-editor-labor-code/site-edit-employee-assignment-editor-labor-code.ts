import { Component, Input, input, output, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { MatCheckboxModule } from '@angular/material/checkbox';

interface LaborCodeData {
  checked: boolean;
}

@Component({
  selector: 'app-site-edit-employee-assignment-editor-labor-code',
  imports: [
    FormField,
    MatCheckboxModule
  ],
  templateUrl: './site-edit-employee-assignment-editor-labor-code.html',
  styleUrl: './site-edit-employee-assignment-editor-labor-code.scss',
})
export class SiteEditEmployeeAssignmentEditorLaborCode {
  private _checked: boolean = false;
  chargenumber = input<string>('');
  extension = input<string>('');
  @Input()
  get checked(): boolean {
    return this._checked;
  }
  set checked(chk: boolean) {
    this._checked = chk;
    this.laborcodeForm.checked().value.set(chk);
  }
  changed = output<string>();

  laborcodeModel = signal<LaborCodeData>({
    checked: false,
  });
  laborcodeForm = form(this.laborcodeModel)

  onChecked() {
    const chgString = `0|labor|${this.chargenumber()}|${this.extension()}|`
      + `${this.laborcodeForm.checked().value()}`;
    this.changed.emit(chgString);
  }
}
