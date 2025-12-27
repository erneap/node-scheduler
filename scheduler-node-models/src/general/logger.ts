import * as fs from 'fs';

export class Logger {
  private buffer: string[] = [];
  private interval: NodeJS.Timeout;

  constructor(private logFile: string, private flushInterval: number = 100) {
    this.interval = setInterval(() => this.flush(), flushInterval);
  }

  log(message: string): void {
    const now = new Date();
    this.buffer.push(`${now.getTime()}\t${message}`);
  }

  private flush(): void {
    this.logFile = this.logFile.replaceAll(' ', '_');
    this.createDirIfNotExists(this.logFile)
    if (this.buffer.length > 0) {
      const logLines = this.buffer.join('\n') + '\n';
      try {
        const tf = fs.open(this.logFile, (err) => {
          if (err) {
            const dirIndex = this.logFile.lastIndexOf('/');
            const logDir = this.logFile.substring(0, dirIndex);
            fs.mkdir(logDir, { recursive: true, }, (err) => {
              if (err) {
                console.log(err);
              }
            })
          }
        });
      } catch {
        const dirIndex = this.logFile.lastIndexOf('/');
        const logDir = this.logFile.substring(0, dirIndex);
        fs.mkdir(logDir, { recursive: true }, (err) => {
          if (err) {
            console.log(err);
          }
        });
      }
      fs.appendFile(this.logFile, logLines, (err) => {
        if (err) {
          console.error(`Error writing to log file: ${err}`);
        }
      });
      this.buffer = [];
    }
  }

  stop(): void {
    clearInterval(this.interval);
    this.flush();
  }

  createDirIfNotExists(directoryPath: string): void {
    if (directoryPath.endsWith('.log')) {
      const index = directoryPath.lastIndexOf('/');
      directoryPath = directoryPath.substring(0, index);
    }
    if (!fs.existsSync(directoryPath)) {
      fs.mkdirSync(directoryPath, { recursive: true });
    }
  }
}