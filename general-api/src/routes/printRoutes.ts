import { Request, Response, Router } from "express";
import { ObjectId } from "mongodb";
import { collections } from '../config/mongoconnect';
import { IUser, User } from 'scheduler-node-models/users';
import { Logger, ReportRequest } from "scheduler-node-models/general";
import { ChargeStatusReport, CofSReports, EnterpriseSchedule, LeaveReport, ScheduleReport } 
  from "../reports/scheduler";
import { DrawSummary, MissionSummary } from "../reports/metrics";
import { MidShiftReport } from "../reports/scheduler/midShiftReport";
import { ModTimeReport } from "../reports/scheduler/modtimeReport";

const router = Router();
const logger = new Logger(
  `${process.env.LOG_DIR}/general/process_${(new Date().toDateString())}.log`);

router.post('/report', async(req: Request, res: Response) => {
  // there are two general types of reports, metrics and scheduler.  Metrics reports can 
  // distinguished by containing 'summary' in the report type.  all others are scheduler
  // type
  try {
    var report;
    let rptname = '';
    let contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    const data = req.body as ReportRequest;
    // all excel report need the requesting user to be identified, if possible
    let user = new User();
    let id = ''
    if ((req as any).user) {
      id = (req as any).user as string
    } else if (data.userid) {
      id = data.userid;
    }
    const userQuery = { _id: new ObjectId(id)};
    if (collections.users) {
      const iUser = await collections.users.findOne<IUser>(userQuery);
      if (iUser) {
        user = new User(iUser);
      }
    }
    if (data.reportType.toLowerCase() !== '') {
      const formatter = new Intl.DateTimeFormat('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit'
      });
      const now = new Date();
      // now produce the workbooks or zip files from the data provided
      switch (data.reportType.toLowerCase()) {
        case "siteschedule":
        case "schedule":
          report = new ScheduleReport();
          rptname = `schedule-${data.siteid}-${formatter.format(now)}`;
          break;
        case "leave":
        case "ptoholiday":
          report = new LeaveReport();
          rptname = `leaves-${data.siteid}-${formatter.format(now)}`;
          break;
        case "enterprise":
          report = new EnterpriseSchedule();
          rptname = `enterprise-${data.siteid}-${formatter.format(now)}`;
          break;
        case "chargenumber":
          report = new ChargeStatusReport();
          rptname = `chargenumbers-${data.siteid}-${formatter.format(now)}`;
          break;
        case "cofs":
          const cofs = new CofSReports();
          const output = await cofs.create(data);
          rptname = `cofs-${data.siteid}-${formatter.format(now)}.zip`;
          const buffer = output.toBuffer();
          contentType = 'application/zip';
          res.set({
            'Content-Description': 'File Transfer',
            'Content-Disposition': `attachment; filename=${rptname}`,
            'Content-Type': contentType
          });
          res.status(200).send(buffer);
          return;
        case "msnsummary":
        case "mission summary":
          report = new MissionSummary();
          rptname = `msnsummary-${data.siteid}-${formatter.format(now)}`;
          break;
        case "draw":
        case "drawsummary":
        case "draw summary":
          report = new DrawSummary();
          rptname = `drawsummary-${data.siteid}-${formatter.format(now)}`;
          break;
        case "mids":
        case "midshift":
          report = new MidShiftReport();
          rptname = `midshifts-${data.siteid}-${formatter.format(now)}`;
          break;
        case "mods":
        case "modreport":
          report = new ModTimeReport();
          rptname = `modreport-${data.siteid}-${formatter.format(now)}`;
          break;
      }
    }
    if (report) {
      const workbook = await report.create(user, data);
      const buffer = await workbook.xlsx.writeBuffer();
      res.set({
        'Content-Description': 'File Transfer',
        'Content-Disposition': `attachment; filename=${rptname}`,
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