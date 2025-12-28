import dotenv from 'dotenv';
import { Logger } from 'scheduler-node-models/general';
import app from './app';
import { logConnection } from './config/logging';

(async() => {
  dotenv.config();

  const now = new Date();
  const PORT = process.env.PORT || 7005;
  app.listen(PORT, () => {
    if (logConnection.log) {
      logConnection.log.log(`Server is running on port ${PORT}`);
    }
  });
})();