import { Alignment, Borders, Fill, Font, Style, Workbook } from "exceljs";
import { ObjectId } from "mongodb";
import { Report, ReportRequest } from "scheduler-node-models/general";
import { Employee, IEmployee } from "scheduler-node-models/scheduler/employees";
import { User } from "scheduler-node-models/users";
import { collections } from "../../config/mongoconnect";
import { MidShift } from "./midshift";

export class MidShiftReport extends Report {
  private currentAsOf: Date;
  private dateFormat: Intl.DateTimeFormat;
  private employees: Employee[];
  private fonts: Map<string, Partial<Font>>;
  private fills: Map<string, Fill>;
  private borders: Map<string, Partial<Borders>>;
  private alignments: Map<string, Partial<Alignment>>;

  constructor() {
    super();
    this.currentAsOf = new Date();
    this.dateFormat = new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    });
    this.employees = [];
    
    this.fonts = new Map<string, Partial<Font>>();
    this.fills = new Map<string, Fill>();
    this.borders = new Map<string, Partial<Borders>>();
    this.alignments = new Map<string, Partial<Alignment>>();
  }

  async create(user: User, data: ReportRequest): Promise<Workbook> {
    const workbook = new Workbook();
    workbook.creator = user.getFullName();
    workbook.created = new Date();

    workbook.addWorksheet('Sheet1');
    try {
      await this.getEmployees(data.teamid, data.siteid);

      this.createStyles();
      this.createMidShiftListSheet(workbook, this.currentAsOf.getFullYear());
      this.createMidShiftListSheet(workbook, this.currentAsOf.getFullYear() + 1);

      const sheet = workbook.getWorksheet('Sheet1');
      if (sheet) {
        workbook.removeWorksheet(sheet.id);
      }
    } catch (error) {
      console.log(error);
    }

    return workbook;
  }

  async getEmployees(teamid?: string, siteid?: string): Promise<void> {
    if (teamid && siteid && collections.employees) {
      // pull the employees for the team and site
      this.employees = [];
      const empQuery = { team: new ObjectId(teamid), site: siteid };
      const empCursor = collections.employees.find<IEmployee>(empQuery);
      const empResults = await empCursor.toArray();
      empResults.forEach(emp => {
        this.employees.push(new Employee(emp));
      });
    }
  }

  createStyles() {
    // set style fills
    this.fills.set('blue', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ff0066cc'}});
    this.fills.set('black', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ff000000'}});
    this.fills.set('white', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ffffffff'}});
    this.fills.set('gray', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ffc0c0c0'}});

    // set style fonts
    this.fonts.set("bold14white", {bold: true, size: 14, color: { argb: 'ffffffff'}});
    this.fonts.set("bold10white", {bold: true, size: 10, color: { argb: 'ffffffff'}});
    this.fonts.set("bold10", {bold: true, size: 10, color: { argb: 'ff000000'}});

    // set style alignments
    this.alignments.set('center', {horizontal: 'center', vertical: 'middle', wrapText: true });

    // set style borders
    this.borders.set('thickwhite', {
      top: { style: 'thick', color: { argb: 'ffffffff'}},
      left: { style: 'thick', color: {argb: 'ffffffff'}},
      bottom: { style: 'thick', color: {argb: 'ffffffff'}},
      right: { style: 'thick', color: { argb: 'ffffffff'}}
    });
    this.borders.set('thinblack', {
      top: { style: 'thin', color: { argb: 'ff000000'}},
      left: { style: 'thin', color: {argb: 'ff000000'}},
      bottom: { style: 'thin', color: {argb: 'ff000000'}},
      right: { style: 'thin', color: { argb: 'ff000000'}}
    });
  }

  createMidShiftListSheet(workbook: Workbook, year: number) {
    const midList: MidShift[] = [];
    this.employees.forEach(emp => {
      emp.variations.forEach(vari => {
        if (vari.mids && (vari.startdate.getFullYear() === year 
          || vari.enddate.getFullYear() === year)) {
          midList.push(new MidShift(emp.name, vari));
        }
      });
    });
    if (midList.length > 0) {
      midList.sort((a,b) => a.compareTo(b));
      const sheet = workbook.addWorksheet(`${year}`, {
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

      sheet.getColumn('A').width = 30.0;
      sheet.getColumn('B').width = 10.0;
      sheet.getColumn('C').width = 10.0;
      sheet.getColumn('D').width = 10.0;

      let style: Partial<Style> = {
        fill: this.fills.get('blue'),
        font: this.fonts.get('bold14white'),
        alignment: this.alignments.get('center'),
        border: this.borders.get('thickwhite')
      };
      this.setCell(sheet, 'A1', 'D1', style, 'MIDS ROTATION SCHEDULE');

      style.fill = this.fills.get('black');
      style.font = this.fonts.get('bold10white');
      this.setCell(sheet, 'A2', 'A2', style, 'NAME');
      this.setCell(sheet, 'B2', 'B2', style, 'START');
      this.setCell(sheet, 'C2', 'C2', style, 'END');
      this.setCell(sheet, 'D2', 'D2', style, 'DAYS OFF');

      let row = 3;
      midList.forEach((vari, m) => {
        style = {
          fill: (m%2 === 0) ? this.fills.get('white') : this.fills.get('gray'),
          font: this.fonts.get('bold10'),
          alignment: this.alignments.get('center'),
          border: this.borders.get('thinblack')
        };
        this.setCell(sheet, this.getCellID('A', row), this.getCellID('A', row), style,
          vari.name.getLastFirst());
        this.setCell(sheet, this.getCellID('B', row), this.getCellID('B', row), style,
          this.dateFormat.format(vari.mid.startdate));
        this.setCell(sheet, this.getCellID('C', row), this.getCellID('C', row), style,
          this.dateFormat.format(vari.mid.enddate));
        this.setCell(sheet, this.getCellID('D', row), this.getCellID('D', row), style,
          vari.getDaysOff());
        row++;
      });
    }
  }
}