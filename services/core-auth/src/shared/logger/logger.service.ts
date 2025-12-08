import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import tracer from 'dd-trace';

@Injectable()
export class LoggerService implements NestLoggerService {
  log(message: string) {
    tracer.trace('log', () => {
      // eslint-disable-next-line no-console
      console.log(message);
    });
  }

  error(message: string, trace?: string) {
    tracer.trace('error', () => {
      // eslint-disable-next-line no-console
      console.error(message, trace);
    });
  }

  warn(message: string) {
    tracer.trace('warn', () => {
      // eslint-disable-next-line no-console
      console.warn(message);
    });
  }

  debug(message: string) {
    tracer.trace('debug', () => {
      // eslint-disable-next-line no-console
      console.debug(message);
    });
  }

  verbose(message: string) {
    tracer.trace('verbose', () => {
      // eslint-disable-next-line no-console
      console.debug(message);
    });
  }
}
