import dotenv from 'dotenv';
import { Logger } from 'scheduler-node-models/general';

export const logConnection: {
  log?: Logger
} = {}

export async function createLogs(application: string) {
  while (!process.env.LOG_DIR) {
    await dotenv.config();
  }
  logConnection.log = new Logger(
  `${process.env.LOG_DIR}/${application}/process_${(new Date().toDateString())}.log`);
}