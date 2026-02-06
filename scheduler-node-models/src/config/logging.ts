import { Logger } from '../general';

export const logConnection: {
  log?: Logger,
  employeeLog?: Logger,
  siteLog?: Logger,
  teamLog?: Logger
} = {}

export async function createLogs(application: string) {
  logConnection.log = new Logger(
  `${process.env.LOG_DIR}/${application}/process_${(new Date().toDateString())}.log`);
  logConnection.employeeLog = new Logger(
  `${process.env.LOG_DIR}/${application}/employee_${(new Date().toDateString())}.log`);
  logConnection.siteLog = new Logger(
  `${process.env.LOG_DIR}/${application}/site_${(new Date().toDateString())}.log`);
  logConnection.teamLog = new Logger(
  `${process.env.LOG_DIR}/${application}/team_${(new Date().toDateString())}.log`);
}