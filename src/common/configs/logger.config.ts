import { createLogger, transports, format } from 'winston';

const loggerOptions = {
  transports: [
    new transports.Console(),
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: format.json(),
    }),
    new transports.File({
      filename: 'logs/combined.log',
      format: format.json(),
    }),
  ],
  format: format.combine(
    format.timestamp({
      format: process.env.DATETIME_LOGGER_FORMAT || 'DD.MM.YYYY HH:mm:ss',
    }),
    format.json(),
    format.printf((info) => {
      return `${info.timestamp} ${info.level}: ${info.message}`;
    }),
  ),
};

export default createLogger(loggerOptions);
