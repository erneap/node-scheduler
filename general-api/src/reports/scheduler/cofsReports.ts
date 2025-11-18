import AdmZip from "adm-zip";
import { Employee, IEmployee } from "scheduler-node-models/scheduler/employees";
import { Workcode } from "scheduler-node-models/scheduler/labor";
import { ISite, Site } from "scheduler-node-models/scheduler/sites";

/**
 * This report formatter will be used by the application to compile the site's Certificate
 * of service reports into a single zip file to be passed/downloaded for use.
 */
export class CofSReports {
  create(isite: ISite, iemployees: IEmployee[], workcodes: Map<string, Workcode>, 
    start: Date): AdmZip {
    const zip = new AdmZip();
    const startDate = new Date(Date.UTC(start.getFullYear(), start.getMonth(), 1));
    const endDate = new Date(Date.UTC(start.getFullYear(), start.getMonth() + 1, 1));
    const site = new Site(isite);
    const employees: Employee[] = [];
    iemployees.forEach(iEmp => {
      const emp = new Employee(iEmp);
      if (emp.atSite(site.id, startDate, endDate)) {
        employees.push(emp);
      }
    });
    site.cofs.forEach(async (cofs) => {
      if (cofs.use(startDate, endDate)) {
        const file = cofs.create(startDate, endDate, workcodes, employees);
        await zip.addFile(file.name, Buffer.from(await file.arrayBuffer()))
      }
    })
    return zip;
  }
}