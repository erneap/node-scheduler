import { Logger } from 'scheduler-node-models/general';
import app from './app';
import dotenv from 'dotenv';
import fs from 'fs';
  
(async() => {
  await dotenv.config();

  console.log(process.env.LOG_DIR);

  const authDir = `${process.env.LOG_DIR}/authenticate`;
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir);
  }

  const logger = new Logger(
    `${process.env.LOG_DIR}/authenticate/process_${(new Date().toDateString())}.log`);
  const PORT = process.env.PORT || 7004;
  app.listen(PORT, () => {
    logger.log(`Server is running on port ${PORT}`);
  });
})();