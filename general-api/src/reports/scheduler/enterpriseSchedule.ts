import { Alignment, Borders, Fill, Font, Style, Workbook, Worksheet } from "exceljs";
import { Report } from "scheduler-node-models/general";
import { User } from "scheduler-node-models/users";
import { Workcode } from "scheduler-node-models/scheduler/labor";
import { ISite, Site } from "scheduler-node-models/scheduler/sites";
import { Employee, IEmployee } from "scheduler-node-models/scheduler/employees";

export class EnterpriseSchedule extends Report {
  private fonts: Map<string, Partial<Font>>;
  private fills: Map<string, Fill>;
  private borders: Map<string, Partial<Borders>>;
  private alignments: Map<string, Partial<Alignment>>;
  private workcodes: Map<string, Workcode>;

  constructor(workcodes: Workcode[]) {
    super();
    this.fonts = new Map<string, Partial<Font>>();
    this.fills = new Map<string, Fill>();
    this.borders = new Map<string, Partial<Borders>>();
    this.alignments = new Map<string, Partial<Alignment>>();
    this.workcodes = new Map<string, Workcode>();
    workcodes.forEach(wc => {
      this.workcodes.set(wc.id, new Workcode(wc));
    });
  }

  create(user: User, year: number, site: string, iEmps: IEmployee[]): Workbook {
    const workbook = new Workbook();
    workbook.creator = user.getFullName();
    workbook.created = new Date();
    this.createStyles();
    let start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year, 11, 31, 59, 59, 59));
    while (start.getTime() < end.getTime()) {
      this.addMonth(workbook, start, site, iEmps);
      start = new Date(Date.UTC(start.getFullYear(), start.getMonth() + 1, 1));
    }

    const sheet = workbook.getWorksheet('Sheet1');
    if (sheet) {
      workbook.removeWorksheet(sheet.id);
    }

    return workbook;
  }

  createStyles() {
    // set fonts
    this.fonts.set("bold11", {bold: true, size: 11, color: { argb: 'ff000000'}});
    this.fonts.set("bold11white", {bold: true, size: 11, color: { argb: 'ffffffff'}});

    // set fills
    this.fills.set('evenday', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ffc0c0c0'}});
    this.fills.set('weekend', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ffccffff'}});
    this.fills.set('evenend', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ff00e6e6'}});
    this.fills.set('weekday', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ffffffff'}});
    this.fills.set('month', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ffde5d12'}});
    this.fills.set('wkctr', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ff000000'}});

    // set borders
    this.borders.set('blackthin', {
      top: { style: 'thin', color: { argb: 'ff000000'}},
      left: { style: 'thin', color: {argb: 'ff000000'}},
      bottom: { style: 'thin', color: {argb: 'ff000000'}},
      right: { style: 'thin', color: { argb: 'ff000000'}}
    });

    // set alignments
    this.alignments.set('center', {horizontal: 'center', vertical: 'middle', wrapText: true });
  }

  addMonth(workbook: Workbook, start: Date, site: string,
    iEmps: IEmployee[]): void {
    const startDate = new Date(Date.UTC(start.getFullYear(), start.getMonth(), 1));
    const endDate = new Date(Date.UTC(start.getFullYear(), start.getMonth() + 1, 1));
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct',
      'Nov', 'Dec' ];
    const weekdays = [ 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa' ];

    const sheetLabel = `${months[startDate.getMonth()]}`
      + `${startDate.getFullYear().toString().substring(2)}`;
    const employees: Employee[] = [];
    iEmps.forEach(iEmp => {
      const emp = new Employee(iEmp);
      if (emp.atSite(site, startDate, endDate)) {
        employees.push(emp);
      }
    });
    employees.sort((a,b) => a.compareTo(b));

    // add a worksheet to the workbook and set the page options (landscape, etc)
    const sheet = workbook.addWorksheet(sheetLabel, {
      pageSetup: { 
        paperSize: undefined, 
        orientation: 'landscape',
        fitToHeight: 1,
        fitToWidth: 1,
        blackAndWhite: false,
        fitToPage: true,
        showGridLines: false,
        horizontalCentered: true,
        verticalCentered: true
      }
    });
    sheet.properties.defaultColWidth = 5.0;
    sheet.properties.defaultRowHeight = 20;

    // set the widths of the columns: 1 = 17.0 and the rest are 4.0
    let current = new Date(startDate);
    sheet.getColumn(1).width = 17.0;
    while (current.getTime() < endDate.getTime()) {
      sheet.getColumn(current.getDate() + 1).width = 4.0;
      current = new Date(current.getTime() + (24 * 3600000));
    }

    // label the first three rows with data
    let style: Partial<Style> = {
      border: this.borders.get('blackthin'),
      fill: this.fills.get('weekday'),
      font: this.fonts.get('bold11'),
      alignment: this.alignments.get('center')
    };

    current = new Date(startDate);
    while (current.getTime() < endDate.getTime()) {
      this.setCell(sheet, this.getCellID(current.getDate(), 1), 
        this.getCellID(current.getDate(), 1), style, months[current.getMonth()]);
      this.setCell(sheet, this.getCellID(current.getDate(), 2), 
        this.getCellID(current.getDate(), 2), style, weekdays[current.getDay()]);
      this.setCell(sheet, this.getCellID(current.getDate(), 3), 
        this.getCellID(current.getDate(), 3), style, current.getDate());
      current = new Date(current.getTime() + (24 * 3600000));
    }

    let row = 3;
    employees.forEach(emp => {
      row++;
      this.createEmployeeRow(sheet, startDate, endDate, row, emp);
    });
  }

  createEmployeeRow(sheet: Worksheet, start: Date, end: Date, row: number, emp: Employee) {
    let style: Partial<Style> = {
      border: this.borders.get('blackthin'),
      fill: this.fills.get('weekday'),
      font: this.fonts.get('bold11'),
      alignment: this.alignments.get('center')
    };
    this.setCell(sheet, this.getCellID(0, row), this.getCellID(0, row), style, 
      emp.name.getFirstLast());
    let current = new Date(start);
    while (current.getTime() < end.getTime()) {
      const wd = emp.getWorkday(current, 'general');
      const cell = this.getCellID(current.getDate(), row);
      let code = '';
      if (wd && wd.code !== '') {
        code = this.getDateValue(wd.code, wd.hours);
      }
      this.setCell(sheet, cell, cell, style, code);
      current = new Date(current.getTime() + (24 * 3600000));
    }
  }

  getDateValue(code: string, hours: number): string {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let answer = '';
    if (code !== '') {
      const wc = this.workcodes.get(code);
      if (wc) {
        if (wc.isLeave && wc.altcode) {
          answer = wc.altcode;
        } else if (!wc.isLeave) {
          answer = wc.start.toString().padStart(2, '0');
          const iHours = Math.floor(hours);
          if (iHours > 0) {
            answer += letters.substring(iHours-1, iHours);
          }
        }
      }
    }
    return answer;
  }
}