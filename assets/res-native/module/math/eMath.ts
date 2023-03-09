/*
 * @Description: 用于处理计算结果，还原计算精度丢失的部分(同样以各平台计算一致性为目的)
 */
class Random {
    private seed = this.getSeed();
    private getSeed(seed?: number) {
        if (typeof seed !== 'number') {
            seed = Math.floor(Math.random() * 233280);
        } else {
            seed = Math.floor(seed % 233280);
        }
        return seed;
    }
    setSeed(seed: number) {
        this.seed = this.getSeed(seed);
    }
    get() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
    getBySeed(seed: number) {
        seed = this.getSeed(seed);
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    }
}

class EMath {
    public random = new Random();
    private E = [0, 4e-1, 4e-2, 4e-3, 4e-4, 4e-5, 4e-6, 4e-7, 4e-8, 4e-9, 4e-10, 4e-11, 4e-12, 4e-13, 4e-14, 4e-15, 4e-16];

    /**
     * 获取整数位数
     */
    public getIntegerPlace(num: number) {
        if (typeof num !== 'number') return 0;
        num = Math.abs(num);
        let place = 1;
        while (num >= 10) {
            num /= 10;
            place++;
        }
        return place;
    }

    /**
     * 获取小数位数
     */
    public getDecimalPlace(num: number) {
        if (!num || num === Math.floor(num)) return 0;

        const intPlace = this.getIntegerPlace(num);
        if (intPlace >= 17) return 0;

        let pow = Math.pow(10, Math.max(17 - intPlace, 0));

        for (let n = 1, m = 10, temp = 0; n < 16; n += 1, m *= 10) {
            temp = num * m;
            if (Math.abs(temp - Math.round(temp)) < 1 / pow) return n;
            pow /= 10;
        }
        return 16;
    }

    /**
     * 修剪小数位数
     * 
     * 以下两种情况，保留4位应结果相同
     * 1.12345 
     * 1.1234499999999999
     * 
     * 1.1234 
     * 1.1233999999999999
     */
    public toFixed(num: number, decimals = 4) {
        let sign = 1;
        if (num < 0) {
            sign = -1;
            num = Math.abs(num);
        }

        const intPlace = this.getIntegerPlace(num);
        num += this.E[Math.max(17 - intPlace, 0)];

        const pow = Math.pow(10, decimals);
        const int = Math.floor(num * pow * 10);

        if (int <= 4) return 0;

        // 求结果整数
        let result = Math.floor(int / 10);

        // 求结果位后一位
        const digit = int - result * 10;

        // 是否产生进位
        if (digit >= 5) result += 1;

        if (decimals <= 0 || result === 0) {
            return sign === 1 ? result : -result;
        } else if (result < pow) {
            result += pow;
            let str = result.toString();
            str = str.slice(1, str.length - decimals) + '.' + str.slice(-decimals);
            return sign === 1 ? Number('0' + str) : Number('-0' + str);
        } else {
            let str = result.toString();
            str = str.slice(0, str.length - decimals) + '.' + str.slice(-decimals);
            return sign === 1 ? Number(str) : Number('-' + str);
        }
    }
    public toInt(num: number) {
        return this.toFixed(num, 0);
    }
    public add(num1: number, num2: number, decimals = 4) {
        return this.toFixed(num1 + num2, decimals);
    }
    public sub(num1: number, num2: number, decimals = 4) {
        return this.toFixed(num1 - num2, decimals);
    }
    public mul(num1: number, num2: number, decimals = 4) {
        return this.toFixed(num1 * num2, decimals);
    }
    public div(num1: number, num2: number, decimals = 4) {
        return this.toFixed(num1 / num2, decimals);
    }
}

export default new EMath();