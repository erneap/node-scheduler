import { Alignment, Borders, Fill, Font, Style, Workbook, Worksheet } from "exceljs";
import { Formula, Report } from "scheduler-node-models/general";
import { ISite, Site } from "scheduler-node-models/scheduler/sites";
import { IWorkcode, LaborCode, Workcode } 
  from "scheduler-node-models/scheduler/labor";
import { Employee, IEmployee } from "scheduler-node-models/scheduler/employees";
import { User } from "scheduler-node-models/users";
import { Forecast, Period } from "scheduler-node-models/scheduler/sites/reports";

export class ChargeStatusReport extends Report {
  private site: Site;
  private workcodes: Map<string, Workcode>;
  private lastWorked: Date;
  private fonts: Map<string, Partial<Font>>;
  private fills: Map<string, Fill>;
  private borders: Map<string, Partial<Borders>>;
  private alignments: Map<string, Partial<Alignment>>;
  private numformats: Map<string, string>;

  constructor(
    isite: ISite,
    workcodes: IWorkcode[]
  ) {
    super();
    this.site = new Site(isite);
    this.workcodes = new Map<string, Workcode>();
    workcodes.forEach(wc => {
      const wCode = new Workcode(wc);
      this.workcodes.set(wCode.id, wCode);
    });
    this.lastWorked = new Date(0);
    this.fonts = new Map<string, Partial<Font>>();
    this.fills = new Map<string, Fill>();
    this.borders = new Map<string, Partial<Borders>>();
    this.alignments = new Map<string, Partial<Alignment>>();
    this.numformats = new Map<string, string>();
  }

