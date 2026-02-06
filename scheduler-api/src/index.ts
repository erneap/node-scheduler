import 'dotenv/config';
import app from './app';
import { logConnection } from 'scheduler-node-models/config';

(async() => {

  const now = new Date();
  const PORT = process.env.PORT || 7005;
  app.listen(PORT, () => {
    if (logConnection.log) {
      logConnection.log.log(`Server is running on port ${PORT}`);
    }
  });
})();