import { Component, input, model, output } from '@angular/core';
import { MonthPeriod, WeekPeriod } from '../site-mod-time.models';
import { Employee } from 'scheduler-models/scheduler/employees';

@Component({
  selector: 'app-site-mod-time-month',
  imports: [],
  templateUrl: './site-mod-time-month.html',
  styleUrl: './site-mod-time-month.scss',
})
export class SiteModTimeMonth {
  month = model<MonthPeriod>(new MonthPeriod());
  employees = input<Employee[]>([]);
  changed = output<string>();

  formatter = Intl.DateTimeFormat('en-US', {
    year: '2-digit',
    month: '2-digit',
  });
  formatter2 = Intl.DateTimeFormat('en-US', {
    month: '2-digit',
    day: '2-digit',
  });

  getUTCMonthStyle(): string {
    let width = 50;
    if (this.month().expand) {
      width += 52 * this.month().weeks.length;
    }
    return `width: ${width}px;`;
  }

  getStyle(field: string, i: number): string {
    if (field.toLowerCase() === 'total') {
      return 'cell ' + (((i % 2) === 0) ? 'even' : 'odd') + 'total';
    }
    return 'cell ' + (((i % 2) === 0) ? 'even' : 'odd');
  }

  getValue(emp: Employee, week: WeekPeriod): string {
    return emp.getModTime(week.start, week.end).toFixed(1);
  }

  getTotalValue(emp: Employee): string {
    if (this.month().weeks.length > 0) {
      let total = emp.getModTime(this.month().weeks[this.month().weeks.length - 1].start,
        this.month().weeks[0].end);
      return total.toFixed(1);
    }
    return '0.0';
  }

  expandMonth() {
    const month = this.month();
    month.expand = !month.expand;
    this.month.set(month);
    const chg = `${this.month().month.getTime()}|${this.month().expand}`;
    this.changed.emit(chg);
  }
}
