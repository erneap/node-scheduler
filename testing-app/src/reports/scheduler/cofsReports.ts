import AdmZip from "adm-zip";
import { ObjectId } from "mongodb";
import { ReportRequest } from "scheduler-node-models/general";
import { Employee, IEmployee, IWorkRecord, Work, WorkRecord } from "scheduler-node-models/scheduler/employees";
import { Workcode } from "scheduler-node-models/scheduler/labor";
import { ISite, Site } from "scheduler-node-models/scheduler/sites";
import { Holiday } from "scheduler-node-models/scheduler/teams/company";
import { collections } from "../../config/mongoconnect";
import { ITeam, Team } from "scheduler-node-models/scheduler/teams";

/**
 * This report formatter will be used by the application to compile the site's Certificate
 * of service reports into a single zip file to be passed/downloaded for use.
 */
export class CofSReports {
  private site: Site = new Site();
  private workcodes: Map<string, Workcode> = new Map<string, Workcode>();
  private holidays: Holiday[] = [];
  private employees: Employee[] = [];

  async create(data: ReportRequest): Promise<AdmZip> {
    const zip = new AdmZip();
    let start = new Date();
    if (data.startDate) {
      start = new Date(data.startDate);
    }
    const startDate = new Date(Date.UTC(start.getFullYear(), start.getMonth(), 1));
    const endDate = new Date(Date.UTC(start.getFullYear(), start.getMonth() + 1, 1));
    
    try {
      console.log(`${startDate}|${endDate}`);
      await this.getAllDatabaseInfo(data.teamid, data.siteid, data.companyid, startDate,
        endDate);

      const cofsPromises = 
        this.site.cofs.map( async cofs => {
        if (cofs.use(startDate, endDate)) {
          const file = cofs.create(startDate, endDate, this.workcodes, this.employees);
          await zip.addFile(file.name, Buffer.from(await file.arrayBuffer()))
        }
      });
      await Promise.allSettled(cofsPromises);
    } catch (error) {
      console.log(error);
    }
    return zip;
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
}