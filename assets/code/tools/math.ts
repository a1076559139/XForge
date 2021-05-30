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

class Decimal {
    toFixed(num: number, n = 0) {
        if (n == 0) {
            return Math.round(num);
        } else {
            const m = Math.pow(10, n);
            return Math.round(num * (m * 10) / 10) / m;
        }
    }
    add(num1: number, num2: number) {
        return this.toFixed(num1 + num2, 4);
    }
    sub(num1: number, num2: number) {
        return this.toFixed(num1 - num2, 4);
    }
    mul(num1: number, num2: number) {
        return this.toFixed(num1 * num2, 4);
    }
    div(num1: number, num2: number) {
        return this.toFixed(num1 / num2, 4);
    }
}

class eMath {
    random = new Random();
    decimal = new Decimal();
}

export default new eMath();