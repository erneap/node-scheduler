import dotenv from 'dotenv';
import { Logger } from 'scheduler-node-models/general';
import app from './app';

dotenv.config();

const logger = new Logger(
  `${process.env.LOG_DIR}/authenticate/process_${(new Date().toDateString())}.log`);
const PORT = process.env.PORT || 7005;
app.listen(PORT, () => {
  logger.log(`Server is running on port ${PORT}`);
});