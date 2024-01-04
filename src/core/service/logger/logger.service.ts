import { Injectable, Logger, Scope } from '@nestjs/common';
import * as fs from 'fs';
import * as moment from 'moment';
import * as path from 'path';
import { createLogger, format, transports } from 'winston';
import 'winston-daily-rotate-file';

@Injectable({ scope: Scope.TRANSIENT })
export class LoggerService extends Logger {
  private readonly logger;
  private logsDirPath: string;

  private ensureLogsDirectoryExists() {
    if (!fs.existsSync(this.logsDirPath)) {
      fs.mkdirSync(this.logsDirPath);
      console.log('Logs folder created');
    } else {
      console.log('Logs folder already exists');
    }
  }

  private ensureDateDirectoryExists() {
    const currentDate = this.getCurrentDate();
    const dateDirPath = path.join(this.logsDirPath, currentDate);

    if (!fs.existsSync(dateDirPath)) {
      fs.mkdirSync(dateDirPath);
      fs.chmodSync(dateDirPath, '775');
      console.log('Date folder created');
    } else {
      fs.chmodSync(dateDirPath, '775');
      console.log('Date folder already exists');
    }
  }

  private getCurrentDate() {
    return moment().format('YYYY-MM-DD');
  }

  private updateLogger() {
    const currentDate = this.getCurrentDate();
    const dateDirPath = path.join(this.logsDirPath, currentDate);
    this.ensureLogsDirectoryExists();
    this.ensureDateDirectoryExists();

    const customFormat = format.printf(
      ({ level, message, label, timestamp, data }) => {
        return `${timestamp} [${label}] ${level}: ${message} ===> ${data}`;
      }
    );

    const errorTransport = new transports.DailyRotateFile({
      level: 'error',
      dirname: dateDirPath,
      filename: path.join(dateDirPath, 'error.log'),
      format: format.combine(
        format.label({ label: 'MY EBENFIT' }),
        format.timestamp(),
        customFormat
      ),
      zippedArchive: false,
      maxFiles: '30d'
    });

    const infoTransport = new transports.DailyRotateFile({
      level: 'info',
      dirname: dateDirPath,
      filename: path.join(dateDirPath, 'info.log'),
      format: format.combine(
        format.label({ label: 'MY EBENFIT' }),
        format.timestamp(),
        customFormat
      ),
      zippedArchive: false,
      maxFiles: '30d'
    });

    this.logger.clear();
    this.logger.add(errorTransport);
    this.logger.add(infoTransport);
    this.logger.add(
      new transports.Console({
        format: format.combine(
          format.colorize(),
          format.timestamp(),
          format.printf(({ timestamp, level, message }) => {
            return `${timestamp} ${level}: ${message}`;
          })
        )
      })
    );
  }

  constructor() {
    super();

    this.logsDirPath = './logs';
    this.ensureLogsDirectoryExists();

    this.logger = createLogger({
      format: format.combine(
        format.timestamp({
          format: () =>
            moment().utcOffset('+07:00').format('YYYY-MM-DD HH:mm:ss.SSS Z')
        }),
        format.json()
      ),
      transports: []
    });

    this.updateLogger();
  }

  log(message: string, data: any) {
    super.log(message);
    this.updateLogger();
    this.logger.log({ level: 'info', message, data });
  }

  error(message: string, trace: string, data: any) {
    super.error(message, trace);
    this.updateLogger();
    this.logger.error({ level: 'error', message, trace, data });
  }
}
