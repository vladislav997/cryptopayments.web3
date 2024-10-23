import { createLogger, transports, format } from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

const loggerOptions = {
  level: 'info',
  transports: [
    new transports.Console(),
    new DailyRotateFile({
      dirname: 'logs',
      filename: 'backend-error-%DATE%.log',
      datePattern: 'DD.MM.YYYY',
      level: 'error',
      format: format.combine(
        format.timestamp({
          format: process.env.DATETIME_LOGGER_FORMAT || 'DD.MM.YYYY HH:mm:ss',
        }),
        format.json(),
        format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message}`,
        ),
      ),
    }),
    new DailyRotateFile({
      dirname: 'logs',
      filename: 'backend-info-%DATE%.log',
      datePattern: 'DD.MM.YYYY',
      level: 'info',
      format: format.combine(
        format.timestamp({
          format: process.env.DATETIME_LOGGER_FORMAT || 'DD.MM.YYYY HH:mm:ss',
        }),
        format.json(),
        format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message}`,
        ),
      ),
    }),
  ],
};

export default createLogger(loggerOptions);
