import { Request, Response, Router } from "express";
import { Collection, ObjectId } from "mongodb";
import { collections } from "../config/mongoconnect";
import { IUser, User } from 'scheduler-node-models/users';
import { Logger, ReportRequest } from "scheduler-node-models/general";
import { ITeam, Team } from 'scheduler-node-models/scheduler/teams';
import { auth } from '../middleware/authorization.middleware';
import { Site } from "scheduler-node-models/scheduler/sites";
import { Company, Holiday } from "scheduler-node-models/scheduler/teams/company";
import { Workcode } from "scheduler-node-models/scheduler/labor";
import { Employee, IEmployee, IWorkRecord, Work, WorkRecord } from "scheduler-node-models/scheduler/employees";
import { ChargeStatusReport, EnterpriseSchedule, LeaveReport, ScheduleReport } from "../reports/scheduler";
import { Workbook } from "exceljs";

const router = Router();
const logger = new Logger(
  `${process.env.LOG_DIR}/authenticate/process_${(new Date().toDateString())}.log`);

router.post('/report', async(req: Request, res: Response) => {
  // there are two general types of reports, metrics and scheduler.  Metrics reports can 
  // distinguished by containing 'summary' in the report type.  all others are scheduler
  // type
  try {
    let workbook: Workbook | undefined = undefined;
    let downloadName = '';
    let contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const data = req.body as ReportRequest;
    // all excel report need the requesting user to be identified, if possible
    let user = new User();
    const id = (req as any).user;
    const userQuery = { _id: new ObjectId(id as string)};
    if (collections.users) {
      const iUser = await collections.users.findOne<IUser>(userQuery);
      if (iUser) {
        user = new User(iUser);
      }
    }
    if (data.reportType.toLowerCase().indexOf('summary') >= 0) {
      switch (data.reportType.toLowerCase()) {
        case "mission summary":
        case "draw summary":
        default:
          throw new Error(`Unknown report type: ${data.reportType}`);
      }
    } else {
      // all scheduler reports will use team, site, employees, workcodes, and holidays
      let site = new Site();
      let company = new Company();
      const holidays: Holiday[] = [];
      const workcodes: Workcode[] = [];
      const employees: Employee[] = [];
      let start = new Date();
      let end = new Date();
      if (data.startDate) {
        start = new Date(data.startDate);
      }
      if (data.endDate) {
        end = new Date(data.endDate);
      } else {
        end = new Date(start);
      }

      if (data.teamid && data.teamid !== '' && collections.teams) {
        const oTeamID = new ObjectId(data.teamid);
        const teamQuery = { _id: oTeamID };
        const iTeam = await collections.teams.findOne<ITeam>(teamQuery);
        if (iTeam) {
          const team = new Team(iTeam);
          team.workcodes.forEach(wc => {
            workcodes.push(new Workcode(wc));
          });
          workcodes.sort((a,b) => a.compareTo(b));
          if (data.companyid && data.companyid !== '') {
            team.companies.forEach(co => {
              if (data.companyid?.toLowerCase() === co.id.toLowerCase()) {
                company = new Company(co);
                if (co.holidays.length > 0) {
                  co.holidays.forEach(hol => {
                    holidays.push(new Holiday(hol));
                  });
                  holidays.sort((a,b) => a.compareTo(b));
                }
              }
            });
          }
          if (data.siteid && data.siteid !== '') {
            await team.sites.forEach(async(s) => {
              if (s.id.toLowerCase() === data.siteid?.toLowerCase()) {
                site = new Site(s);
                if (collections.employees) {
                  const empQuery = {team: new ObjectId(data.teamid), site: data.siteid };
                  const empCursor = await collections.employees.find<IEmployee>({});
                  let results = await empCursor.toArray();
                  results.forEach(async(iEmp) => {
                    const emp = new Employee(iEmp);
                    emp.work = [];
                    const startYear = start.getFullYear() - 1;
                    const endYear = end.getFullYear() + 1;
                    if (collections.work) {
                      const workQuery = { 
                        employeeID: new ObjectId(emp.id),
                        year: { $gte: startYear, $lte: endYear }
                      };
                      const workCursor = await collections.work.find<IWorkRecord>(workQuery);
                      const workResult = await workCursor.toArray();
                      workResult.forEach(wr => {
                        const wRecord = new WorkRecord(wr);
                        wRecord.work.forEach(wk => {
                          emp.work!.push(new Work(wk));
                        });
                      });
                      emp.work!.sort((a,b) => a.compareTo(b));
                    }
                    employees.push(emp);
                  });
                  employees.sort((a,b) => a.compareTo(b));
                }
              }
            });
          }
        }
      }
      console.log(employees.length);

      // now produce the workbooks or zip files from the data provided
      switch (data.reportType.toLowerCase()) {
        case "siteschedule":
        case "schedule":
          if (start.getTime() === end.getTime()) {
            // this would indicate a yearly schedule so change the start and end dates
            start = new Date(Date.UTC(start.getFullYear(), 0, 1));
            end = new Date(Date.UTC(start.getFullYear(), 11, 31, 23, 59, 59, 9999));
          } else {
            // this would indicate a two month schedule
            start = new Date(Date.UTC(start.getFullYear(), start.getMonth(), 1));
            end = new Date(Date.UTC(start.getFullYear(), start.getMonth() + 1, 1));
          }
          const schReport = new ScheduleReport(workcodes, site);
          workbook = schReport.create(user, employees, start, end);
          downloadName = `schedule-${site.id}-${start.toDateString()}.xlsx`;
          break;
        case "ptoholiday":
          // a PTO/Holiday (Leave) report is an annual report based on start date
          const ptoReport = new LeaveReport(holidays, workcodes);
          workbook = ptoReport.create(user, employees, site.id, company.id, start);
          downloadName = `leave-${site.id}-${company.id}-${start.toDateString()}.xlsx`;
          break;
        case "chargenumber":
          // this report uses the start date provided to determine the site contracts
          // and their respective charge numbers.
          const chgNoReport = new ChargeStatusReport(site, workcodes);
          workbook = chgNoReport.create(user, employees, company.id, start);
          downloadName = `chargeNumber-${site.id}-${company.id}-${start.toDateString()}.xlsx`;
          break;
        case "modtime":
          break;
        case "cofs":
          break;
        case "midshift":
          break;
        case "enterprise":
          // the enterprise schedule is different than a regular schedule because it's 
          // used fill the site's input to the MSPFinder.
          const entReport = new EnterpriseSchedule(workcodes);
          workbook = entReport.create(user, start.getFullYear(), site.id, employees);
          downloadName = `enterprise-${site.id}-${start.toDateString()}.xlsx`;
          break;
        default:
          throw new Error(`Unknown report type: ${data.reportType}`);
      }
    }
    if (workbook) {
      const buffer = await workbook.xlsx.writeBuffer();
      res.set({
        'Content-Description': 'File Transfer',
        'Content-Disposition': `attachment; filename=${downloadName}`,
        'Content-Type': contentType
      });
      res.status(200).send(buffer);
    } else {
      throw new Error(`No Report created: ${data.reportType}`);
    }
  } catch (err) {
    const error = err as Error;
    res.status(400).json({'message': error.message});
  }
});

export default router;