  create(user: User, iEmps: IEmployee[], companyID: string, 
    reqDate: Date) : Workbook {
    const workbook = new Workbook();
    workbook.creator = user.getFullName();
    workbook.created = new Date();

    // determine the lastworked date for the report
    const employees: Employee[] = [];
    this.lastWorked = new Date(0);
    iEmps.forEach(iEmp => {
      const emp = new Employee(iEmp);
      const last = emp.getLastWorkday();
      if (emp.companyinfo.company.toLowerCase() === companyID
        && emp.isActive(reqDate)) {
        if (last.getTime() > this.lastWorked.getTime()) {
          this.lastWorked = new Date(last);
        }
      }
      employees.push(emp);
    });
    employees.sort((a,b) => a.compareTo(b));

    this.createStyles();

    // create the statistics sheet first, so the other sheets can feed it data
    const stats = this.createStatisticsSheet(workbook);
    let statsRow = 3;

    // step through the forecast reports, to see if valid, create current and forecast
    // sheets.
    this.site.forecasts.forEach(rpt => {
      if (rpt.use(reqDate, companyID)) {
        let row = this.addReport(workbook, 'Current', rpt, employees, stats, statsRow)
        if (row) {
          statsRow = row;
        }
        row = this.addReport(workbook, 'Forecast', rpt, employees, stats, statsRow);
        if (row) {
          statsRow = row;
        }
      }
    });

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
    this.fonts.set("bold18", {bold: true, size: 14, color: { argb: 'ff000000'}});
    this.fonts.set("bold14", {bold: true, size: 14, color: { argb: 'ff000000'}});
    this.fonts.set("bold12", {bold: true, size: 12, color: { argb: 'ff000000'}});
    this.fonts.set("white12", {bold: false, size: 12, color: { argb: 'ffffffff'}});
    this.fonts.set("blue12", {bold: true, size: 12, color: { argb: 'ff0000ff'}});
    this.fonts.set("nobold9", {bold: false, size: 9, color: { argb: 'ff000000'}});
    this.fonts.set('notnorm', {bold: false, size: 9, color: { argb: 'ff0070c0'}});

    // set fills
    this.fills.set('black', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ff000000'}});
    this.fills.set('white', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ffffffff'}});
    this.fills.set('blue', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ff99ccff'}});
    this.fills.set('ltblue', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ffccffff'}});
    this.fills.set('green', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ff99cc00'}});
    this.fills.set('ltgreen', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ffccffcc'}});
    this.fills.set('dkblush', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ffda9694'}});
    this.fills.set('yellow', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ffffff00'}});
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
    this.borders.set('blacktotal', {
      top: { style: 'thick', color: { argb: 'ff000000'}},
      left: { style: 'thin', color: {argb: 'ff000000'}},
      bottom: { style: 'thick', color: {argb: 'ff000000'}},
      right: { style: 'thin', color: { argb: 'ff000000'}}
    });
    this.borders.set('blackthinNoRight', {
      top: { style: 'thin', color: { argb: 'ff000000'}},
      left: { style: 'thin', color: {argb: 'ff000000'}},
      bottom: { style: 'thin', color: {argb: 'ff000000'}},
      right: { style: 'thin', color: { argb: 'ffffffff'}}
    });
    this.borders.set('blackthinNoLeft', {
      top: { style: 'thin', color: { argb: 'ff000000'}},
      left: { style: 'thin', color: {argb: 'ffffffff'}},
      bottom: { style: 'thin', color: {argb: 'ff000000'}},
      right: { style: 'thin', color: { argb: 'ff000000'}}
    });

    // set alignments
    this.alignments.set('center', {horizontal: 'center', vertical: 'middle', wrapText: true });
    this.alignments.set('leftctr', {horizontal: 'left', vertical: 'middle', wrapText: true });
    this.alignments.set('rightctr', {horizontal: 'right', vertical: 'middle', wrapText: true });
    this.alignments.set('centerslant', {horizontal: 'center', vertical: 'middle', 
      wrapText: false, textRotation: 45});

    // set number formats
    this.numformats.set('sum', '##0.0;[Red]##0.0;-;@');
    this.numformats.set('monthsum', '_(* #,##0.0_);_(* (#,##0.0);_(* \"-\"??_);_(@_)');
    this.numformats.set('pct', '##0.0%;[Red]##0.0%;-;@');
  }

  /**
   * This function will create the various pages of the workbook which hold the actual
   * data for the workbook.  They will consist of a header section, then list the 
   * employee's work/forecast work hours by labor code.  lastly, if the stats worksheet
   * is provided, it will add the statistics formulas to the rows of data on this sheet,
   * by report type (current or forecast);
   * @param workbook A reference to the workbook object so worksheet creation is possible
   * @param type A string value to indicate if the report is for current or forecast data
   * @param report The forecast object used to define the period and labor codes for use
   * @param employees The list of site employees used for the report.
   * @param stats A reference to the statistics worksheet to allow this to add the 
   * correct formulas to it.
   * @param statsRow The numeric value for the last row used in the statistics worksheet.
   * @return The numeric value for the last row used in the statistics worksheet.
   */
  addReport(workbook: Workbook, type: string, report: Forecast, employees: Employee[], 
    stats?: Worksheet, statsRow?: number): number | undefined{
    const current = (type.toLowerCase() === 'current');
    const sheetLabel = `${report.name}_${type}`
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
        xSplit: 7
      }]
    });

    // set column widths
    const widths = [8, 10.57, 9, 14.57, 10.57, 20, 18.14, 17.57, 14.57, 14.57, 14.57, 55.14];
    const hidden = [ true, true, true, true, true, false, false, true, true, true, true, true ];
    const months = ['January', 'Febuary', 'March', 'April', 'May', 'June', 'July', 
      'August', 'September', 'October', 'November', 'December'];
    widths.forEach((width, w) => {
      sheet.getColumn(w+1).width = width;
      sheet.getColumn(w+1).hidden = hidden[w];
    });

    let columns = 12;
    report.periods.forEach(period => {
      const sumCol = columns + 1;
      const startCol = columns + 2;
      const endCol = startCol + (period.periods.length - 1);
      sheet.getColumn(sumCol).width = 12;
      sheet.getColumn(sumCol).outlineLevel = 0;
      for (let i=startCol; i <= endCol; i++) {
        sheet.getColumn(i).width = 9;
        sheet.getColumn(i).outlineLevel = 1;
      }
      columns = endCol;
    });
    sheet.getColumn(columns + 1).width = 15.43;
    sheet.getColumn(columns + 1).outlineLevel = 0;

    // add page's headers
    let style: Partial<Style> = {
      fill: this.fills.get('white'),
      font: this.fonts.get("bold18"),
      alignment: this.alignments.get("leftctr"),
      border: this.borders.get("blackthin")
    };
    this.setCell(sheet, "A1", "G1", style, `FFP Labor: CLIN ${report.laborCodes[0].clin}`
      + ` SUMMARY`);
    const formatter = new Intl.DateTimeFormat('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
    this.setCell(sheet, "A2", "G2", style, `${report.name} Year - `
      + `${formatter.format(report.startDate)} - ${formatter.format(report.endDate)}`);

    style.font = this.fonts.get('bold14');
    this.setCell(sheet, "L1", "L1", style, "Weeks Per Accounting Month");
    this.setCell(sheet, "L2", "L2", style, "Accounting Month");
    this.setCell(sheet, "L3", "L3", style, "Week Ending");

    // Set headers for the employee information columns
    style = {
      fill: this.fills.get('black'),
      font: this.fonts.get('white12'),
      alignment: this.alignments.get('center'),
      border: this.borders.get('blackthin')
    }
    this.setCell(sheet, "A4", "A4", style, "CLIN");
    this.setCell(sheet, "B4", "B4", style, "SLIN");
    this.setCell(sheet, "C4", "C4", style, "Company");
    this.setCell(sheet, "D4", "D4", style, "Location");
    this.setCell(sheet, "E4", "E4", style, "WBS");
    this.setCell(sheet, "F4", "F4", style, "Labor NWA");
    this.setCell(sheet, "G4", "G4", style, "Last Name");
    this.setCell(sheet, "H4", "H4", style, "Labor Category");
    this.setCell(sheet, "I4", "I4", style, "Employee ID");
    this.setCell(sheet, "J4", "J4", style, "PeopleSoft ID");
    this.setCell(sheet, "K4", "K4", style, "Cost Center");
    this.setCell(sheet, "L4", "L4", style, "Comments/Remarks");

    // set headers for periods and sub-periods
    columns = 11;
    report.periods.forEach(period => {
      columns++;
      style = {
        fill: this.fills.get('white'),
        font: this.fonts.get('bold14'),
        alignment: this.alignments.get('center'),
        border: this.borders.get('blackthin')
      };
      this.setCell(sheet, this.getCellID(columns, 1), this.getCellID(columns, 1), style, 
        period.periods.length);
      this.setCell(sheet, this.getCellID(columns, 2), 
        this.getCellID(columns + period.periods.length, 2), style,
        months[period.month.getMonth()].toUpperCase());
      style.font = this.fonts.get('bold14');
      this.setCell(sheet, this.getCellID(columns, 3), this.getCellID(columns, 3), style,
        "Month Total");
      style = {
        fill: this.fills.get('dkblush'),
        font: this.fonts.get('bold12'),
        alignment: this.alignments.get('center'),
        border: this.borders.get('blackthin')
      };
      const dFormat = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: '2-digit'
      });
      this.setCell(sheet, this.getCellID(columns, 4), this.getCellID(columns, 4), style, 
        dFormat.format(period.month));
      const dtStyle: Partial<Style> = {
        fill: this.fills.get('white'),
        font: this.fonts.get('bold14'),
        alignment: this.alignments.get('center'),
        border: this.borders.get('blackthin')
      };
      const wkStyle: Partial<Style> = {
        fill: this.fills.get('yellow'),
        font: this.fonts.get('bold12'),
        alignment: this.alignments.get('center'),
        border: this.borders.get('blackthin')
      };
      period.periods.forEach((prd, p) => {
        let cellID = this.getCellID(columns+p+1, 3);
        this.setCell(sheet, cellID, cellID, dtStyle, dFormat.format(prd));
        cellID = this.getCellID(columns+p+1, 4);
        this.setCell(sheet, cellID, cellID, wkStyle, `Week ${p+1}`);
      });
      columns += period.periods.length;
    });

    // Add a totals column header for the overall totals
    style = {
      fill: this.fills.get('white'),
      font: this.fonts.get('bold12'),
      alignment: this.alignments.get('center'),
      border: this.borders.get('blackthin')
    };
    let cellID = this.getCellID(columns+1, 4);
    this.setCell(sheet, cellID, cellID, style, 'EAC');

    // create list of leave and work codes for comparison to determine working or
    // not working criteria
    let row = 4;
    let lastWorked = new Date(0);

    let column = 0;
    // this report is listed by labor code, then employees with hours
    report.laborCodes.forEach(lCode => {
      // step through the employees to see if they have hours for this labor code
      employees.forEach(emp => {
        if (emp.getLastWorkday().getTime() > lastWorked.getTime()) {
          lastWorked = new Date(emp.getLastWorkday());
        }
      })
      employees.forEach(emp => {
        // employee has used this labor code, if they have some actual or forecast hours.
        const actual = emp.getWorkedHours(report.startDate, report.endDate, 
          lCode.chargeNumber, lCode.extension);
        const forecast = emp.getForecastHours(lCode, report.startDate, report.endDate, 
          this.workcodes);
        if (actual > 0 || forecast > 0) {
          row++;
          const col = this.employeeRow(sheet, lCode, row, emp, report, current, 
            this.workcodes, lastWorked);
          if (col > column) {
            column = col;
          }
        }
      });
    });

    // add totals row for each column on the sheet.
    column = 11
    const sumRow = row + 1;
    let formula = '';
    report.periods.forEach(period => {
      style = {
        fill: this.fills.get('dkblush'),
        font: this.fonts.get('bold12'),
        alignment: this.alignments.get('center'),
        border: this.borders.get('blacktotal'),
        numFmt: this.numformats.get('monthsum')
      }
      column++;
      formula = `SUM(${this.getCellID(column, 5)}:${this.getCellID(column, row)})`;
      cellID = this.getCellID(column, sumRow);
      this.setCell(sheet, cellID, cellID, style, new Formula(formula));
      period.periods.forEach(prd => {
        column++;
        style = {
          fill: this.fills.get('ltgray'),
          font: this.fonts.get('bold12'),
          alignment: this.alignments.get('center'),
          border: this.borders.get('blacktotal'),
          numFmt: this.numformats.get('sum')
        }
        formula = `SUM(${this.getCellID(column, 5)}:${this.getCellID(column, row)})`;
        cellID = this.getCellID(column, sumRow);
        this.setCell(sheet, cellID, cellID, style, new Formula(formula));
      });
    });
    column++;
    style = {
      fill: this.fills.get('dkblush'),
      font: this.fonts.get('bold12'),
      alignment: this.alignments.get('center'),
      border: this.borders.get('blacktotal'),
      numFmt: this.numformats.get('monthsum')
    }
    formula = `SUM(${this.getCellID(column, 5)}:${this.getCellID(column, row)})`;
    cellID = this.getCellID(column, sumRow);
    this.setCell(sheet, cellID, cellID, style, new Formula(formula));

    if (stats && statsRow) {
      // this is used to create the dates in the statistics labor rows
      const dFormat = new Intl.DateTimeFormat('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric'
      });
      for (let l=0; l < report.laborCodes.length; l++) {
        const lCode = report.laborCodes[l];
        const codeText = `${lCode.chargeNumber} ${lCode.extension}`;

        // determine the period to date total hours that should have been used based
        // upon an even spread of hours throughout the period.
        let codeHours = 0.0;
        let totalHours = 0.0;
        if (lCode.startDate && lCode.endDate) {
          const days = Math.ceil((lCode.endDate.getTime() - lCode.startDate.getTime()) 
            / (24 * 3600000));
          let daysToNow = 0.0; 
          if (lastWorked.getTime() > lCode.startDate.getTime()) {
            daysToNow = Math.ceil((lastWorked.getTime() - lCode.startDate.getTime()) 
              / (24 * 3600000));
          }
          if (lCode.hoursPerEmployee && lCode.minimumEmployees) {
            totalHours = lCode.hoursPerEmployee * lCode.minimumEmployees;
          }
          let perDay = 0.0;
          if (daysToNow > 0) {
            perDay = totalHours / days;
          }
          codeHours = perDay * daysToNow;
        }
        let style: Partial<Style> = {
          fill: this.fills.get('white'),
          font: this.fonts.get('bold12'),
          alignment: this.alignments.get("center"),
          border: this.borders.get('blackthin')
        };
        if (current) {
          // this branch will add the labor codes and start and end dates, plus the 
          // current formulas to the statistics worksheet.  It will modify the statsRow
          // value to reflect each row used by labor code.  Rows need to alternate fills,
          // so that rows are easier to delinate. Columns A to G.
          statsRow++;
          style.numFmt = undefined;
          const bLight = (statsRow % 2) === 0;

          // labor code, and dates cells first three columns
          if (bLight) {
            style.fill = this.fills.get('gray');
          } else {
            style.fill = this.fills.get('white');
          }
          this.setCell(stats, this.getCellID(0, statsRow), this.getCellID(0, statsRow), 
            style, codeText);
          this.setCell(stats, this.getCellID(1, statsRow), this.getCellID(1, statsRow),
            style, dFormat.format(lCode.startDate));
          this.setCell(stats, this.getCellID(2, statsRow), this.getCellID(2, statsRow),
            style, dFormat.format(lCode.endDate));
          
          // next current information next four columns, hours to date, total worked 
          // hours, +/- hours, percentage of hours to date.
          if (bLight) {
            style.fill = this.fills.get('blue');
          } else {
            style.fill = this.fills.get('ltblue')
          }
          style.numFmt = this.numformats.get('sum');
          this.setCell(stats, this.getCellID(3, statsRow), this.getCellID(3, statsRow),
            style, codeHours);
          let formula = `SUMIF(${sheetLabel}!${this.getCellID(5,5)}:`
            + `${this.getCellID(5, row)}, "*${codeText}*", ${sheetLabel}!`
            + `${this.getCellID(column,5)}:${this.getCellID(column, row)})`;
          this.setCell(stats, this.getCellID(4, statsRow), this.getCellID(4, statsRow),
            style, new Formula(formula));
          formula = `${this.getCellID(4, statsRow)} - ${this.getCellID(3, statsRow)}`;
          this.setCell(stats, this.getCellID(5, statsRow), this.getCellID(5, statsRow),
            style, new Formula(formula));
            
          formula = `IFERROR(${this.getCellID(4, statsRow)}/`
            + `${this.getCellID(3, statsRow)},"N/A")`;
          style.numFmt = this.numformats.get('pct');
          this.setCell(stats, this.getCellID(6, statsRow), this.getCellID(6, statsRow),
            style, new Formula(formula));
        } else {
          // this branch will add only the forecast data formulas to the statistics.  It 
          // will first find the correct row based on the labor code, then determine the 
          // fill style to use, then add the formula. Columns H to K
          let srow = 0;
          for (let r = 3; r <= statsRow && srow === 0; r++) {
            const cell = stats.getCell(r, 1);
            if (cell.text.toLowerCase() === codeText.toLowerCase()) {
              srow = r;
            }
          }
          // row greater than zero means the labor code was found and 
          if (srow > 0) {
            const bLight = (srow % 2) === 0;
            // forecast information next four columns, total hours, total forecasted 
            // hours, +/- hours, percentage of hours to date.
            if (bLight) {
              style.fill = this.fills.get('green');
            } else {
              style.fill = this.fills.get('ltgreen')
            }
            style.numFmt = this.numformats.get('sum');
            this.setCell(stats, this.getCellID(7, srow), this.getCellID(7, srow),
              style, totalHours);
            let formula = `SUMIF(${sheetLabel}!${this.getCellID(5,5)}:`
              + `${this.getCellID(5, row)}, "*${codeText}*", ${sheetLabel}!`
              + `${this.getCellID(column,5)}:${this.getCellID(column, row)})`;
            this.setCell(stats, this.getCellID(8, srow), this.getCellID(8,srow), style,
              new Formula(formula));
            formula = `${this.getCellID(8, srow)} - ${this.getCellID(7, srow)}`;
            this.setCell(stats, this.getCellID(9, srow), this.getCellID(9,srow), style,
              new Formula(formula));
            style.numFmt = this.numformats.get('pct');
            const oformula = new Formula(`IFERROR(${this.getCellID(8, row)}/`
              + `${this.getCellID(7, row)},"N/A")`);
            this.setCell(stats, this.getCellID(10, srow), this.getCellID(10, srow), style,
              oformula);
          }
        }
      }
    }
    return statsRow;
  }

  /**
   * This function focuses on an employee, who has hours in the labor code provided. This
   * will create a row of data on the worksheet for this employee's work in this 
   * category
   * @param sheet The reference to the worksheet to add a row of data to.
   * @param lCode The labor code object, which allows the work to focus on a single code.
   * @param row The numeric value for the worksheet row to use in filling in the data
   * @param emp The employee object to pull the work data.
   * @param report The forecast report object which provides the periods and other data 
   * used in constructing the employee's row.
   * @param current The boolean value which signifies whether only actual work performed 
   * or add in forecast work hours in this report sheet.
   * @param compare A map of workcode array, used to determine leaves and other non-work
   * periods.
   */
  employeeRow(sheet: Worksheet, lCode: LaborCode, row: number, emp: Employee, 
    report: Forecast, current: boolean, compare: Map<string, Workcode>, 
    lastWorked: Date): number {

    // create two style objects for filling in the employee's employment information as
    // pertains to the object
    let style: Partial<Style> = {
      fill: this.fills.get('white'),
      font: this.fonts.get('bold12'),
      alignment: this.alignments.get('center'),
      border: this.borders.get('blackthin'),
      numFmt: this.numformats.get('sum')
    };
    // lstyle is used for a section of the employee's information which highlights the
    // individual as working in a liaison capability.
    const lStyle: Partial<Style> = {
      fill: this.fills.get('white'),
      font: this.fonts.get('bold12'),
      alignment: this.alignments.get('leftctr'),
      border: this.borders.get('blackthin')
    };
    if (emp.companyinfo.jobtitle 
      && emp.companyinfo.jobtitle?.toLowerCase().indexOf('liaison') >= 0) {
      style.fill = this.fills.get('ltbrown');
      lStyle.fill = this.fills.get('ltbrown');
    }
    sheet.getRow(row).height = 15;

    // this section sets the various required columns with information about the
    // employment in the labor code.
    this.setCell(sheet, this.getCellID(0, row), this.getCellID(0, row), style, 
      (lCode.clin) ? lCode.clin : '');
    this.setCell(sheet, this.getCellID(1, row), this.getCellID(1, row), style, 
      (lCode.slin) ? lCode.slin : '');
    this.setCell(sheet, this.getCellID(2, row), this.getCellID(2, row), style, 
      (emp.companyinfo.division) ? emp.companyinfo.division.toUpperCase() : '');
    this.setCell(sheet, this.getCellID(3, row), this.getCellID(3, row), style, 
      (lCode.location) ? lCode.location : '');
    this.setCell(sheet, this.getCellID(4, row), this.getCellID(4, row), style, 
      (lCode.wbs) ? lCode.wbs : '');
    this.setCell(sheet, this.getCellID(5, row), this.getCellID(5, row), style, 
      `${lCode.chargeNumber} ${lCode.extension}`);
    this.setCell(sheet, this.getCellID(6, row), this.getCellID(6, row), lStyle, 
      emp.name.lastname);
    this.setCell(sheet, this.getCellID(7, row), this.getCellID(7, row), style, 
      (emp.companyinfo.rank) ? emp.companyinfo.rank : '');
    this.setCell(sheet, this.getCellID(8, row), this.getCellID(8, row), style, 
      emp.companyinfo.employeeid);
    this.setCell(sheet, this.getCellID(9, row), this.getCellID(9, row), style, 
      (emp.companyinfo.alternateid) ? emp.companyinfo.alternateid: '');
    this.setCell(sheet, this.getCellID(10, row), this.getCellID(10, row), style, 
      (emp.companyinfo.costcenter) ? emp.companyinfo.costcenter: '');
    this.setCell(sheet, this.getCellID(11, row), this.getCellID(11, row), style, "");

    // This section steps though the forecast report periods to provide the hours worked/
    // or forecasted to work, in the period.  Each period corresponds to an accounting
    // month and its weekly periods.  These are determined by the contract administrator
    // and put in the forecast report object.
    let column = 11;
    const sumlist: string[] = [];  // used to provide a total hours from the monthly values

    report.periods.forEach(period => {
      column++;
      style = {
        fill: this.fills.get('dkblush'),
        font: this.fonts.get('bold12'),
        alignment: this.alignments.get('rightctr'),
        border: this.borders.get('blackthin'),
        numFmt: this.numformats.get('sum')
      };

      // create the formula to obtain the monthly total of hours and set the formula to
      // the summary cell.
      let formula = '';
      if (period.periods.length > 1) {
        formula = `SUM(${this.getCellID(column+1, row)}:`
          + `${this.getCellID(column+period.periods.length, row)})`;
      } else {
        formula = `${this.getCellID(column+1, row)}`;
      }
      let cellID = this.getCellID(column, row);
      this.setCell(sheet, cellID, cellID, style, new Formula(formula));
      sumlist.push(cellID);

      // step through the weekly periods to get the employee's work hours.
      period.periods.forEach(prd => {
        column++;
        let last = new Date(prd);
        let first = new Date(last.getTime() - (6 * 24 * 3600000));
        if (first.getTime() < report.startDate.getTime()){
          first = new Date(Date.UTC(report.startDate.getFullYear(), 
            report.startDate.getMonth(), report.startDate.getDate()));
        }
        if (last.getTime() > report.endDate.getTime()) {
          last = new Date(Date.UTC(report.endDate.getFullYear(), 
            report.endDate.getMonth(), report.endDate.getDate()))
        }
        style = {
          fill: this.fills.get('ltgray'),
          font: this.fonts.get('bold12'),
          alignment: this.alignments.get('center'),
          border: this.borders.get('blackthin')
        };
        let hours = emp.getWorkedHours(first, last,
          lCode.chargeNumber, lCode.extension);
        // if the worksheet displays forecast data and the last date is after the 
        // employee's last recorded actual workday, show as a forecast value and get the
        // forecast hours added to the actual hours.
        if (!current) {
          if (last.getTime() > lastWorked.getTime()) {
            style.font = this.fonts.get('blue12');
          }
          hours += emp.getForecastHours(lCode, first, 
            last, this.workcodes)
        }
        let cellID = this.getCellID(column, row);
        this.setCell(sheet, cellID, cellID, style, hours);

        // this sets an excel conditional formatting relationship for if the resultant
        // value is equal to zero (0), changes fill color and displays a dash.
        sheet.addConditionalFormatting({
          ref: `${cellID}:${cellID}`,
          rules: [
            {
              type: 'cellIs',
              priority: 1,
              operator: 'equal',
              formulae: [0],
              style: {
                fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: `ffffb5b5`}},
                font: { bold: true, size: 12, color: { argb: `ff000000`}},
                alignment: {horizontal: 'center', vertical: 'middle', wrapText: true },
                numFmt: "##0.0;[Red]##0.0;-;@"
              }
            }
          ]
        });
      });
    });

    // lastly, set the totals column and conditional style format
    style = {
      fill: this.fills.get('dkblush'),
      font: this.fonts.get('bold12'),
      alignment: this.alignments.get('center'),
      border: this.borders.get('blackthin'),
      numFmt: this.numformats.get('monthsum')
    };
    column++;
    let cellID = this.getCellID(column, row);
    let formula = '';
    sumlist.forEach(c => {
      if (formula !== '') {
        formula += "+";
      }
      formula += c;
    });
    this.setCell(sheet, cellID, cellID, style, new Formula(formula));

    // these conditional formatting provides fill color change for if the employee
    // works more than his/her alloted hours or less than alloted hours.
    sheet.addConditionalFormatting({
      ref: `${cellID}`,
      rules: [
        {
          type: 'cellIs',
          priority: 1,
          operator: 'greaterThan',
          formulae: [lCode.hoursPerEmployee!],
          style: {
            fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: `ffffb5b5`}},
            font: { bold: true, size: 12, color: { argb: `ff000000`}},
            alignment: {horizontal: 'center', vertical: 'middle', wrapText: true },
            border: {
              top: { style: 'thin', color: { argb: 'ff000000'}},
              left: { style: 'thin', color: {argb: 'ff000000'}},
              bottom: { style: 'thin', color: {argb: 'ff000000'}},
              right: { style: 'thin', color: { argb: 'ff000000'}}
            },
            numFmt: "##0.0;[Red]##0.0;-;@"
          }
        }
      ]
    });
    sheet.addConditionalFormatting({
      ref: `${cellID}`,
      rules: [
        {
          type: 'cellIs',
          priority: 1,
          operator: 'lessThan',
          formulae: [lCode.hoursPerEmployee!],
          style: {
            fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: `ff99cc00`}},
            font: { bold: true, size: 12, color: { argb: `ff000000`}},
            alignment: {horizontal: 'center', vertical: 'middle', wrapText: true },
            border: {
              top: { style: 'thin', color: { argb: 'ff000000'}},
              left: { style: 'thin', color: {argb: 'ff000000'}},
              bottom: { style: 'thin', color: {argb: 'ff000000'}},
              right: { style: 'thin', color: { argb: 'ff000000'}}
            },
            numFmt: "##0.0;[Red]##0.0;-;@"
          }
        }
      ]
    });
    return column;
  }

  /**
   * This function will create the statistics page for the cover of the workbook, which
   * will hold all the formulas for overall labor usage.
   * @param workbook The excel workbook object use for creating worksheets within it.
   * @returns The reference to the statistics worksheet to allow other functions to fill
   * in the formulas to use.
   */
  createStatisticsSheet(workbook: Workbook): Worksheet {
    // Create the sheet just like the others but with the label statistics
    const sheetname = "Statistics";
    const sheet = workbook.addWorksheet(sheetname, {
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
      }
    });

    // set the width of all the columns
    sheet.getColumn("A").width = 30;
    for (let i=2; i < 12; i++) {
      sheet.getColumn(i).width = 12
    }

    // this is used to create the current as of date on the sheet
    const dFormat = new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    

    let style: Partial<Style> = {
      fill: this.fills.get('white'),
      font: this.fonts.get('bold18'),
      alignment: this.alignments.get('center'),
      border: this.borders.get('blackthin'),
    };
    const now = new Date();
    this.setCell(sheet, "A1", "K1", style, `Current As Of ${dFormat.format(now)}`);
    sheet.getRow(1).height = 20;
    sheet.getRow(2).height = 77;

    style = {
      fill: this.fills.get('white'),
      font: this.fonts.get('bold12'),
      alignment: this.alignments.get('centerslant'),
      border: this.borders.get("blackthin")
    }
    // Set the column headers with column B & C, inclusive dates in white/slanted 45
    this.setCell(sheet, "B2", "B2", style, "Start");
    this.setCell(sheet, "C2", "C2", style, "End");

    // To Date section headers in a blue/slant 45
    style.fill = this.fills.get('blue');
    this.setCell(sheet, "D2", "D2", style, "Alloted");
    this.setCell(sheet, "E2", "E2", style, "Used");
    this.setCell(sheet, "F2", "F2", style, "Over/Under");
    this.setCell(sheet, "G2", "G2", style, "Percent");

    // Overall/Projected section headers in a blue/slant 45
    style.fill = this.fills.get('green');
    this.setCell(sheet, "H2", "H2", style, "Alloted");
    this.setCell(sheet, "I2", "I2", style, "Used");
    this.setCell(sheet, "J2", "J2", style, "Over/Under");
    this.setCell(sheet, "K2", "K2", style, "Percent");

    // labels for the sections
    style.fill = this.fills.get('white');
    style.alignment = this.alignments.get('center');
    this.setCell(sheet, "A3", "A3", style, "Contract No/Ext");
    this.setCell(sheet, "B3", "C3", style, "Contract Period");
    style.fill = this.fills.get('blue');
    this.setCell(sheet, "D3", "G3", style, "Current");
    style.fill = this.fills.get('green');
    this.setCell(sheet, "H3", "K3", style, "Forecast");
    return sheet;
  }
}