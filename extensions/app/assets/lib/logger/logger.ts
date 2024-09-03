/**
 * 日志管理类，用于统一日志输出格式
 */

interface ILog {
    (title: string, ...args: any[]): void
}

class Logger {
    /**
     * 用于输出一般信息
     */
    get log() {
        return window.console.log.bind(window.console,
            '%c %s %c %s ',
            'background:#6495ed; padding: 2px; border-radius: 5px 0 0 5px; border: 1px solid #6495ed; color: #000; font-weight: normal;',
            `[LOG] ${new Date().toLocaleString()}`,
            'background:#ffffff ; padding: 2px; border-radius: 0 5px 5px 0; border: 1px solid #6495ed; color: #6495ed; font-weight: normal;'
        ) as ILog;
    }

    /**
     * 用于输出警告信息
     */

    get warn() {
        return window.console.warn.bind(window.console,
            '%c %s %c %s ',
            'background:#ff7f50; padding: 2px; border-radius: 5px 0 0 5px; border: 1px solid #ff7f50; color: #000; font-weight: normal;',
            `[WARN] ${new Date().toLocaleString()}`,
            'background:#ffffff ; padding: 2px; border-radius: 0 5px 5px 0; border: 1px solid #ff7f50; color: #ff7f50; font-weight: normal;'
        ) as ILog;
    }

    /**
     * 用于输出错误信息
     */
    get error() {
        return window.console.error.bind(window.console,
            '%c %s %c %s ',
            'background:#ff4757; padding: 2px; border-radius: 5px 0 0 5px; border: 1px solid #ff4757; color: #000; font-weight: normal;',
            `[ERROR] ${new Date().toLocaleString()}`,
            'background:#ffffff ; padding: 2px; border-radius: 0 5px 5px 0; border: 1px solid #ff4757; color: #ff4757; font-weight: normal;'
        ) as ILog;
    }

    /**
     * 用于输出调试信息
     */
    get debug() {
        return window.console.log.bind(window.console,
            '%c %s %c %s ',
            'background:#ff6347; padding: 2px; border-radius: 5px 0 0 5px; border: 1px solid #ff6347; color: #000; font-weight: normal;',
            `[DEBUG] ${new Date().toLocaleString()}`,
            'background:#ffffff ; padding: 2px; border-radius: 0 5px 5px 0; border: 1px solid #ff6347; color: #ff6347; font-weight: normal;'
        ) as ILog;
    }

    /**
     * 用于输出成功信息
     */
    get success() {
        return window.console.log.bind(window.console,
            '%c %s %c %s ',
            'background:#00ae9d; padding: 2px; border-radius: 5px 0 0 5px; border: 1px solid #00ae9d; color: #000; font-weight: normal;',
            `[SUCC] ${new Date().toLocaleString()}`,
            'background:#ffffff ; padding: 2px; border-radius: 0 5px 5px 0; border: 1px solid #00ae9d; color: #00ae9d; font-weight: normal;'
        ) as ILog;
    }
}

export default new Logger();