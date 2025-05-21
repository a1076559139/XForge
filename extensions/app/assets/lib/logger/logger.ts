import { DEV } from 'cc/env';

interface ILog {
    (title: string, ...args: any[]): void
}

/**
 * 日志管理类，用于统一日志输出格式
 */
export class Logger {
    static setting: {
        filter: Array<'log' | 'warn' | 'error'>
    } = {
            filter: ['error', 'log', 'warn']
        };

    /**
     * 创建日志输出函数
     */
    static create(level: 'log' | 'warn' | 'error', styleColor: string, title: string, titleColor = '#fff') {
        if (this.setting.filter.indexOf(level) == -1) {
            return;
        }

        if (DEV) {
            return window.console[level].bind(window.console,
                '%c %s %c %s ',
                `background:${styleColor}; padding: 2px; border-radius: 5px 0 0 5px; border: 1px solid ${styleColor}; color: ${titleColor}; font-weight: normal;`,
                `${title} ${new Date().toLocaleString()}`,
                `background:#ffffff ; padding: 2px; border-radius: 0 5px 5px 0; border: 1px solid ${styleColor}; color: ${styleColor}; font-weight: normal;`
            );
        }
        return window.console[level].bind(window.console,
            `${title} [${new Date().toLocaleString()}]`
        );
    }

    /**
     * 用于输出一般信息
     */
    get log() {
        return Logger.create('log', '#6495ed', '[LOG]', '#000') as ILog;
    }

    /**
     * 用于输出警告信息
     */

    get warn() {
        return Logger.create('warn', '#ff7f50', '[WARN]', '#000') as ILog;
    }

    /**
     * 用于输出错误信息
     */
    get error() {
        return Logger.create('error', '#ff4757', '[ERROR]', '#000') as ILog;
    }

    /**
     * 用于输出调试信息
     */
    get debug() {
        return Logger.create('log', '#ff6347', '[DEBUG]', '#000') as ILog;
    }

    /**
     * 用于输出成功信息
     */
    get success() {
        return Logger.create('log', '#00ae9d', '[SUCC]', '#000') as ILog;
    }
}

export default new Logger();