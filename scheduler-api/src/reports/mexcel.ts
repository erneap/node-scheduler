import { Alignment, Borders, Fill, Font, Style, Workbook, Worksheet } from "exceljs";
import { Report } from "scheduler-node-models/general";
import { ITeam, Team } from "scheduler-node-models/scheduler/teams";
import { User } from "scheduler-node-models/users";
import { collections } from "../config/mongoconnect";
import { ObjectId } from "mongodb";
import { Employee, IEmployee, IWorkRecord, Work, WorkRecord } from "scheduler-node-models/scheduler/employees";

export class ManualExcelReport extends Report {
  private fonts: Map<string, Partial<Font>>;
  private fills: Map<string, Fill>;
  private borders: Map<string, Partial<Borders>>;
  private alignments: Map<string, Partial<Alignment>>;
  public teamID: string;
  private team: Team = new Team();
  public siteID: string;
  public companyID: string;
  private employees: Employee[] = [];
  
  constructor() {
    super();
    this.fonts = new Map<string, Partial<Font>>();
    this.fills = new Map<string, Fill>();
    this.borders = new Map<string, Partial<Borders>>();
    this.alignments = new Map<string, Partial<Alignment>>();
    this.teamID = '';
    this.siteID = '';
    this.companyID = '';
  }

  async create(user: User, date: Date, team: string, site: string, company: string): 
    Promise<Workbook> {
    const workbook = new Workbook();
    workbook.creator = user.getFullName();
    workbook.created = new Date();
    this.teamID = team;
    this.siteID = site;
    this.companyID = company;
    try {
      this.createStyles();
      let start = new Date(Date.UTC(date.getFullYear(), date.getMonth(), 1));
      let end = new Date(Date.UTC(date.getFullYear(), date.getMonth() + 1, 1) - 1000);

      await this.getAllDatabaseInfo(this.teamID, this.siteID, this.companyID, start, end);


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
      if (this.teamID !== '' && this.siteID !== '' && this.companyID !== '') {
        await this.getTeam(this.teamID);
        const employees = await this.getEmployees(this.teamID, this.siteID, 
          this.companyID, start, end);
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
  async getTeam(teamid: string): Promise<void> {
    try {
      const teamQuery = { _id: new ObjectId(teamid) };
      const iteam = await collections.teams!.findOne<ITeam>(teamQuery);
      if (iteam) {
        this.team = new Team(iteam);
        return;
      } else {
        throw new Error('no team for id')
      }
    } catch (error) {
      throw error;
    }
  }

  async getEmployees(team: string, site: string, company: string, start: Date, end: Date): Promise<Employee[]> {
    const employees: Employee[] = [];
    if (collections.employees) {
      const empQuery = { team: new ObjectId(team), site: site };
      const empCursor = await collections.employees.find<IEmployee>(empQuery);
      const result = await empCursor.toArray();
      result.forEach(async(iEmp) => {
        const emp = new Employee(iEmp);
        if (emp.companyinfo.company.toLowerCase() === company.toLowerCase()) {
          employees.push(emp);
        }
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
    this.fonts.set("bold12", {bold: true, size: 12, color: { argb: 'ff000000'}});
    this.fonts.set("bold8", {bold: true, size: 8, color: { argb: 'ff000000'}});
    this.fonts.set("nobold8", {bold: false, size: 8, color: { argb: 'ff000000'}});

    // set fills
    this.fills.set('gray', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ffd9d9d9'}});
    this.fills.set('white', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ffffffff'}});
    this.fills.set('yellow', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ffffff00'}});
    
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

  createWorksheet(workbook: Workbook, date: Date) {
    const sheet = workbook.getWorksheet('Sheet1');
    if (sheet) {
      // set the column widths
      sheet.getColumn(1).width = 17;
      sheet.getColumn(2).width = 8;
      sheet.getColumn(34).width = 8;
      for (let c=3; c < 34; c++) {
        sheet.getColumn(c).width = 2.67;
      }

      // set header with company name and month/year
      let style: Partial<Style> = {
        border: this.borders.get('blackthin'),
        fill: this.fills.get('white'),
        font: this.fonts.get('bold12'),
        alignment: this.alignments.get('center')
      };

      this.setCell(sheet, 'B1', 'B2', style, 'Company:');
      style.fill = this.fills.get('yellow');
      this.setCell(sheet, 'D1', 'L1', style, this.companyID.toUpperCase());

      style.fill = this.fills.get('white');
      this.setCell(sheet, 'U1', 'X1', style, 'Month:');

      const dateFormater = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        year: 'numeric'
      });
      style.fill = this.fills.get('yellow');
      this.setCell(sheet, 'Y1', 'AG1', style, dateFormater.format(date));

      // now headers to the data matrix
      style = {
        border: this.borders.get('blackthin'),
        fill: this.fills.get('gray'),
        font: this.fonts.get('bold8'),
        alignment: this.alignments.get('center')
      };
      this.setCell(sheet, 'A2', 'A2', style, 'Name');
      this.setCell(sheet, 'B2', 'B2', style, 'Position');
      for (let c=1; c <= 31; c++) {
        const cellID = this.getCellID(2+c, 2);
        this.setCell(sheet, cellID, cellID, style, `${c}`);
      }
      this.setCell(sheet, 'AH2', 'AH2', style, 'Total Hours');

      // add rows for the employees, plus 2 more rows for additional personal
      this.employees.sort((a,b) => a.compareTo(b));
      this.employees.forEach((emp, e) => {
        const row = e + 3;
        style.font = this.fonts.get('nobold8');
        style.fill = this.fills.get('yellow');
        // name info in first column
        this.setCell(sheet, this.getCellID(1, row), this.getCellID(1, row), style, 
          emp.name.getLastFirst());
        this.setCell(sheet, this.getCellID(2, row), this.getCellID(2, row), style, 'SA');
        for (let c=1; c <= 31; c++) {
          const cellID = this.getCellID(2+c, row);
          this.setCell(sheet, cellID, cellID, style, '');
          // this sets an excel conditional formatting relationship for if the resultant
          // value is equal to zero (0), changes fill color and displays a dash.
          sheet.addConditionalFormatting({
            ref: `${cellID}:${cellID}`,
            rules: [
              {
                type: 'cellIs',
                priority: 1,
                operator: 'greaterThan',
                formulae: [12],
                style: {
                  fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: `ffffb5b5`}},
                  font: { bold: false, size: 8, color: { argb: `ff000000`}},
                  alignment: {horizontal: 'center', vertical: 'middle', wrapText: true }
                }
              }
            ]
          });
        }
      });

    } else {
      throw new Error("Can't find worksheet");
    }
  }
}