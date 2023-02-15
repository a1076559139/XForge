import { error, js, log, sys } from 'cc';

const weekOfYear = function (curDate?: Date) {
    /*
     date1是当前日期
     date2是当年第一天
     d是当前日期是今年第多少天
     用d + 当前年的第一天的周差距的和在除以7就是本年第几周
     */
    curDate = curDate || new Date();
    let a = curDate.getFullYear();
    let b = curDate.getMonth() + 1;
    let c = curDate.getDate();

    let date1 = new Date(a, b - 1, c), date2 = new Date(a, 0, 1),
        d = Math.round((date1.valueOf() - date2.valueOf()) / 86400000);
    return Math.ceil(
        (d + ((date2.getDay() + 1) - 1)) / 7
    );
};

const getWeekUpdateTime = function () {
    const date = new Date();
    const year = date.getFullYear();
    const week = weekOfYear(date);
    return year + '' + week;
};

const getDayUpdateTime = function (curDate?: Date) {
    curDate = curDate || new Date();
    return curDate.toLocaleDateString();
};

export default class storage {
    private static _cache = {};

    /**
     * 返回值为false代表调用失败
     */
    static set(key: string, value: unknown) {
        if (typeof key === 'string' && typeof value !== 'undefined') {
            try {
                let data = JSON.stringify(value);
                sys.localStorage.setItem(key, data);
                // 设置缓存
                this._cache[key] = data;
                return true;
            } catch (err) { log(err); }
        } else {
            error('_storage set error');
        }
        return false;
    }

    /**
     * 返回值为undefined代表调用失败
     */
    static get(key: string) {
        // 先读取缓存
        if (typeof this._cache[key] !== 'undefined') {
            return JSON.parse(this._cache[key]);
        }

        let result = null;
        try {
            let data = sys.localStorage.getItem(key);
            if (data && typeof data === 'string') {
                // 设置缓存
                this._cache[key] = data;
                result = JSON.parse(data);
            } else if (data !== '' && data !== null) {
                result = undefined;
            }
        } catch (e) {
            result = undefined;
        }
        return result;
    }

    /**
     * 返回值为false代表调用失败
     */
    static add(key: string, value: number = 1) {
        let result = this.get(key);
        if (result !== undefined) {
            result = result || 0;
            result += value;
            if (this.set(key, result)) {
                return result;
            }
        }
        return false;
    }

    /**
     * 返回值为false代表调用失败
     */
    static remove(key: string) {
        try {
            sys.localStorage.removeItem(key);
            delete this._cache[key];
            return true;
        } catch (err) {
            return false;
        }
    }

    /**
     * 返回值为false代表调用失败
     */
    static clear() {
        try {
            sys.localStorage.clear();
            js.clear(this._cache);
            return true;
        } catch (err) {
            return false;
        }
    }

    /**
     * 设置本周数据 [返回值为false代表调用失败]
     * @param {Function} cb 当已存在本周的数据时，会根据cb的返回决定是否存储，true代表存储
     */
    static setWeek(key: string, value: unknown, cb?: (oldValue: unknown, newValue: unknown) => boolean) {
        const updateTime = getWeekUpdateTime();

        if (cb) {
            const data = this.getWeek(key);
            if (data !== undefined) {
                if (data === null || cb(data, value)) {
                    return this.set(key, {
                        data: value,
                        updateTime: updateTime
                    });
                }
            }
        } else {
            return this.set(key, {
                data: value,
                updateTime: updateTime
            });
        }

        return false;
    }

    /**
     * 获取本周数据 [返回值为undefined代表调用失败]
     */
    static getWeek(key: string) {
        const data = this.get(key);
        if (data && data.updateTime == getWeekUpdateTime()) {
            return data.data;
        }
        return data && null;
    }

    /**
     * 设置本天数据 [返回值为false代表调用失败]
     * @param {Function} cb 当已存在本天的数据时，会根据cb的返回决定是否存储，true代表存储
     */
    static setDay(key: string, value: unknown, cb?: (oldValue: unknown, newValue: unknown) => boolean) {
        const updateTime = getDayUpdateTime();

        if (cb) {
            const data = this.getDay(key);
            if (data !== undefined) {
                if (data === null || cb(data, value)) {
                    return this.set(key, {
                        data: value,
                        updateTime: updateTime
                    });
                }
            }
        } else {
            return this.set(key, {
                data: value,
                updateTime: updateTime
            });
        }

        return false;
    }

    /**
     * 获取本天数据 [返回值为undefined代表调用失败]
     * @param {*} key 
     */
    static getDay(key: string) {
        const data = this.get(key);
        if (data && data.updateTime == getDayUpdateTime()) {
            return data.data;
        }
        return data && null;
    }
}