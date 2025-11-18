import dotenv from 'dotenv';
import { collections, connectToDB } from './config/mongoconnect';
import { Collection } from 'mongodb';
import { IUser, User } from 'scheduler-node-models/users';
import { ChargeStatusReport, CofSReports, EnterpriseSchedule, LeaveReport, ScheduleReport } from './reports/scheduler';
import { ReportRequest } from 'scheduler-node-models/general';
import { DrawSummary, MissionSummary } from './reports/metrics';
import { MidShiftReport } from './reports/scheduler/midShiftReport';
import { Workcenter } from 'scheduler-node-models/scheduler/sites/workcenters/workcenter';

dotenv.config();

const main = async() => {
  await connectToDB();

  const userCol: Collection | undefined = collections.users;

  try {
    if (userCol) {
      const userquery = { emailAddress: 'ernea5956@gmail.com'};
      const result = await userCol.findOne<IUser>(userquery);

      let user: User | undefined = undefined;
      if (result) {
        user = new User(result);
      }
      
      if (user) {
      const data = { 
          reportType: 'midshift',
          teamid: '64dad6b14952737d1eb2193f',
          siteid: 'dgsc',
          companyid: 'rtx',
          startDate: '11/7/2025',
          endDate: '11/13/2025',
          includeDaily: true
        } as ReportRequest;
      var report;
      let rptname = '';
      switch (data.reportType.toLowerCase()) {
        case "siteschedule":
        case "schedule":
          report = new ScheduleReport();
          rptname = 'schedule';
          break;
        case "leave":
        case "ptoholiday":
          report = new LeaveReport();
          rptname = 'leaves';
          break;
        case "enterprise":
          report = new EnterpriseSchedule();
          rptname = 'enterprise';
          break;
        case "chargenumber":
          report = new ChargeStatusReport();
          rptname = 'chargenumbers';
          break;
        case "cofs":
          const cofs = new CofSReports();
          const output = await cofs.create(data);
          const outputfile = '/Users/antonerne/Downloads/cofs.zip';
          output.writeZip(outputfile);
          break;
        case "msnsummary":
        case "mission summary":
          report = new MissionSummary();
          rptname = 'msnsummary';
          break;
        case "draw":
        case "drawsummary":
        case "draw summary":
          report = new DrawSummary();
          rptname = 'drawsummary';
          break;
        case "mids":
        case "midshift":
          report = new MidShiftReport();
          rptname = 'midshifts';
          break;
      }
      if (report) {
        const workbook = await report.create(user, data);
          if (workbook) {
            try {
              const filename = `/Users/antonerne/Downloads/${rptname}.xlsx`;
              await workbook.xlsx.writeFile(filename);
            } catch (error) {
              console.log(error);
            }
          }
        }
      }
    }

  } catch (error) {
    console.log(error);
  }
  process.exit(0);
}

main();