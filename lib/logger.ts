
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LoggerConfig {
    enabled: boolean;
    level: LogLevel;
    prefix?: string;
}

class Logger {
    private config: LoggerConfig;

    constructor(config?: Partial<LoggerConfig>) {
        this.config = {
            enabled: process.env.NODE_ENV !== 'production',
            level: 'info',
            ...config,
        };
    }

    private shouldLog(level: LogLevel): boolean {
        if (!this.config.enabled) return false;

        const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
        const currentLevelIndex = levels.indexOf(this.config.level);
        const messageLevelIndex = levels.indexOf(level);

        return messageLevelIndex >= currentLevelIndex;
    }

    private formatMessage(level: LogLevel, message: string, data?: any): string {
        const timestamp = new Date().toISOString();
        const prefix = this.config.prefix ? `[${this.config.prefix}]` : '';
        const levelStr = level.toUpperCase().padEnd(5);

        let formattedMessage = `${timestamp} ${levelStr} ${prefix} ${message}`;

        if (data !== undefined) {
            formattedMessage += `\n${JSON.stringify(data, null, 2)}`;
        }

        return formattedMessage;
    }

    debug(message: string, data?: any): void {
        if (this.shouldLog('debug')) {
            console.log(this.formatMessage('debug', message, data));
        }
    }

    info(message: string, data?: any): void {
        if (this.shouldLog('info')) {
            console.log(this.formatMessage('info', message, data));
        }
    }

    warn(message: string, data?: any): void {
        if (this.shouldLog('warn')) {
            console.warn(this.formatMessage('warn', message, data));
        }
    }

    error(message: string, error?: any): void {
        if (this.shouldLog('error')) {
            const errorData = error instanceof Error
                ? { message: error.message, stack: error.stack }
                : error;
            console.error(this.formatMessage('error', message, errorData));
        }
    }

    // Create a child logger with a specific prefix
    child(prefix: string): Logger {
        return new Logger({
            ...this.config,
            prefix: this.config.prefix ? `${this.config.prefix}:${prefix}` : prefix,
        });
    }
}

// Default logger instance
export const logger = new Logger();

// Create specialized loggers for different parts of the application
export const apiLogger = logger.child('API');
export const dbLogger = logger.child('DB');
export const authLogger = logger.child('AUTH');
export const notificationLogger = logger.child('NOTIFICATION');

export default logger;
