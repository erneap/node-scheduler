import { Request, Response, Router } from "express";
import { ObjectId } from "mongodb";
import { IUser, User } from "scheduler-models/users";
import { auth } from '../middleware/authorization.middleware';
import { ManualExcelReport } from "../reports/mexcel";
import multer from 'multer';
import { Site } from "scheduler-models/scheduler/sites";
import { ExcelRowPeriod } 
  from 'scheduler-models/scheduler/ingest'
import { Employee, IEmployee, IWorkRecord, Leave, Work, WorkRecord } 
  from "scheduler-models/scheduler/employees";
import { PoolConnection } from "mariadb/*";
import { BuildInitial, collections, EmployeeService,  
  mdbConnection, postLogEntry, TeamService, UserService } from "scheduler-services";
import { Workcode } from "scheduler-models/scheduler/labor";
import { Team } from "scheduler-models/scheduler/teams";
import { ScheduleDay, ScheduleEmployee } from "scheduler-models/scheduler/sites/schedule";
import { SAPIngest } from "../ingest/sapIngest";
import { ExcelRowIngest } from "../ingest/excelRowIngest";

const router = Router();
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    const temp = (process.env.TEMP_STORAGE) ? process.env.TEMP_STORAGE 
      : '/Users/antonerne/temp';
    cb(null, temp);
  },
  filename: function(req,file,cb) {
    cb(null, file.originalname);
  }
});
const upload = multer({storage: storage });

/**
 * This function will provide a list of actual work and leaves for site/company within
 * a team:
 * STEPS:
 * 1) Get the user, plus team, site, company identifiers and the date for the first of 
 * the month.
 * 2) Get the team and site information, with its included employee lists
 * 3) Check list of site employees and compile for the month.  Each individual day will
 * be if a person had recorded work, or leave only.
 * 4) Pass the compiled list to the requestor.
 */
