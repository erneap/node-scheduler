import dotenv from 'dotenv';
import { Logger } from 'scheduler-node-models/general';
import app from './app';

dotenv.config();

const now = new Date();
const logger = new Logger(
  `${process.env.LOG_DIR}/general/process_${now.getMonth()}-${now.getFullYear()}.log`);
const PORT = process.env.PORT || 7005;
app.listen(PORT, () => {
  logger.log(`Server is running on port ${PORT}`);
});