import 'dotenv/config';
import app from './app';
import { postMessage } from 'scheduler-node-models/config';

(async() => {

  const now = new Date();
  const PORT = process.env.PORT || 7006;
  app.listen(PORT, () => {
    postMessage('scheduler', `Server is running on port ${PORT}`);
  });
})();