router.get('/ingest/:team/:site/:company/:date', auth, async(req: Request, res: Response) => {
  try {
    let userid = '';
    if ((req as any).user) {
      userid = (req as any).user;
    }
    const teamid = req.params.team as string;
    const siteid = req.params.site as string;
    const companyid = req.params.company as string;
    const sDate = req.params.date as string;
    if (userid !== '' && teamid && siteid && companyid && sDate) {
      const date = new Date(Date.parse(sDate));
      const employees = await getIngestEmployees(userid, teamid, siteid, 
        companyid, date);
      res.status(200).json(employees);
    } else {
      throw new Error('creation data missing');
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('site', `ingest: Get: Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});

/**
 * The asynchronous function will compile the list of employees for a site/company for
 * a set period of time (month).
 * @param userid The identifier for the user making the request.  This is to ensure he/she
 * can only view their site's information
 * @param teamid The string identifier for the team.
 * @param siteid The string identifier for the site.
 * @param company The string identifier for the company.
 * @param date The date object for the beginning of the month to pull.
 * @returns A list of ScheduleEmployee objects with the day information.
 */
async function getIngestEmployees(userid: string, teamid: string, siteid: string, 
  company: string, date: Date): Promise<ScheduleEmployee[]> {
  const employees: ScheduleEmployee[] = [];
  const start = new Date(Number(date));
  const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
  const build = new BuildInitial(userid);
  const initial = await build.build();
  const workcodes = new Map<string, Workcode>();
  if (initial.team) {
    const team = new Team(initial.team);
    team.workcodes.forEach(wc => {
      workcodes.set(wc.id, wc);
    });
  }
  let count = 0;
  if (initial.site) {
    const site = new Site(initial.site);

    if (site.employees) {
      site.employees.sort((a,b) => a.compareTo(b));
      const empPromises = site.employees.map(async(iEmp) => {
        if (iEmp.atSite(site.id, start, end)) {
          if (iEmp.companyinfo.company.toLowerCase() === company.toLowerCase()) {
            const employee = new ScheduleEmployee();
            employee.id = count++;
            employee.name = iEmp.name.getLastFirst();
            let today = new Date(start);
            while (today.getTime() < end.getTime()) {
              const tomorrow = new Date(today.getTime() + (24 * 3600000));
              const hours = iEmp.getWorkedHours(today, today);
              const day: ScheduleDay = new ScheduleDay();
              day.date = today;
              day.id = today.getDate();
              day.hours = hours;
              day.code = '';
              if (hours <= 0) {
                const wd = iEmp.getWorkday(today);
                if (wd) {
                  const wc = workcodes.get(wd.code);
                  if (wc && wc.isLeave) {
                    day.code = wd.code;
                  }
                }
              }
              employee.days.push(day);
              today = new Date(today.getTime() + (24 * 3600000));
            }
            employees.push(employee);
          }
        }
      });
      await Promise.allSettled(empPromises);
    }
  }
  return employees;
}

/**
 * This method will be used to download a mexcel (manual excel) file so that the on-site
 * company supervisor can provide the work hours and leave codes for each day of the 
 * month, and will show the total work hours for the month.
 * Steps:
 * 1) Get the team, site and company identifiers, and month for the report as a date 
 *  object
 * 2) Create report object (mexcel) from the information
 * 3) Create excel workbook with the report object.
 * 4) Send the workbook as a download.
 */
router.get('/ingest/report/:team/:site/:company/:date', auth, async(req: Request, res: Response) => {
  try {
    const teamid = req.params.team as string;
    const siteid = req.params.site as string;
    const companyid = req.params.company as string;
    const sDate = req.params.date as string;
    if (teamid && siteid && companyid && sDate) {
      const date = new Date(Date.parse(sDate));
      const formatter = Intl.DateTimeFormat('en-US', {
        month: 'short',
        year: 'numeric'
      });
      // all excel report need the requesting user to be identified, if possible
      const userService = new UserService();
      let user = new User();
      let id = ''
      if ((req as any).user) {
        id = (req as any).user as string
      } 
      if (collections.users && id !== '') {
        user = await userService.get(id);
      }
      var report = new ManualExcelReport();
      let rptname = `${companyid.toUpperCase()}-${formatter.format(date)}.xlsx`;
      let contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const workbook = await report.create(user, date, teamid, siteid, companyid);
      const buffer = await workbook.xlsx.writeBuffer();
      res.set({
        'Content-Description': 'File Transfer',
        'Content-Disposition': `attachment; filename=${rptname}`,
        'Content-Type': contentType
      });
      res.status(200).send(buffer);
    } else {
      throw new Error('creation data missing');
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('site', `ingest: Get: Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  }
});

router.post('/ingest', upload.array('files'), async(req: Request, res: Response) => {
  let conn: PoolConnection | undefined;
  try {
    // ensure the upload file is present
    const files = req.files as Express.Multer.File[];
    if (mdbConnection.pool) {
      conn = await mdbConnection.pool.getConnection();
    }
    const empService = new EmployeeService();

    if (!files) {
      throw new Error('No files uploaded')
    }

    // if files are present, get the other data to determine the type of ingest that will
    // be performed, either SAP or manual excel ingest.  This is based on team, site, and
    // company for the ingest.  The last value gives the month and year for manual excel
    // ingest, which allows the program to set the day of the month for the column data.
    let userid = '';
    if ((req as any).user) {
      userid = (req as any).user;
    }
    if (userid === '') {
      userid = req.body.userid as string;
    }
    const teamid = req.body.team as string;
    const siteid = req.body.site as string;
    const companyid = req.body.company as string;
    const sDate = req.body.start as string;
    if (!teamid || teamid === '') {
      throw new Error('No team identifier given');
    }
    if (!siteid || siteid === '') {
      throw new Error('No site identifier given');
    }
    if (!companyid || companyid === '') {
      throw new Error('No company identifer given');
    }

    // pull the team object to determine the method used for ingest of work data.
    let ingestMethod = 'mexcel';
    let site: Site = new Site();
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear() - 1, 0, 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), 11, 31));
    const teamService = new TeamService();
    const team = await teamService.getTeam(teamid);
    if (team) {
      if (team.companies) {
        team.companies.forEach(co => {
          if (co.id.toLowerCase() === companyid.toLowerCase()) {
            ingestMethod = co.ingest;
          }
        });
      }
      if (team.sites) {
        team.sites.forEach(iSite => {
          if (iSite.id.toLowerCase() === siteid.toLowerCase()) {
            site = new Site(iSite);
          }
        })
      }
    }
    const results: ExcelRowPeriod[] = [];
    switch (ingestMethod.toLowerCase().trim()) {
      case "sap":
        const sapIngest = new SAPIngest(files, team);
        const periods = await sapIngest.Process();
        periods.forEach(period => {
          results.push(new ExcelRowPeriod(period));
        });
        break;
      case "mexcel":
        console.log(sDate);
        const excelIngest = new ExcelRowIngest(new Date(Date.parse(sDate)), files, 
          team, site, companyid);
        const prds = await excelIngest.Process();
        prds.forEach(period => {
          results.push(new ExcelRowPeriod(period));
        });
        break;
    }
    console.log(results.length);
    if (results.length > 0) {
      const employees: Employee[] = (site.employees) ? site.employees : [];
      const employeelist: ObjectId[] = [];
      employees.forEach(emp => {
        employeelist.push(new ObjectId(emp.id));
      });
      employees.sort((a,b) => a.compareTo(b));
      const updatePromises = results.map(async(period) => {
        const employeePromises = period.employees.map(async(eEmp) => {
          const ePromises = employees.map(async(emp, e) => {
            if (emp.companyinfo.employeeid === eEmp.employeeID
              || emp.companyinfo.alternateid === eEmp.employeeID
            ) {
              // remove leaves for employee for period.
              emp.removeLeaves(period.start, period.end);

              // remove work records for the employee for a period from sql database
              let sql = `DELETE FROM employeeWork WHERE employeeID = "${emp.id}" AND `
                + `dateworked >= "${period.start.getUTCFullYear()}-`
                + `${period.start.getMonth()+1}-${period.start.getDate()}" and `
                + `dateworked <= "${period.end.getUTCFullYear()}-${period.end.getUTCMonth()+1}`
                + `-${period.end.getDate()}";`;
              let result = await conn?.query(sql);
              console.log(result);

              // now add the rows (leaves and work) to either the employee record or to the
              // sql database
              const rowPromises = eEmp.rows.map(async(row) => {
                if (row.code !== '') {
                  // code field of the row indicates whether or not this is a leave type.
                  // If not empty, we assume it is work.  At this point all leaves are 
                  // recorded as actual
                  console.log(row);
                  emp.addLeave(0, row.date, row.code, 'ACTUAL', row.hours, '', 
                    row.holidayID);
                } else {
                  sql = "INSERT INTO employeeWork (employeeID, dateworked, chargenumber, "
                    + "extension, paycode, modtime, hours) VALUES (?, ?, ?, ?, ?, ?, ?);";
                  const wkVals = [emp.id, row.date, row.chargeNumber, 
                    row.extension, row.premium, row.modified, row.hours];
                  await conn?.query(sql, wkVals);
                }
              });
              await Promise.allSettled(rowPromises);
              employees[e] = emp;
            }
          });
          await Promise.allSettled(ePromises);
        });        
      });
      await Promise.allSettled(updatePromises);

      // after going through all the results, write each employee and employee work record
      // to the database.
      const employeeWritePromises = employees.map( async(emp) => {
        await empService.replace(emp);
      });
      await Promise.allSettled(employeeWritePromises);

      const rtnDate = new Date(Date.parse(sDate));
      const answer = await getIngestEmployees(userid, teamid, siteid, companyid, rtnDate);
      res.status(200).json(answer);
    }
  } catch (err) {
    const error = err as Error;
    await postLogEntry('site', `ingest: Post: Error: ${error.message}`);
    res.status(400).json({'message': error.message});
  } finally {
    if (conn) conn.release();
  }
});

export default router;