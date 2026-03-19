import AdmZip from "adm-zip";
import { Employee, IEmployee, IWorkRecord, Work, WorkRecord } from "scheduler-models/scheduler/employees";
import { Workcode } from "scheduler-models/scheduler/labor";
import { Site } from "scheduler-models/scheduler/sites";
import { Holiday } from "scheduler-models/scheduler/teams/company";
import { BuildInitial, ReportRequest } from "scheduler-services";

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
      if (data.userid && data.companyid && data.siteid) {
        await this.getAllDatabaseInfo(data.userid, data.companyid, data.siteid);
      }

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
   * @param userid The string value (or undefined) for the requesting user identifer. 
   * @param companyid The string value (or undefined) for any associated company identifier.
   * @param siteid The string value (or undefined) for the site identifier.
   */
  async getAllDatabaseInfo(userid: string, companyid: string, siteid: string): Promise<void> {
    try {
      const builder = new BuildInitial(userid);
      const initial = await builder.build();
      if (initial.team) {
        this.workcodes = new Map<string, Workcode>();
        this.holidays = [];
        initial.team.workcodes.forEach(wc => {
          this.workcodes.set(wc.id, new Workcode(wc));
        });
        if (initial.team.companies && companyid) {
          initial.team.companies.forEach(co => {
            if (co.id.toLowerCase() === companyid?.toLowerCase()) {
              if (co.holidays) {
                co.holidays.forEach(hol => {
                  this.holidays.push(new Holiday(hol));
                });
              }
            }
          });
        }

        if (initial.site && siteid 
          && initial.site.id.toLowerCase() === siteid.toLowerCase()) {
          this.site = new Site(initial.site);
        } else {
          initial.team.sites.forEach(site => {
            if (site.id.toLowerCase() === siteid.toLowerCase()) {
              this.site = new Site(site);
            }
          });
        }

        this.employees = [];
        if (this.site.employees) {
          this.site.employees.forEach(emp => {
            this.employees.push(new Employee(emp));
          });
          this.employees.sort((a,b) => a.compareTo(b));
        }
      }
    } catch (error) {
      console.log(error)
    }
  }
}