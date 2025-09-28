export class Logger {
  constructor(level = 'info') {
    this.level = level;
    this.levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
  }

  shouldLog(level) {
    return this.levels[level] <= this.levels[this.level];
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    return data ? `${logEntry} ${JSON.stringify(data)}` : logEntry;
  }

  error(message, data = null) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, data));
    }
  }

  warn(message, data = null) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, data));
    }
  }

  info(message, data = null) {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message, data));
    }
  }

  debug(message, data = null) {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message, data));
    }
  }
}

export default Logger;