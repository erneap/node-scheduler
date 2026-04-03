import { Component, Input, input, output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AnnualLeave } from 'scheduler-models/scheduler/employees';

@Component({
  selector: 'app-site-edit-employee-leave-balances-year',
  imports: [
    ReactiveFormsModule,
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './site-edit-employee-leave-balances-year.html',
  styleUrl: './site-edit-employee-leave-balances-year.scss',
})
export class SiteEditEmployeeLeaveBalancesYear {
  private _balance: AnnualLeave = new AnnualLeave();
  @Input()
  get balance(): AnnualLeave {
    return this._balance;
  }
  set balance(bal: AnnualLeave) {
    this._balance = new AnnualLeave(bal);
    this.setBalance();
  }
  changed = output<string>();
  yearForm: FormGroup;

  constructor(
    private builder: FormBuilder
  ) {
    const now = new Date();
    this.yearForm = this.builder.group({
      annual: '100.0',
      carry: '0.0'
    });
  }

  setBalance() {
    this.yearForm.get('annual')?.setValue(this.balance.annual.toFixed(1));
    this.yearForm.get('carry')?.setValue(this.balance.carryover.toFixed(1));
  }

  onChange(field: string) {
    let change = `${this.balance.year}|${field}|`;
    if (field.toLowerCase() !== 'delete') {
      switch (field.toLowerCase()) {
        case "annual":
          change += `${this.yearForm.get('annual')?.value}`;
          break;
        case "carry":
          change += `${this.yearForm.get('carry')?.value}`;
          break;
      }
    }
    this.changed.emit(change);
  }
}
