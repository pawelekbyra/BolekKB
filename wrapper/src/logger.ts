export class Logger {
  constructor(private level: 'debug' | 'info' | 'warn' | 'error' = 'info') {}

  private formatLog(level: string, message: string, meta?: Record<string, any>) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(meta && { meta })
    })
  }

  debug(message: string, meta?: Record<string, any>) {
    if (this.level === 'debug') {
      console.log(this.formatLog('DEBUG', message, meta))
    }
  }

  info(message: string, meta?: Record<string, any>) {
    console.log(this.formatLog('INFO', message, meta))
  }

  warn(message: string, meta?: Record<string, any>) {
    console.warn(this.formatLog('WARN', message, meta))
  }

  error(message: string, meta?: Record<string, any>) {
    console.error(this.formatLog('ERROR', message, meta))
  }
}
