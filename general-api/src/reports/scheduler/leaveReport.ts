import { Alignment, Borders, Fill, Font, RichText, Style, Workbook, Worksheet } from "exceljs";
import { LeaveMonth, LeavePeriod } from "./leaves";
import { Employee, IEmployee, Leave } from "scheduler-node-models/scheduler/employees";
import { Holiday, IHoliday } from "scheduler-node-models/scheduler/teams/company";
import { IWorkcode, Workcode } from "scheduler-node-models/scheduler/labor";
import { User } from "scheduler-node-models/users";
import { Formula, Report } from "scheduler-node-models/general";

export class LeaveReport extends Report {
  private employees: Employee[];
  private holidays: Holiday[];
  private fonts: Map<string, Partial<Font>>;
  private fills: Map<string, Fill>;
  private borders: Map<string, Partial<Borders>>;
  private alignments: Map<string, Partial<Alignment>>;
  private numformats: Map<string, string>;
  private workcodes: Map<string, Workcode>;

  constructor(holidays: IHoliday[], workcodes: IWorkcode[]) {
    super();
    this.employees = [];

    this.holidays = [];
    holidays.forEach(hol => {
      this.holidays.push(new Holiday(hol));
    });
    this.holidays.sort((a,b) => a.compareTo(b));
    this.fonts = new Map<string, Partial<Font>>();
    this.fills = new Map<string, Fill>();
    this.borders = new Map<string, Partial<Borders>>();
    this.alignments = new Map<string, Partial<Alignment>>();
    this.numformats = new Map<string, string>();
    this.workcodes = new Map<string, Workcode>();
    if (workcodes.length > 0) {
      workcodes.forEach(wc => {
        this.workcodes.set(wc.id, new Workcode(wc));
      })
    }
  }

  /**
   * This method is used to start the workbook creation and will call the other functional
   * sheets to create the report.
   * @param user The user object for the employee who is creating the report
   * @param iEmps A list of employee objects to use in creating the report
   * @param site A string value for the site identifier for the report
   * @param company A string value for the company identifier
   * @param reqDate A date object for the requested date
   * @returns The workbook object with the report data.
   */
  create(user: User, iEmps: IEmployee[], site: string, company: string, reqDate: Date) : Workbook {
    const start = new Date(Date.UTC(reqDate.getUTCFullYear(), 0, 1));
    const end = new Date(Date.UTC(reqDate.getUTCFullYear() + 1, 0, 1));
    iEmps.forEach(iemp => {
      const emp = new Employee(iemp);
      if (emp.atSite(site, start, end) 
        && emp.companyinfo.company.toLowerCase() === company.toLowerCase()) {
        this.employees.push(emp);
      }
    });
    this.employees.sort((a,b) => a.compareTo(b));

    const workbook = new Workbook();
    workbook.creator = user.getFullName();
    workbook.created = new Date();

    this.createStyles();

    this.createLeaveListing(workbook, start.getFullYear(), this.holidays.length > 0);
    this.createMonthlyListing(workbook, start.getFullYear(), true);
    this.createMonthlyListing(workbook, start.getFullYear(), false);

    return workbook;
  }


