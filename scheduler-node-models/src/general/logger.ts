import * as fs from 'fs';

export class Logger {
  private buffer: string[] = [];
  private interval: NodeJS.Timeout;

  constructor(private logFile: string, private flushInterval: number = 100) {
    this.interval = setInterval(() => this.flush(), flushInterval);
  }

  log(message: string): void {
    this.buffer.push(message);
  }

  private flush(): void {
    if (this.buffer.length > 0) {
      const logLines = this.buffer.join('\n') + '\n';
      this.logFile = this.logFile.replaceAll(' ', '_');
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
}