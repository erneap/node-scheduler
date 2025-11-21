import { Alignment, Borders, Fill, Font, Style, Workbook, Worksheet } from "exceljs";
import { Report, ReportRequest } from "scheduler-node-models/general";
import { User } from "scheduler-node-models/users";
import { Workcode } from "scheduler-node-models/scheduler/labor";
import { ISite, Site } from "scheduler-node-models/scheduler/sites";
import { Employee, IEmployee, IWorkRecord, Work, WorkRecord } from "scheduler-node-models/scheduler/employees";
import { Holiday } from "scheduler-node-models/scheduler/teams/company";
import { collections } from '../../config/mongoconnect';
import { ObjectId } from "mongodb";
import { ITeam, Team } from "scheduler-node-models/scheduler/teams";

export class EnterpriseSchedule extends Report {
  private fonts: Map<string, Partial<Font>>;
  private fills: Map<string, Fill>;
  private borders: Map<string, Partial<Borders>>;
  private alignments: Map<string, Partial<Alignment>>;
  private workcodes: Map<string, Workcode>;
  private holidays: Holiday[];
  private site: Site;
  private employees: Employee[];

  constructor() {
    super();
    this.fonts = new Map<string, Partial<Font>>();
    this.fills = new Map<string, Fill>();
    this.borders = new Map<string, Partial<Borders>>();
    this.alignments = new Map<string, Partial<Alignment>>();
    this.workcodes = new Map<string, Workcode>();
    this.holidays = [];
    this.site = new Site();
    this.employees = [];
  }

  async create(user: User, data: ReportRequest): Promise<Workbook> {
    const workbook = new Workbook();
    workbook.creator = user.getFullName();
    workbook.created = new Date();
    try {
      this.createStyles();
      let start = new Date();
      if (data.startDate) {
        start = new Date(data.startDate);
      }
      start = new Date(Date.UTC(start.getUTCFullYear(), 0, 1));
      const end = new Date(Date.UTC(start.getUTCFullYear(), 11, 31, 59, 59, 59));

      await this.getAllDatabaseInfo(data.teamid, data.siteid, data.companyid, start, end);
      
      while (start.getTime() < end.getTime()) {
        this.addMonth(workbook, start);
        start = new Date(Date.UTC(start.getFullYear(), start.getMonth() + 1, 1));
      }

      const sheet = workbook.getWorksheet('Sheet1');
      if (sheet) {
        workbook.removeWorksheet(sheet.id);
      }
    } catch (error) {
      console.log(error);
    }

    return workbook;
  }
    
    /**
     * This method will control all pulling of the database information in a more or less
     * synchronized way, based on team, site, company, and a start and end dates.  It will
     * throw an error if the team and site identifier is not provided.
     * @param teamid The string value (or undefined) for the team identifer. 
     * @param siteid The string value (or undefined) for the site identifier.
     * @param companyid The string value (or undefined) for any associated company identifier.
     * @param start The date object for the start of the report period.
     * @param end The date object for the end of the report period.
     */
    async getAllDatabaseInfo(teamid: string | undefined, siteid: string | undefined, 
      companyid: string | undefined, start: Date, end: Date): Promise<void> {
      try {
        if (teamid && teamid !== '' && siteid && siteid !== '') {
          const team = await this.getTeam(teamid, siteid, companyid);
          const employees = await this.getEmployees(teamid, siteid, start, end);
          this.employees = employees;
          const employeeWorkPromises = 
            this.employees.map(async (emp, e) => {
              const work = await this.getEmployeeWork(emp.id, start.getFullYear(), 
                end.getFullYear());
              emp.work = work;
              this.employees[e] = emp;
            });
          await Promise.allSettled(employeeWorkPromises);
        } else {
          throw new Error('TeamID or SiteID empty');
        }
      } catch (error) {
        console.log(error)
      }
    }
  
    /**
     * This method will provide team and site information while filling in the team's
     * workcodes and an associated company's holidays.
     * @param teamid The string value for the team identifier.
     * @param siteid The string value for the site assocated with the team
     * @param companyid (Optional) a string value for the associated company
     * @returns Nothing, but only returns after all values are placed in their respective
     * class members.
     */
    async getTeam(teamid: string, siteid: string, companyid?: string): Promise<void> {
      try {
        const teamQuery = { _id: new ObjectId(teamid) };
        const iteam = await collections.teams!.findOne<ITeam>(teamQuery);
        if (iteam) {
          const team = new Team(iteam);
          team.workcodes.forEach(wc => {
            this.workcodes.set(wc.id, new Workcode(wc));
          });
          if (companyid && companyid !== '') {
            team.companies.forEach(co => {
              if (co.id.toLowerCase() === companyid.toLowerCase()) {
                co.holidays.forEach(hol => {
                  this.holidays.push(new Holiday(hol));
                });
                this.holidays.sort((a,b) => a.compareTo(b));
              }
            });
          }
          team.sites.forEach(s => {
            if (s.id.toLowerCase() === siteid.toLowerCase()) {
              this.site = new Site(s);
            }
          });
          return;
        } else {
          throw new Error('no team for id')
        }
      } catch (error) {
        throw error;
      }
    }
  
    async getEmployees(team: string, site: string, start: Date, end: Date): Promise<Employee[]> {
      const employees: Employee[] = [];
      if (collections.employees) {
        const empQuery = { team: new ObjectId(team), site: site };
        const empCursor = await collections.employees.find<IEmployee>(empQuery);
        const result = await empCursor.toArray();
        result.forEach(async(iEmp) => {
          employees.push(new Employee(iEmp));
        });
        employees.sort((a,b) => a.compareTo(b));
      }
      return employees;
    }
  
    /**
     * This function will pull the requested employee's work records from the database to
     * provide a single array.
     * @param empid The string value for the employee for the work records to be pulled
     * @param start The numeric value for the starting year for the pull query
     * @param end The number value for the ending year for the pull query
     * @returns An array of work objects to signify the work accompllished by charge number
     * within the start and end years.
     */
    async getEmployeeWork(empid: string, start: number, end: number): Promise<Work[]> {
      const work: Work[] = [];
      if (collections.work) {
        const empID = new ObjectId(empid);
        const workQuery = { 
          employeeID: empID,
          year: { $gte: start, $lte: end }
        };
        const workCursor = collections.work.find<IWorkRecord>(workQuery);
        const workResult = await workCursor.toArray();
        try {
          workResult.forEach(wr => {
            const wRecord = new WorkRecord(wr);
            wRecord.work.forEach(wk => {
              work.push(new Work(wk));
            });
          });
        } catch (error) {
          throw error;
        }
        work.sort((a,b) => a.compareTo(b));
      }
      return work;
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

  addMonth(workbook: Workbook, start: Date, ): void {
    const startDate = new Date(Date.UTC(start.getFullYear(), start.getMonth(), 1));
    const endDate = new Date(Date.UTC(start.getFullYear(), start.getMonth() + 1, 1));
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct',
      'Nov', 'Dec' ];
    const weekdays = [ 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa' ];

    const sheetLabel = `${months[startDate.getMonth()]}`
      + `${startDate.getFullYear().toString().substring(2)}`;
    const employees: Employee[] = [];
    this.employees.forEach(iEmp => {
      const emp = new Employee(iEmp);
      if (emp.atSite(this.site.id, startDate, endDate)) {
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