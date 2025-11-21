import { Alignment, Borders, Fill, Font, Style, Workbook } from "exceljs";
import { Formula, Report, ReportRequest } from "scheduler-node-models/general";
import { Employee, IEmployee, IWorkRecord, Work, WorkRecord } from "scheduler-node-models/scheduler/employees";
import { User } from "scheduler-node-models/users";
import { collections } from "../../config/mongoconnect";
import { ObjectId } from "mongodb";
import { ModMonth, ModWeek } from "./modPeriods";
import { ITeam, Team } from "scheduler-node-models/scheduler/teams";

export class ModTimeReport extends Report {
  private currentAsOf: Date;
  private dateFormat: Intl.DateTimeFormat;
  private employees: Employee[];
  private periods: ModMonth[];
  private minDate: Date;
  private maxDate: Date;
  private fonts: Map<string, Partial<Font>>;
  private fills: Map<string, Fill>;
  private borders: Map<string, Partial<Borders>>;
  private alignments: Map<string, Partial<Alignment>>;
  private numformats: Map<string, string>;

  constructor() {
    super();
    this.currentAsOf = new Date();
    this.dateFormat = new Intl.DateTimeFormat('en-US', {
      day: '2-digit',
      month: 'short',
      year: '2-digit'
    });
    this.employees = [];
    this.periods = [];
    this.minDate = new Date();
    this.maxDate = new Date();
    
    this.fonts = new Map<string, Partial<Font>>();
    this.fills = new Map<string, Fill>();
    this.borders = new Map<string, Partial<Borders>>();
    this.alignments = new Map<string, Partial<Alignment>>();
    this.numformats = new Map<string, string>();
  }