  /**
   * This function will create the basic style information to be used within the sheet
   * cells, which consists for font styles, cell fill styles, borders, and alignments for
   * the text within the cell.  Plus a late addition of the various number formats to 
   * present.
   */
  createStyles() {
    // set fonts
    this.fonts.set("bold14", {bold: true, size: 14, color: { argb: 'ff000000'}});
    this.fonts.set("bold12", {bold: true, size: 12, color: { argb: 'ff000000'}});
    this.fonts.set("bold10", {bold: true, size: 10, color: { argb: 'ff000000'}});
    this.fonts.set("nobold10", {bold: false, size: 10, color: { argb: 'ff000000'}});
    this.fonts.set("bold8", {bold: true, size: 8, color: { argb: 'ff000000'}});
    this.fonts.set("blue10", {bold: false, size: 10, color: { argb: 'ff00ffff'}});
    this.fonts.set("noblue10", {bold: false, size: 10, color: { argb: 'ff3366ff'}});
    this.fonts.set("blue8", {bold: true, size: 8, color: { argb: 'ff3366ff'}});
    this.fonts.set("white14", {bold: true, size: 14, color: { argb: 'ffffffff'}});
    this.fonts.set("white12", {bold: true, size: 12, color: { argb: 'ffffffff'}});
    this.fonts.set("white10", {bold: true, size: 10, color: { argb: 'ffffffff'}});

    // set fills
    this.fills.set('ptoname', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ff00ffff'}});
    this.fills.set('asof', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ff800000'}});
    this.fills.set('section', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ffcccccc'}});
    this.fills.set('white', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ffffffff'}});
    this.fills.set('dkgray', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ff999999'}});
    this.fills.set('yellow', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ffffff00'}});
    this.fills.set('month', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ff009933'}});
    this.fills.set('ltblue', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ff66ffff'}});
    this.fills.set('ltbrown', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'fffcd5b4'}});
    this.fills.set('gray', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ffc0c0c0'}});
    this.fills.set('ltgray', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ffbfbfbf'}});
    
    // set borders
    this.borders.set('blackthin', {
      top: { style: 'thin', color: { argb: 'ff000000'}},
      left: { style: 'thin', color: {argb: 'ff000000'}},
      bottom: { style: 'thin', color: {argb: 'ff000000'}},
      right: { style: 'thin', color: { argb: 'ff000000'}}
    });
    this.borders.set('up', {
      top: { style: 'thick', color: { argb: 'ff000000'}},
      left: { style: 'thin', color: {argb: 'ff000000'}},
      bottom: undefined,
      right: { style: 'thin', color: { argb: 'ff000000'}}
    });
    this.borders.set('dn', {
      top: undefined,
      left: { style: 'thin', color: {argb: 'ff000000'}},
      bottom: { style: 'thick', color: { argb: 'ff000000'}},
      right: { style: 'thin', color: { argb: 'ff000000'}}
    });
    this.borders.set('bottom', {
      top: undefined,
      left: undefined,
      bottom: { style: 'thin', color: { argb: 'ff000000'}},
      right: undefined
    });

    // set alignments
    this.alignments.set('center', {horizontal: 'center', vertical: 'middle', wrapText: true });
    this.alignments.set('leftctr', {horizontal: 'left', vertical: 'middle', wrapText: true });

    // set number formats
    this.numformats.set('num', '0.0;mm/dd/yyy;@');
    this.numformats.set('int', '0;@');
    this.numformats.set('bal', '0.0;[Red]-0.0;@');
  }

  /**
   * This function will create the PTO/Holiday Section
   * @param workbook The report object in which a sheet is created into.
   * @param year the integer value for the year of the report
   */
  createLeaveListing(workbook: Workbook, year: number, showHolidays: boolean) {
    const sheetLabel = `${year} PTO-Hol`;
    const sheet = workbook.addWorksheet(sheetLabel, {
      pageSetup: { 
        paperSize: undefined, 
        orientation: 'landscape',
        fitToHeight: 1,
        fitToWidth: 1,
        blackAndWhite: false,
        fitToPage: true,
        showGridLines: false,
        horizontalCentered:true,
        verticalCentered: true
      },
      properties: {
        defaultRowHeight: 20,
        defaultColWidth: 4,
        outlineLevelCol: 0
      },
      views: [{
        state: 'frozen',
        ySplit: 1
      }]
    });

    let extendWidth = 3;
    if (showHolidays) {
      extendWidth += 4;
    }
    const formatter = new Intl.DateTimeFormat('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
    const now = new Date();

    // add current as of reference
    let style: Partial<Style> = {
      fill: this.fills.get('asof'),
      font: this.fonts.get("white12"),
      alignment: this.alignments.get("center"),
      border: this.borders.get("blackthin")
    };
    this.setCell(sheet, this.getCellID(0, 1), this.getCellID(extendWidth, 1),
      style, formatter.format(now));

    // set column widths
    if (showHolidays) {
      sheet.getColumn(1).width = 4.5;
      sheet.getColumn(2).width = 13;
      sheet.getColumn(3).width = 30;
      sheet.getColumn(4).width = 13;
      sheet.getColumn(5).width = 19;
      sheet.getColumn(6).width = 19;
      sheet.getColumn(7).width = 7;
      sheet.getColumn(8).width = 7;
      sheet.getColumn(9).width = 7;
    } else {
      sheet.getColumn(1).width = 19;
      sheet.getColumn(2).width = 19;
      sheet.getColumn(3).width = 7;
      sheet.getColumn(4).width = 7;
      sheet.getColumn(5).width = 7;
    }
    let row = 2;
    this.employees.forEach(emp => {
      row = this.employeePTOHolidaySection(sheet, emp, row, year, showHolidays) + 1;
    });
  }

  /**
   * This function will create the employee's Holidays and PTO report section
   * @param sheet The worksheet object in which to add this employee's section
   * @param emp The employee object used to determine the information about the section
   * @param row The numeric value for the beginning of the section
   * @param year The numeric value year the report is for.
   * @param showHoliday A boolean value on whether to show the holidays for not.
   * @returns the numeric value for the last row of this employee's section
   */
  employeePTOHolidaySection(sheet: Worksheet, emp: Employee, row: number, year: number,
    showHoliday: boolean): number {
    let annual = 0.0;
    let carry = 0.0;
    emp.balances.forEach(bal => {
      if (bal.year === year) {
        annual = bal.annual;
        carry = bal.carryover;
      }
    });
    let extendedWidth = 5;
    if (showHoliday) {
      extendedWidth += 4;
    }
    const tdate = new Date(Date.UTC(year, 5, 1))
    const std = emp.getStandardWorkday(tdate);

    let style: Partial<Style> = {
      fill: this.fills.get("ptoname"),
      font: this.fonts.get("bold12"),
      alignment: this.alignments.get("center"),
      border: this.borders.get("blackthin")
    }
    this.setCell(sheet, this.getCellID(0, row), this.getCellID(extendedWidth-1, row),
      style, emp.name.getLastFirst());
    row++;

    let col = 0;
    style = {
      fill: this.fills.get('section'),
      font: this.fonts.get('bold10'),
      alignment: this.alignments.get('center'),
      border: this.borders.get('blackthin')
    };
    if (showHoliday) {
      this.setCell(sheet, this.getCellID(0, row), this.getCellID(3, row), style, 
        'Holidays');
      col = 4
    }
    this.setCell(sheet, this.getCellID(col, row), this.getCellID(col+4, row), style, 
      'Leaves');

    // create holidays and leave months
    const months: LeaveMonth[] = [];
    for (let i=0; i < 12; i++) {
      const dtMonth = new Date(Date.UTC(year, i, 1));
      months.push(new LeaveMonth(dtMonth, std, false));
    }
    months.sort((a,b) => a.compareTo(b));

    const holidays: LeaveMonth[] = [];
    this.holidays.forEach(hol => {
      const dt = hol.getActual(year);
      if (dt) {
        holidays.push(new LeaveMonth(dt, std, false, hol));
      } else {
        holidays.push(new LeaveMonth(new Date(0), std, false, hol));
      }
    });
    holidays.sort((a,b) => a.compareTo(b));

    // add labels to the sections
    row++
    col = 0;
    style = {
      fill: this.fills.get('section'),
      font: this.fonts.get('bold8'),
      alignment: this.alignments.get('center'),
      border: this.borders.get('blackthin')
    };
    if (showHoliday) {
      this.setCell(sheet, this.getCellID(0, row), this.getCellID(0, row), style, '');
      this.setCell(sheet, this.getCellID(1, row), this.getCellID(1, row), style, 
        'Reference Date');
      this.setCell(sheet, this.getCellID(2, row), this.getCellID(2, row), style, 'Hours');
      const rcell = sheet.getCell(this.getCellID(3, row));
      rcell.style = {
        fill: this.fills.get('section'),
        font: this.fonts.get('bold8'),
        alignment: this.alignments.get('center'),
        border: this.borders.get('blackthin')
      };
      rcell.value = { 'richText': [
        {'font': {'size': 8, 'bold': true, 'color': {'argb': 'ff000000'}}, 'text': 'Date Taken ('},
        {'font': {'size': 8, 'bold': true, 'color': {'argb': 'ff3366ff'}}, 'text': 'Projected'},
        {'font': {'size': 8, 'bold': true, 'color': {'argb': 'ff000000'}}, 'text': ')'}
      ]};
      col = 4;
    }
    
    sheet.mergeCells(this.getCellID(col, row), this.getCellID(col+1, row));
    let cell = sheet.getCell(this.getCellID(col, row));
    cell.style = {
      fill: this.fills.get('section'),
      font: this.fonts.get('bold8'),
      alignment: this.alignments.get('center'),
      border: this.borders.get('blackthin')
    };
    cell.value = { 'richText': [
      {'font': {'size': 8, 'bold': true, 'color': {'argb': 'ff000000'}}, 'text': 'Leave Taken ('},
      {'font': {'size': 8, 'bold': true, 'color': {'argb': 'ff3366ff'}}, 'text': 'Projected'},
      {'font': {'size': 8, 'bold': true, 'color': {'argb': 'ff000000'}}, 'text': ')'}
    ]};
    style = {
      fill: this.fills.get('section'),
      font: this.fonts.get('bold8'),
      alignment: this.alignments.get('center'),
      border: this.borders.get('blackthin')
    }
    this.setCell(sheet, this.getCellID(col+2, row), this.getCellID(col+2, row), style,
      "Taken");
    style.font = this.fonts.get('blue8');
    this.setCell(sheet, this.getCellID(col+3, row), this.getCellID(col+3, row), style,
      "Request");
    row++;

    const startAsgmt = emp.assignments[0];
    const endAsgmt = emp.assignments[emp.assignments.length - 1];
    // ensure months are clear, plus check if the month should be disabled.
    months.forEach((month, m) => {
      const startMonth = new Date(Date.UTC(month.month.getUTCFullYear(), 
        month.month.getUTCMonth() + 1, 1))
      month.periods = [];
      month.disabled = (startAsgmt.startDate.getTime() > startMonth.getTime() 
        || endAsgmt.endDate.getTime() < month.month.getTime());
      months[m] = month;
    });

    // ensure the holidays are clear, plus check if the holiday should be disabled.
    // Only holidays with id of "H" can be disabled, floating holidays aren't.
    holidays.forEach((hol, h) => {
      hol.periods = [];
      if (hol.holiday && hol.holiday.id.toLowerCase().substring(0,1) === 'h') {
        hol.disabled = (startAsgmt.startDate.getTime() > hol.month.getTime()
          || endAsgmt.endDate.getTime() < hol.month.getTime());
      }
      holidays[h] = hol;
    });

    // sort the employee's leaves, then put the ones for the selected year into arrays
    // for further use.
    emp.leaves.sort((a,b) => a.compareTo(b));
    const empHolidays: Leave[] = [];
    const empOtherLeaves: Leave[] = [];

    emp.leaves.forEach(lv => {
      if (lv.leavedate.getUTCFullYear() === year) {
        if (lv.code.toLowerCase() === 'h') {
          empHolidays.push(new Leave(lv));
        } else {
          empOtherLeaves.push(new Leave(lv));
        }
      }
    });

    // next process the employee's holidays into the holidays array
    // 1.  Go through the leaves and place the tagged holidays into the holiday list
    empHolidays.forEach((empHol, eh) => {
      if (empHol.tagday && empHol.tagday !== '') {
        const code = empHol.tagday.substring(0,1);
        const num = Number(empHol.tagday.substring(1));
        holidays.forEach((hol, h) => {
          if (hol.holiday && hol.holiday.id.toLowerCase() === code
            && hol.holiday.sort === num && !empHol.used) {
            hol.addLeave(empHol);
            empHol.used = true;
            holidays[h] = hol;
            empHolidays[eh] = empHol;
          }
        });
      }
    });

    // 2. For those not tagged, actuals are listed first.
    empHolidays.forEach((empHol, eh) => {
      if (!empHol.used && empHol.status.toLowerCase() === 'actual') {
        holidays.forEach((hol, h) => {
          if (!empHol.used && hol.holiday && hol.holiday.id.toLowerCase() === 'h'
            && !hol.disabled && hol.getHours()+empHol.hours <= 8.0) {
            hol.addLeave(empHol);
            empHol.used = true;
            holidays[h] = hol;
            empHolidays[eh] = empHol;
          }
        });
      }
    });

    // 3. Next check for those holidays that match the actual date
    empHolidays.forEach((empHol, eh) => {
      if (!empHol.used) {
        holidays.forEach((hol, h) => {
          if (!empHol.used && hol.holiday && hol.holiday.id.toLowerCase() === 'h'
            && hol.month.getTime() === empHol.leavedate.getTime()
            && !hol.disabled && hol.getHours()+empHol.hours <= 8.0) {
            hol.addLeave(empHol);
            empHol.used = true;
            holidays[h] = hol;
            empHolidays[eh] = empHol;
          }
        });
      }
    });

    // 4. next, with any holidays not already used
    empHolidays.forEach((empHol, eh) => {
      if (!empHol.used) {
        let found = false;
        holidays.forEach((hol, h) => {
          if (!found && !hol.disabled) {
            if (hol.getHours()+empHol.hours <= 8.0) {
              hol.addLeave(empHol);
              holidays[h] = hol;
              found = true;
              empHol.used = true;
              empHolidays[eh] = empHol;
            }
          }
        })
      }
    });

    // 5.  if there are any unused holidays, plug them into disabled holidays.
    empHolidays.forEach((empHol, eh) => {
      if (!empHol.used) {
        let found = false;
        holidays.forEach((hol, h) => {
          if (!found && hol.disabled) {
            found = true;
            hol.addLeave(empHol);
          }
        });
      }
    });

    // next, place the non-holiday leaves into the months they are using in.
    empOtherLeaves.sort((a,b) => a.compareTo(b));
    empOtherLeaves.forEach(lv => {
      months.forEach((month, m) => {
        if (month.month.getUTCFullYear() === lv.leavedate.getUTCFullYear()
          && month.month.getUTCMonth() === lv.leavedate.getUTCMonth()) {
          month.addLeave(lv);
          months[m] = month;
        }
      });
    });

    // now insert the holidays for companies that have holidays designated.
    const now = new Date()
    col = 0;
    if (showHoliday) {
      holidays.sort((a,b) => a.compareTo(b));
      holidays.forEach((hol, h) => {
        hol.periods.sort((a,b) => a.compareTo(b));
        const holRow = row + h;
        style = {
          fill: this.fills.get('white'),
          font: this.fonts.get('bold10'),
          alignment: this.alignments.get('center'),
          border: this.borders.get('blackthin'),
          numFmt: this.numformats.get('num')
        };
        if (hol.disabled) {
          style.fill = this.fills.get('dkgray');
          style.font = this.fonts.get('nobold10');
        } else if (hol.holiday && hol.holiday.getActual(year)
          && hol.holiday.getActual(year)!.getTime() > now.getTime()) {
          style.fill = this.fills.get('white');
          style.font = this.fonts.get('nobold10');
        }
        this.setCell(sheet, this.getCellID(col, holRow), this.getCellID(col, holRow), 
          style, hol.holiday!.toString());
        if (hol.holiday!.getActual(year)) {
          const formatter = new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: '2-digit'
              });
          this.setCell(sheet, this.getCellID(col+1, holRow), this.getCellID(col+1, holRow),
            style, formatter.format(hol.holiday!.getActual(year)));
        } else {
          this.setCell(sheet, this.getCellID(col+1, holRow), this.getCellID(col+1, holRow),
            style, '');
        }
        const cellText: RichText[] = []
        hol.periods.forEach((prd, p) => {
          prd.leaves.forEach((lv, l) => {
            if (p > 0 || l > 0) {
              cellText.push({'font': {'size': 10, 'bold': true, 
                'color': {'argb': 'ff000000'}}, 'text': ','});
            }
            const formatter = new Intl.DateTimeFormat('en-US', {
              day: '2-digit',
              month: 'short'
            });
            if (lv.status.toLowerCase() === 'actual') {
              cellText.push({'font': {'size': 10, 'bold': true, 
                'color': {'argb': 'ff000000'}}, 'text': formatter.format(lv.leavedate)});
              if (lv.hours < 8) {
                cellText.push({'font': {'size': 7, 'bold': true, 'vertAlign': 'superscript',
                  'color': {'argb': 'ff000000'}}, 'text': `(${lv.hours.toFixed(1)})`});
              }
            } else {
              cellText.push({'font': {'size': 10, 'bold': true, 
                'color': {'argb': 'ff3366ff'}}, 'text': formatter.format(lv.leavedate)});
              if (lv.hours < 8) {
                cellText.push({'font': {'size': 7, 'bold': true, 'vertAlign': 'superscript',
                  'color': {'argb': 'ff3366ff'}}, 'text': `(${lv.hours.toFixed(1)})`});
              }
            }
          });
        });
        this.setCell(sheet, this.getCellID(col+2, holRow), this.getCellID(col+2, holRow),
          {
          fill: this.fills.get('white'),
          alignment: this.alignments.get('center'),
          border: this.borders.get('blackthin')
          }, cellText);
        this.setCell(sheet, this.getCellID(col+3, holRow), this.getCellID(col+3, holRow),
          style, hol.getHours())
      });
      col = 4;
    }
    months.sort((a,b) => a.compareTo(b));
    months.forEach((month, m) => {
      const lvRow = row + m;
      style = {
        fill: this.fills.get('white'),
        font: this.fonts.get('nobold10'),
        alignment: this.alignments.get('leftctr'),
        border: this.borders.get('blackthin'),
        numFmt: this.numformats.get('num')
      };
      if (month.disabled) {
        style = {
          fill: this.fills.get('dkgray'),
          font: this.fonts.get('nobold10'),
          alignment: this.alignments.get('leftctr'),
          border: this.borders.get('blackthin')
        };
      }
      const cellText: RichText[] = [];
      const formatter = new Intl.DateTimeFormat('en-US', {
        month: 'short'
      });
      cellText.push({'font': {'size': 10, 'bold': true, 
        'color': {'argb': 'ffff0000'}}, 'text': `${formatter.format(month.month)}: `});
      month.periods.forEach((prd, p) => {
        if (p > 0) {
          cellText.push({'font': {'size': 10, 'bold': true, 
            'color': {'argb': 'ff000000'}}, 'text': ','});
        }
        let text = '';
        let bHours = false;
        if (prd.start.getTime() !== prd.end.getTime()) {
          text = `${prd.start.getDate()}-${prd.end.getDate()}`;
        } else {
          text = `${prd.start.getDate()}`;
          if (prd.getHours() < std) {
            bHours = true;
          }
        }
        let color = 'ff';
        if (prd.code.toLowerCase() === 'v' && prd.status.toLowerCase() === 'actual') {
          color += '000000';
        } else {
          const wc = this.workcodes.get(prd.code);
          if (wc) {
            color += wc.backcolor;
          } else {
            color += '000000';
          }
        }
        cellText.push({'font': {'size': 10, 'bold': true, 'color': { 'argb': color }},
          'text': text });
        if (bHours) {
          cellText.push({'font': {'size': 7, 'bold': true, 'vertAlign': 'superscript', 
            'color': { 'argb': color }}, 'text': `(${prd.getHours().toFixed(1)})` });
        }
      });
      this.setCell(sheet, this.getCellID(col, lvRow), this.getCellID(col+1, lvRow), style,
        cellText);
      style = {
        fill: this.fills.get('white'),
        font: this.fonts.get('nobold10'),
        alignment: this.alignments.get('center'),
        border: this.borders.get('blackthin'),
        numFmt: this.numformats.get('num')
      }
      if (month.disabled) {
        style.fill = this.fills.get('dkgray');
      }
      this.setCell(sheet, this.getCellID(col+2, lvRow), this.getCellID(col+2, lvRow),
        style, month.getHours('v', true));
      style.font = this.fonts.get('noblue10');
      this.setCell(sheet, this.getCellID(col+3, lvRow), this.getCellID(col+3,lvRow),
        style, month.getHours('v', false));
    });
    
    // now add the totals section to the employee's chart
    if (months.length > holidays.length) {
      row += months.length;
    } else {
      row += holidays.length;
    }
    style = {
      fill: this.fills.get('section'),
      font: this.fonts.get('bold8'),
      alignment: this.alignments.get('center'),
      border: this.borders.get('blackthin')
    }
    col = 0;
    if (showHoliday) {
      this.setCell(sheet, this.getCellID(col, row), this.getCellID(col, row), style,
        '');
      this.setCell(sheet, this.getCellID(col+1, row), this.getCellID(col+1, row), style,
        'Days Left');
      this.setCell(sheet, this.getCellID(col+2, row), this.getCellID(col+2, row), style,
        'Hours Left');
      this.setCell(sheet, this.getCellID(col+3, row), this.getCellID(col+3, row), style,
        'Total Hours');
      let daysLeft = 0;
      let hoursTaken = 0;
      holidays.forEach(hol => {
        if (hol.getHours() < 8 && !hol.disabled) {
          daysLeft++;
        }
        if (hol.getHours() > 0) {
          hoursTaken += hol.getHours();
        }
      });
      const hoursLeft = (holidays.length * 8.0) - hoursTaken;
      style = {
        fill: this.fills.get('white'),
        font: this.fonts.get('bold10'),
        alignment: this.alignments.get('center'),
        border: this.borders.get('blackthin'),
        numFmt: this.numformats.get('int')
      }
      this.setCell(sheet, this.getCellID(col, row+1), this.getCellID(col, row+1), style,
        '');
      this.setCell(sheet, this.getCellID(col+1, row+1), this.getCellID(col+1, row+1), style,
        daysLeft);
      this.setCell(sheet, this.getCellID(col+2, row+1), this.getCellID(col+2, row+1), style,
        hoursLeft);
      this.setCell(sheet, this.getCellID(col+3, row+1), this.getCellID(col+3, row+1), style,
        hoursTaken);
      col = 4;
    }

    style = {
      fill: this.fills.get('section'),
      font: this.fonts.get('bold8'),
      alignment: this.alignments.get('center'),
      border: this.borders.get('blackthin')
    }
    this.setCell(sheet, this.getCellID(col, row), this.getCellID(col, row), style,
      'Annual Leave');
    this.setCell(sheet, this.getCellID(col+1, row), this.getCellID(col+1, row), style,
      'Carry');
    this.setCell(sheet, this.getCellID(col+2, row), this.getCellID(col+2, row), style,
      'Total Taken');
    this.setCell(sheet, this.getCellID(col+3, row), this.getCellID(col+3, row), style,
      'Request');
    this.setCell(sheet, this.getCellID(col+4, row), this.getCellID(col+4, row), style,
      'Balance');

    let totalTaken = 0;
    let totalRequested = 0;
    months.forEach(month => {
      totalRequested += month.getHours('v', false);
      totalTaken += month.getHours('v', true);
    });
    const balance = (annual + carry) - (totalTaken + totalRequested);
    style = {
      fill: this.fills.get('white'),
      font: this.fonts.get('bold10'),
      alignment: this.alignments.get('center'),
      border: this.borders.get('blackthin'),
      numFmt: this.numformats.get('num')
    }

    this.setCell(sheet, this.getCellID(col, row+1), this.getCellID(col, row+1), style,
      annual);
    this.setCell(sheet, this.getCellID(col+1, row+1), this.getCellID(col+1, row+1), style,
      carry);
    this.setCell(sheet, this.getCellID(col+2, row+1), this.getCellID(col+2, row+1), style,
      totalTaken);
    style.font = this.fonts.get('noblue10');
    this.setCell(sheet, this.getCellID(col+3, row+1), this.getCellID(col+3, row+1), style,
      totalRequested);
    style.fill = this.fills.get('yellow');
    style.font = this.fonts.get('nobold10');
    style.numFmt = this.numformats.get('bal');
    this.setCell(sheet, this.getCellID(col+4, row+1), this.getCellID(col+4, row+1), style,
      balance);
    return row + 2;
  }

  /**
   * This method will be used to create worksheets in the workbook.  They can be either
   * listing months with all employees listed each month or months with only those 
   * employees that took actual leave during the month.  
   * @param workbook The workbook object in which to create worksheets for the listing
   * @param year The numeric value for the year of the listing
   * @param bAll A boolean value for whether to list all employee's or not.
   */
  createMonthlyListing(workbook: Workbook, year: number, bAll?: boolean) {

    let sheetLabel = `${year} Monthly`;
    if (!bAll) {
      sheetLabel += ' (Minimum)';
    }
    const sheet = workbook.addWorksheet(sheetLabel, {
      pageSetup: { 
        paperSize: undefined, 
        orientation: 'landscape',
        fitToHeight: 1,
        fitToWidth: 1,
        blackAndWhite: false,
        fitToPage: true,
        showGridLines: false,
        horizontalCentered:true,
        verticalCentered: true
      },
      properties: {
        defaultRowHeight: 20,
        defaultColWidth: 4,
        outlineLevelCol: 0
      },
      views: [{
        state: 'frozen',
        ySplit: 4
      }]
    });

    const formatter = new Intl.DateTimeFormat('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
    const now = new Date();

    // add current as of reference
    let style: Partial<Style> = {
      fill: this.fills.get('asof'),
      font: this.fonts.get("white12"),
      alignment: this.alignments.get("center"),
      border: this.borders.get("blackthin")
    };
    this.setCell(sheet, this.getCellID(0, 1), this.getCellID(3, 1),
      style, formatter.format(now));
    let text = `${year} PTO/HOL Quick Reference (${(bAll) ? 'FULL' : 'MINIMUM'})`;
    style = {
      fill: this.fills.get('white'),
      font: this.fonts.get('bold14'),
      alignment: this.alignments.get('center'),
      border: undefined
    };
    this.setCell(sheet, this.getCellID(4, 1), this.getCellID(33,1), style, text);

    // set column widths
    sheet.getColumn(1).width = 2;
    sheet.getColumn(2).width = 20;
    for (let c=3; c <= 33; c++) {
      sheet.getColumn(c).width = 4;
    }
    for (let c=34; c <= 36; c++) {
      sheet.getColumn(c).width = 7;
    }

    // add leave legend codes
    let col = 2;
    let row = 2;
    this.workcodes.forEach(wc => {
      if (wc.isLeave) {
        if (col+6 > 33) {
          col = 2;
          row++;
        }
        style = {
          fill: {type: 'pattern', pattern: 'solid', fgColor: {argb: `ff${wc.backcolor}`}},
          font: {bold: true, size: 10, color: { argb: `ff${wc.textcolor}`}},
          alignment: this.alignments.get('center'),
          border: this.borders.get('blackthin')
        };
        this.setCell(sheet, this.getCellID(col, row), this.getCellID(col, row), style, '');

        style = {
          fill: {type: 'pattern', pattern: 'solid', fgColor: {argb: `ffffffff`}},
          font: {bold: true, size: 10, color: { argb: `ff000000`}},
          alignment: this.alignments.get('center'),
          border: {
            top: undefined,
            left: undefined,
            bottom: { style: 'thin', color: { argb: 'ff000000'}},
            right: undefined
          }
        };
        this.setCell(sheet, this.getCellID(col+1, row), this.getCellID(col+5,row), style,
          wc.title);
        col += 6;
      }
    });

    
    for (let m=0; m < 12; m++) {
      row++;
      row = this.createMonthListing(sheet, row, m, year, bAll)
    }
  }

  /**
   * This method will create a list of employee leaves within a month.  If all employees
   * are listed, it will also include a total section
   * @param sheet The worksheet object used for creating the month.
   * @param row The numeric value for the row number to start the month.
   * @param month The numeric value for the month of the year (zero-based)
   * @param year The numeric value for the year
   * @param bAll The boolean value to use all employees or just those with leaves during
   * a month.
   * @returns A numeric value to the last row of the month's table.
   */
  createMonthListing(sheet: Worksheet, row: number, month: number, year: number, 
    bAll?: boolean): number {

    // Add Two rows for the month label/year, plus columns for each day of the month.
    // also, with full report (bAll), then add labels for the totals in columns 34-36.
    let col = 1;
    let style: Partial<Style> = {
      fill: this.fills.get('month'),
      font: this.fonts.get('white14'),
      alignment: this.alignments.get('center'),
      border: this.borders.get('monthup')
    }

    // set the month start dates and the start of the next month minus 12 hours.
    const start = new Date(Date.UTC(year, month, 1));
    const end = new Date(Date.UTC(year, month+1, 1) - (12 * 3600000));

    // set the constants for month and weekday names for the labels
    const months = [ 'January', 'Febuary', 'March', 'April', 'May', 'June', 'July', 
      'August', 'September', 'October', 'November', 'December' ];
    const weekdays = [ 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    
    // the label rows need to be set to 20
    sheet.getRow(row).height = 20;
    sheet.getRow(row+1).height = 20;

    // Set the cells that provide the month and year
    this.setCell(sheet, this.getCellID(col, row), this.getCellID(col, row), style, 
      months[month]);
    style.border = this.borders.get('monthdn')
    this.setCell(sheet, this.getCellID(col, row+1), this.getCellID(col, row+1), style,
      year);

    // now step through the days of the month from 1st to last to provide the day number
    // and weekday.  Style for weekdays is white fill and for weekends in light blue.
    let current = new Date(start);
    while (current.getTime() < end.getTime()) {
      style.font = this.fonts.get('bold10');
      style.border = this.borders.get('up');
      if (current.getUTCDay() === 0 || current.getUTCDay() === 6) {
        style.fill = this.fills.get('ltblue');
      } else {
        style.fill = this.fills.get('white');
      }
      let cellID = this.getCellID(col+current.getUTCDate(), row);
      this.setCell(sheet, cellID, cellID, style, current.getUTCDate());
      style.border = this.borders.get('dn');
      cellID = this.getCellID(col+current.getUTCDate(), row+1);
      this.setCell(sheet, cellID, cellID, style, weekdays[current.getUTCDay()]);
      current = new Date(current.getTime() + (24 * 3600000));
    }
    
    // the totals columns are only shown when all employees are shown on each month.
    if (bAll) {
      col = 33;
      style.font = this.fonts.get('white10');
      style.fill = this.fills.get('month');
      style.border = this.borders.get('up');
      let cellID = this.getCellID(col, row);
      this.setCell(sheet, cellID, cellID, style, 'Total');
      style.border = this.borders.get('dn');
      cellID = this.getCellID(col, row+1);
      this.setCell(sheet, cellID, cellID, style, 'Hours');
      col++;
      style.border = this.borders.get('up');
      cellID = this.getCellID(col, row);
      this.setCell(sheet, cellID, cellID, style, 'Hol/');
      style.border = this.borders.get('dn');
      cellID = this.getCellID(col, row+1);
      this.setCell(sheet, cellID, cellID, style, 'Other');
      col++;
      const pto = this.workcodes.get('V');
      style.fill = {type: 'pattern', pattern: 'solid', 
        fgColor: {argb: `ff${pto?.backcolor}`}};
      style.font = this.fonts.get('white10');
      style.border = this.borders.get('up');
      cellID = this.getCellID(col, row);
      this.setCell(sheet, cellID, cellID, style, 'PTO');
      style.border = this.borders.get('dn');
      cellID = this.getCellID(col, row+1);
      this.setCell(sheet, cellID, cellID, style, 'Only');
    }

    row += 2;
    const startRow = row;
    this.employees.forEach(emp => {
      if (this.createEmployeeMonthList(sheet, row, start, end, emp, bAll)) {
        row++;
      }
    });
    const endRow = row-1;
    if (bAll) {
      const formula = `SUM(${this.getCellID(33, startRow)}:${this.getCellID(33, endRow)})`;
      style = {
        fill: this.fills.get('yellow'),
        font: this.fonts.get('bold10'),
        alignment: this.alignments.get('center'),
        border: this.borders.get('blackthin'),
        numFmt: this.numformats.get('num')
      };
      this.setCell(sheet, this.getCellID(33, row), this.getCellID(33, row), style,
        new Formula(formula));
      this.setCell(sheet, this.getCellID(34, row), this.getCellID(35, row), style, 'Totals');
      row++;
    }
    return row;
  }

  createEmployeeMonthList(sheet: Worksheet, row: number, start: Date, end: Date, 
    employee: Employee, bAll?: boolean): boolean {
    if (bAll || employee.getLeaveHours(start, end) > 0) {
      let col = 1;
      let style: Partial<Style> = {
        fill: this.fills.get('white'),
        font: this.fonts.get('bold10'),
        alignment: this.alignments.get('center'),
        border: this.borders.get('blackthin')
      };
      sheet.getRow(row).height = 15;
      this.setCell(sheet, this.getCellID(col, row), this.getCellID(col, row), style, 
        employee.name.getFirstLast());
      let current = new Date(start);
      while (current.getTime() < end.getTime()) {
        col++;
        const wd = employee.getLeave(current);
        if (wd.hours > 0) {
          const wc = this.workcodes.get(wd.code);
          if (wc) {
            style = {
              fill: {type: 'pattern', pattern: 'solid', fgColor: {argb: `ff${wc.backcolor}`}},
              font: {bold: true, size: 10, color: { argb: `ff${wc.textcolor}`}},
              alignment: this.alignments.get('center'),
              border: this.borders.get('blackthin')
            };
            this.setCell(sheet, this.getCellID(col, row), this.getCellID(col, row), style,
              wd.hours.toFixed(1));
          } else {
            style = {
              fill: this.fills.get('white'),
              font: this.fonts.get('bold10'),
              alignment: this.alignments.get('center'),
              border: this.borders.get('blackthin')
            };
            this.setCell(sheet, this.getCellID(col, row), this.getCellID(col, row), style,
              "");
          }
        } else {
          style = {
            fill: this.fills.get('white'),
            font: this.fonts.get('bold10'),
            alignment: this.alignments.get('center'),
            border: this.borders.get('blackthin')
          };
          this.setCell(sheet, this.getCellID(col, row), this.getCellID(col, row), style,
            "");
        }
        current = new Date(current.getTime() + (24 * 3600000));
      }
      if (bAll) {
        const total = employee.getLeaveHours(start, end);
        const pto = employee.getPTOHours(start, end);
        const other = total - pto;
        style = {
          fill: this.fills.get('white'),
          font: this.fonts.get('bold10'),
          alignment: this.alignments.get('center'),
          border: this.borders.get('blackthin'),
          numFmt: this.numformats.get('num')
        };
        this.setCell(sheet, this.getCellID(33, row), this.getCellID(33, row), style,
          total);
        this.setCell(sheet, this.getCellID(34, row), this.getCellID(34, row), style,
          other);
        this.setCell(sheet, this.getCellID(35, row), this.getCellID(35, row), style,
          pto);
      }
      return true;
    }
    return false;
  }
}