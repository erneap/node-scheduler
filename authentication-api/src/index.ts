import { Logger } from 'scheduler-node-models/general';
import app from './app';
import fs from 'fs';
  
(async() => {

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