  async create(user: User, data: ReportRequest): Promise<Workbook> {
    const workbook = new Workbook();
    workbook.creator = user.getFullName();
    workbook.created = new Date();

    if (data.startDate) {
      this.currentAsOf = new Date(data.startDate);
    }

    try {
      //await workbook.addWorksheet('Sheet1');

      await this.getAllDatabaseInfo(data.teamid, data.siteid, data.companyid);

      this.createStyles();

      this.createModTimeSheet(workbook);

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
  async getAllDatabaseInfo(teamid?: string, siteid?: string, 
    companyid?: string): Promise<void> {
    try {
      if (teamid && teamid !== '' && siteid && siteid !== '' && companyid) {
        await this.getModPeriods(teamid, companyid)
        await this.getEmployees(teamid, siteid);
        const employeeWorkPromises = 
          this.employees.map(async (emp, e) => {
            const work = await this.getEmployeeWork(emp.id, this.minDate.getFullYear(), 
              this.maxDate.getFullYear());
            emp.work = work;
            this.employees[e] = emp;
          });
        await Promise.allSettled(employeeWorkPromises);
      } else {
        throw new Error('TeamID, SiteID, or CompanyID empty');
      }
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * This routine will pull all the employees for a team and site.
   * @param teamid The string value for the team identifier.
   * @param siteid The string value for the site identifier.
   */
  async getEmployees(teamid?: string, siteid?: string): Promise<void> {
    if (teamid && siteid && collections.employees) {
      // pull the employees for the team and site
      this.employees = [];
      const empQuery = { team: new ObjectId(teamid), site: siteid };
      const empCursor = collections.employees.find<IEmployee>(empQuery);
      const empResults = await empCursor.toArray();
      empResults.forEach(iEmp => {
        const emp = new Employee(iEmp);
        if (emp.atSite(siteid, this.minDate, this.maxDate)) {
          this.employees.push(new Employee(emp));
        }
      });
      this.employees.sort((a,b) => a.compareTo(b));
    }
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

  /**
   * This method will pull the team record, then find the company and mod period that
   * includes the date for the report.
   * @param teamid The string value for the team identifier
   * @param companyid The string value for the team's company identifier.
   */
  async getModPeriods(teamid?: string, companyid?: string): Promise<void> {
    if (teamid && companyid) {
      // start by getting team to allow for the pulling of the mod periods
      let team: Team = new Team();
      if (collections.teams) {
        const teamQuery = { _id: new ObjectId(teamid) };
        const iTeam = await collections.teams.findOne<ITeam>(teamQuery);
        if (iTeam) {
          team = new Team(iTeam);
        } else {
          throw new Error('Team not available');
        }
      } else {
        throw new Error('No team collection');
      }
      // determine start and end dates for the total mod periods, if not avaiable throw
      // an error
      this.minDate = new Date(Date.UTC(this.currentAsOf.getFullYear(), 
        this.currentAsOf.getMonth(), this.currentAsOf.getDate()));
      this.maxDate = new Date(Date.UTC(this.currentAsOf.getFullYear(), 
        this.currentAsOf.getMonth(), this.currentAsOf.getDate()));
      let found = false;
      team.companies.forEach(co => {
        if (co.id.toLowerCase() === companyid.toLowerCase()) {
          co.modperiods.forEach(mp => {
            if (!found && mp.start.getTime() <= this.minDate.getTime() 
              && mp.end.getTime() >= this.maxDate.getTime()) {
              this.minDate = new Date(mp.start);
              this.maxDate = new Date(mp.end);
              found = true;
            }
          });
        }
      });

      if (!found) {
        throw new Error('No mod time period for company');
      }

      // create mod periods (months) based on min and max dates for fridays until
      // maxdate. 
      let start = new Date(this.minDate);
      // reset start until it is on a friday by adding one day at a time
      while (start.getDay() !== 5) {
        start = new Date(start.getTime() + (24 * 3600000));
      }

      // now create the mod periods list by adding a monthly mod period each time the 
      // date changes from the current month
      let period: ModMonth = new ModMonth({month: new Date(0), weeks: []});
      while (start.getTime() < this.maxDate.getTime()) {
        if (period.month.getTime() === 0 || period.month.getMonth() !== start.getMonth()) {
          if (period.month.getTime() !== 0) {
            this.periods.push(new ModMonth(period));
          }
          period = new ModMonth({
            month: new Date(Date.UTC(start.getFullYear(), start.getMonth(), 1)),
            weeks: []
          });
        }
        // the weekly period is a Saturday, so set the begin date, then subtract a day
        // until it's Saturday
        let begin = new Date(start);
        while (begin.getDay() !== 6) {
          begin = new Date(begin.getTime() - (24 * 3600000));
        }

        // add the weekly period to the current month
        period.weeks.push(new ModWeek({
          start: begin,
          end: start
        }));
        // add 7 days to get next possible weekly period
        start = new Date(start.getTime() + (7 * 24 * 3600000));
      }
      // if the monthly period isn't empty, add it to the periods list
      if (period.month.getTime() > 0 && period.weeks.length > 0) {
        this.periods.push(new ModMonth(period));
      }

    } else {
      throw new Error('Periods required data not provided');
    }
  }

  createStyles() {
    // set style fills
    this.fills.set('dkpink', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ffda9694'}});
    this.fills.set('pink', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ffff6565'}});
    this.fills.set('white', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ffffffff'}});
    this.fills.set('gray', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ffc0c0c0'}});
    this.fills.set('blue', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ffccf2ff'}});
    this.fills.set('dkblue', {type: 'pattern', pattern: 'solid', fgColor: {argb: 'ff80dfff'}});

    // set style fonts
    this.fonts.set("bold14", {bold: true, size: 14, color: { argb: 'ff000000'}});
    this.fonts.set("bold18", {bold: true, size: 18, color: { argb: 'ff000000'}});
    this.fonts.set("black12", {bold: false, size: 12, color: { argb: 'ff000000'}});
    this.fonts.set("white12", {bold: false, size: 12, color: { argb: 'ffffffff'}});

    // set style alignments
    this.alignments.set('center', {horizontal: 'center', vertical: 'middle', wrapText: true });
    this.alignments.set('left', {horizontal: 'left', vertical: 'middle', wrapText: true });
    this.alignments.set('right', {horizontal: 'right', vertical: 'middle', wrapText: true });

    // set style borders
    this.borders.set('thickblack', {
      top: { style: 'thick', color: { argb: 'ff000000'}},
      left: { style: 'thick', color: {argb: 'ff000000'}},
      bottom: { style: 'thick', color: {argb: 'ff000000'}},
      right: { style: 'thick', color: { argb: 'ff000000'}}
    });
    this.borders.set('thinblack', {
      top: { style: 'thin', color: { argb: 'ff000000'}},
      left: { style: 'thin', color: {argb: 'ff000000'}},
      bottom: { style: 'thin', color: {argb: 'ff000000'}},
      right: { style: 'thin', color: { argb: 'ff000000'}}
    });
    this.numformats.set('sum', '##0.0;[Red]##0.0;-;@');
  }

  createModTimeSheet(workbook: Workbook) {
    const sheet = workbook.addWorksheet('Mod Time', {
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
        outlineLevelCol: 0
      },
      views: [{
        state: 'frozen',
        xSplit: 2
      }]
    });

    // set the column widths with first two columns 20 and 9, respectively, then other
    // columns being 11 and balance column =  15.43  at end
    sheet.getColumn(1).width = 20.0;
    sheet.getColumn(2).width = 9.0;

    let columns = 1
    this.periods.forEach(prd => {
      columns++;
      sheet.getColumn(columns).width = 11.0;
      prd.weeks.forEach(wk => {
        columns++;
        sheet.getColumn(columns).width = 11.0;
      });
    });
    columns++;
    sheet.getColumn(columns).width = 15.43;

    let style: Partial<Style> = {
      fill: this.fills.get('white'),
      font: this.fonts.get('bold14'),
      border: undefined,
      alignment: this.alignments.get('left')
    };
    this.setCell(sheet, 'A1', 'A2', style, 'Name');
    this.setCell(sheet, 'B1', 'B2', style, 'Balance');

    let column = 1;
    this.periods.forEach(prd => {
      column++;
      style.font = this.fonts.get('bold18');
      style.border = this.borders.get('thickblack');
      style.alignment = this.alignments.get('center');
      this.setCell(sheet, this.getCellID(column, 1), 
        this.getCellID(column+prd.weeks.length, 1), style, prd.label());
      style.font = this.fonts.get('bold14');
      style.border = this.borders.get('thinblack');
      this.setCell(sheet, this.getCellID(column, 2), this.getCellID(column, 2), style, 
        'Month Total');
      sheet.getColumn(column+1).outlineLevel = 0;
      prd.weeks.forEach(wk => {
        column++;
        this.setCell(sheet, this.getCellID(column, 2), this.getCellID(column, 2), style, 
          wk.label());
        sheet.getColumn(column+1).outlineLevel = 1
      });
    });
    column++;
    sheet.getColumn(column+1).outlineLevel = 0;
    let row = 2;
    this.employees.forEach(emp => {
      if (emp.hasModTime(this.minDate, this.maxDate)) {
        row++;
        style = {
          fill: (row%2 === 0) ? this.fills.get('white') : this.fills.get('blue'),
          font: this.fonts.get('black12'),
          border: this.borders.get('thinblack'),
          alignment: this.alignments.get('center'),
          numFmt: this.numformats.get('sum')
        };
        this.setCell(sheet, this.getCellID(0, row), this.getCellID(0, row), style,
          emp.name.getLastFirst());
        this.setCell(sheet, this.getCellID(1, row), this.getCellID(1, row), style, 
          emp.getModTime(this.minDate, this.maxDate));
        column = 1;
        let sumlist: string[] = [];
        this.periods.forEach(prd => {
          column++;
          if (emp.hasModTime(prd.weeks[0].start, prd.weeks[prd.weeks.length - 1].end)) {
            style.fill = (row%2 === 0) ? this.fills.get('gray') : this.fills.get('dkblue');
          }
          let sForm = 'SUM(';
          if (prd.weeks.length > 1) {
            sForm += `${this.getCellID(column+1, row)}:` 
              + `${this.getCellID(column+prd.weeks.length, row)}`;
          } else {
            sForm += `${this.getCellID(column+1, row)}`;
          }
          sForm += ')';
          sumlist.push(this.getCellID(column, row));
          let formula = new Formula(sForm);
          this.setCell(sheet, this.getCellID(column, row), this.getCellID(column, row),
            style, formula);
          prd.weeks.forEach(wk => {
            column++;
            const value = emp.getModTime(wk.start, wk.end);
            if (value !== 0) {
              style.fill = (row%2 === 0) ? this.fills.get('gray') : this.fills.get('dkblue');
            } else {
              style.fill = (row%2 === 0) ? this.fills.get('white') : this.fills.get('blue');
            }
            this.setCell(sheet, this.getCellID(column, row), this.getCellID(column, row),
              style, value);
          });
        });
      }
    });
  }
}