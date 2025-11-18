import { Report, ReportRequest } from "scheduler-node-models/general";
import { Workcode } from "scheduler-node-models/scheduler/labor";
import { Site } from "scheduler-node-models/scheduler/sites";
import { Employee, IEmployee, IWorkRecord, Work, WorkRecord } from "scheduler-node-models/scheduler/employees";
import { User } from "scheduler-node-models/users";
import { Style, Workbook, Worksheet } from "exceljs";
import { collections } from "../../config/mongoconnect";
import { ObjectId } from "mongodb";
import { ITeam, Team } from "scheduler-node-models/scheduler/teams";
import { Holiday } from "scheduler-node-models/scheduler/teams/company";

export class ScheduleReport extends Report{
  private styles: Map<string, Partial<Style>>;
  private workcodes: Map<string, Workcode>;
  private site: Site;
  private employees: Employee[];
  private holidays: Holiday[];

  constructor() {
    super();
    this.styles = new Map<string, Partial<Style>>();
    this.workcodes = new Map<string, Workcode>();
    this.employees = [];
    this.site = new Site();
    this.holidays = [];
  }
  
  async create(user: User, data: ReportRequest): Promise<Workbook> {
    const workbook = new Workbook();
    workbook.creator = user.getFullName();
    workbook.created = new Date();
    try {
      let start = new Date();
      let end = new Date();
      if (data.startDate) {
        start = new Date(data.startDate);
        start = new Date(Date.UTC(start.getFullYear(), start.getMonth(), 1));
      } else {
        if (data.reportType.toLowerCase() === 'schedule') {
          start = new Date(Date.UTC(start.getFullYear(), 0, 1));
        } else {
          start = new Date(Date.UTC(start.getFullYear(), start.getMonth(), 1));
        }
      }
      if (data.endDate) {
        end = new Date(data.endDate);
        end = new Date(Date.UTC(end.getFullYear(), end.getMonth()+1, 1)-10000);
      } else {
        if (data.reportType.toLowerCase() === 'schedule') {
          end = new Date(Date.UTC(start.getFullYear(), 11, 31, 23, 59, 59));
        } else {
          end = new Date(Date.UTC(start.getFullYear(), start.getMonth() + 3, 1)-10000);
        }
      }

      await this.getAllDatabaseInfo(data.teamid, data.siteid, start, end);
      this.createStyles();

      while (start.getTime() < end.getTime()) {
        this.addMonth(workbook, start, this.employees);
        start = new Date(Date.UTC(start.getFullYear(), start.getMonth() + 1, 1));
      }

      this.createLegendSheet(workbook);
      
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
    start: Date, end: Date): Promise<void> {
    try {
      if (teamid && teamid !== '' && siteid && siteid !== '') {
        const team = await this.getTeam(teamid, siteid);
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
    // set style
    this.workcodes.forEach((wc, key) => {
      if (wc.backcolor.toLowerCase() !== 'ffffff') {
        const style: Partial<Style> = {
          fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: `ff${wc.backcolor}`}},
          font: { bold: true, size: 11, color: { argb: `ff${wc.textcolor}`}},
          alignment: {horizontal: 'center', vertical: 'middle', wrapText: true },
          border: {
            top: { style: 'thin', color: { argb: 'ff000000'}},
            left: { style: 'thin', color: {argb: 'ff000000'}},
            bottom: { style: 'thin', color: {argb: 'ff000000'}},
            right: { style: 'thin', color: { argb: 'ff000000'}}
          }
        };
        this.styles.set(wc.id, style);
      }
    });
     let style: Partial<Style> = {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: `ffc0c0c0`}},
      font: { bold: true, size: 11, color: { argb: `ff000000`}},
      alignment: {horizontal: 'center', vertical: 'middle', wrapText: true },
      border: {
        top: { style: 'thin', color: { argb: 'ff000000'}},
        left: { style: 'thin', color: {argb: 'ff000000'}},
        bottom: { style: 'thin', color: {argb: 'ff000000'}},
        right: { style: 'thin', color: { argb: 'ff000000'}}
      }
    };
    this.styles.set('evenday', style);
    this.styles.set('oddday', {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: `ffffffff`}},
      font: { bold: true, size: 11, color: { argb: `ff000000`}},
      alignment: {horizontal: 'center', vertical: 'middle', wrapText: true },
      border: {
        top: { style: 'thin', color: { argb: 'ff000000'}},
        left: { style: 'thin', color: {argb: 'ff000000'}},
        bottom: { style: 'thin', color: {argb: 'ff000000'}},
        right: { style: 'thin', color: { argb: 'ff000000'}}
      }
    } as Partial<Style>);
    this.styles.set('evenend', {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: `ff00e6e6`}},
      font: { bold: true, size: 11, color: { argb: `ff000000`}},
      alignment: {horizontal: 'center', vertical: 'middle', wrapText: true },
      border: {
        top: { style: 'thin', color: { argb: 'ff000000'}},
        left: { style: 'thin', color: {argb: 'ff000000'}},
        bottom: { style: 'thin', color: {argb: 'ff000000'}},
        right: { style: 'thin', color: { argb: 'ff000000'}}
      }
    } as Partial<Style>);
    this.styles.set('oddend', {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: `ffccffff`}},
      font: { bold: true, size: 11, color: { argb: `ff000000`}},
      alignment: {horizontal: 'center', vertical: 'middle', wrapText: true },
      border: {
        top: { style: 'thin', color: { argb: 'ff000000'}},
        left: { style: 'thin', color: {argb: 'ff000000'}},
        bottom: { style: 'thin', color: {argb: 'ff000000'}},
        right: { style: 'thin', color: { argb: 'ff000000'}}
      }
    } as Partial<Style>);
    this.styles.set('month', {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: `ffde5d12`}},
      font: { bold: true, size: 11, color: { argb: `ff000000`}},
      alignment: {horizontal: 'center', vertical: 'middle', wrapText: true },
      border: {
        top: { style: 'thin', color: { argb: 'ff000000'}},
        left: { style: 'thin', color: {argb: 'ff000000'}},
        bottom: { style: 'thin', color: {argb: 'ff000000'}},
        right: { style: 'thin', color: { argb: 'ff000000'}}
      }
    } as Partial<Style>);
    this.styles.set('wkctr', {
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: `ff000000`}},
      font: { bold: true, size: 11, color: { argb: `ffffffff`}},
      alignment: {horizontal: 'center', vertical: 'middle', wrapText: true },
      border: {
        top: { style: 'thin', color: { argb: 'ff000000'}},
        left: { style: 'thin', color: {argb: 'ff000000'}},
        bottom: { style: 'thin', color: {argb: 'ff000000'}},
        right: { style: 'thin', color: { argb: 'ff000000'}}
      }
    } as Partial<Style>);
  }

  addMonth(workbook: Workbook, start: Date, iEmps: IEmployee[]) {
    const startDate = new Date(start);
    const endDate = new Date(Date.UTC(start.getFullYear(), start.getMonth() + 1, 1));
    const months = ['January', 'Febuary', 'March', 'April', 'May', 'June', 'July', 
      'August', 'September', 'October', 'November', 'December' ];
    const weekdays = [ 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa' ];

    // first ensure the workcenter positions and shifts are clear of employees
    this.site.workcenters.forEach(wkctr => {
      wkctr.positions?.forEach((pos, p) => {
        pos.employees = [];
        wkctr.positions![p] = pos;
      });
      wkctr.shifts?.forEach((shft, s) => {
        shft.employees = [];
        wkctr.shifts![s] = shft;
      });
    });
    iEmps.forEach(iEmp => {
      const emp = new Employee(iEmp);
      if (emp.atSite(this.site.id, startDate, endDate)) {
        let position = false;
        this.site.workcenters.forEach((wkctr, w) => {
          wkctr.positions?.forEach((pos, p) => {
            pos.assigned.forEach(asgn => {
              if (asgn === emp.id) {
                position = true;
                pos.employees?.push(emp);
              }
            });
            if (position) {
              wkctr.positions![p] = pos;
              this.site.workcenters[w] = wkctr;
            }
          });
        });
        if (!position) {
          const wd = emp.getAssignmentForPeriod(startDate, endDate);
          this.site.workcenters.forEach((wkctr, w) => {
            if (wkctr.id.toLowerCase() === wd.workcenter.toLowerCase()) {
              wkctr.shifts?.forEach((shft, s) => {
                let bShift = false;
                shft.associatedCodes.forEach(code => {
                  if (code.toLowerCase() === wd.code.toLowerCase()) {
                    bShift = true;
                  }
                });
                if (bShift) {
                  shft.employees?.push(emp);
                  wkctr.shifts![s] = shft;
                  this.site.workcenters[w] = wkctr;
                }
              });
            }
          });
        }
      }
    });
    const sheetLabel = `${months[startDate.getMonth()]}`
      + `${startDate.getFullYear().toString().substring(2)}`;

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
      }
    });
    sheet.properties.defaultRowHeight = 20;
    sheet.properties.defaultColWidth = 4;

    // set all the column widths for the month with the first column width of 17.0
    // and days of the month at 4.0
    sheet.getColumn(1).width = 17.0;
    const endofMonth = (new Date(endDate.getTime() - (24 * 3600000))).getDate();

    const now = new Date();
    let style = this.styles.get('month');
    this.setCell(sheet, this.getCellID(0,1), this.getCellID(0,1), style!, 
      months[startDate.getMonth()]);
    const formatter = new Intl.DateTimeFormat('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
    this.setCell(sheet, this.getCellID(0,2), this.getCellID(0,2), style!, 
      formatter.format(now));
    let current = new Date(startDate);
    while (current.getTime() < endDate.getTime()) {
      let styleID = 'evenday';
      if (current.getDay() === 0 || current.getDay() === 6) {
        styleID = 'evenend';
      }
      style = this.styles.get(styleID);
      let cellID = this.getCellID(current.getDate(), 1);
      this.setCell(sheet, cellID, cellID, style!, weekdays[current.getDay()]);
      cellID = this.getCellID(current.getDate(), 2);
      this.setCell(sheet, cellID, cellID, style!, current.getDate())
      current = new Date(current.getTime() + (24 * 3600000));
    }

    // now add row for workcenter header, then the employees under that workcenter
    let row = 2;
    this.site.workcenters.forEach(wkctr => {
      row++;
      style = this.styles.get('wkctr');
      this.setCell(sheet, this.getCellID(0, row), this.getCellID(endofMonth, row), 
        style!, wkctr.name)
      // sort positions, then add a row for each employee for the positions.
      if (wkctr.positions && wkctr.positions.length > 0) {
        wkctr.positions.sort((a,b) => a.compareTo(b));
        wkctr.positions.forEach(pos => {
          if (pos.employees && pos.employees.length > 0) {
            pos.employees.sort((a,b) => a.compareTo(b));
            pos.employees.forEach(emp => {
              row++;
              this.createEmployeeRow(sheet, startDate, endDate, row, emp);
            });
          }
        });
      }
      if (wkctr.shifts && wkctr.shifts.length > 0) {
        wkctr.shifts.forEach(shft => {
          if (shft.employees && shft.employees.length > 0) {
            shft.employees.sort((a,b) => a.compareTo(b));
            shft.employees.forEach(emp => {
              row++;
              this.createEmployeeRow(sheet, startDate, endDate, row, emp);
            })
          }
        })
      }
    });
  }

  createEmployeeRow(sheet: Worksheet, start: Date, end: Date, row: number, emp: Employee) {
    let styleID = 'oddday';
    if (row % 2 === 0) {
      styleID = 'evenday';
    }
    const lastWorked = emp.getLastWorkday();
    let style = this.styles.get(styleID);
    const name = `${emp.name.lastname}, ${emp.name.firstname.substring(0,1)}`;
    this.setCell(sheet, this.getCellID(0, row), this.getCellID(0, row), style!, name);
    let current = new Date(start);
    while (current.getTime() < end.getTime()) {
      let stID = styleID;
      let code = '';
      const wd = emp.getWorkday(current);
      if (wd && wd.code !== '') {
        code = wd.code.toUpperCase();
        if (this.styles.has(wd.code)) {
          stID = wd.code;
        }
      }
      if (stID === 'oddday' || stID === 'evenday') {
        if (current.getDay() === 0 || current.getDay() === 6) {
          stID = (row % 2 === 0) ? 'evenend' : 'oddend';
        }
      }
      style = this.styles.get(stID);
      const cellID = this.getCellID(current.getDate(), row);
      this.setCell(sheet, cellID, cellID, style!, code);
      current = new Date(current.getTime() + (24 * 3600000));
    }
  }

  createLegendSheet(workbook: Workbook) {
    const sheet = workbook.addWorksheet('Legend', {
      pageSetup: { 
        paperSize: undefined, 
        orientation: 'landscape',
        fitToHeight: 1,
        fitToWidth: 1,
        blackAndWhite: false,
        fitToPage: true,
        showGridLines: false
      }
    });
    sheet.getColumn(1).width = 30;
    let row = 0;
    this.workcodes.forEach(wc => {
      if (wc.backcolor.toLowerCase() !== 'ffffff') {
        row++;
        sheet.getRow(row).height = 20;
        const style = this.styles.get(wc.id);
        const cellID = this.getCellID(0, row);
        this.setCell(sheet, cellID, cellID, style!, wc.title);
      }
    })
  }
}