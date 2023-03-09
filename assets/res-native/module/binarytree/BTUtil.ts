/**
 * 常用工具类函数
 */

// 定义比对函数的参数类型以及返回值类型
export type ICompareFunction<T> = (a: T, b: T) => number;
// 比对函数
export type IDiffFunction<T> = (a: T, b: T) => number;

// 枚举类：定义比对返回值
export enum Compare {
    LESS_THAN = -1,
    BIGGER_THAN = 1,
    EQUALS = 0
}

// 默认校验函数: 判断参数a与参数b是否相等
export function defaultEquals<T>(a: T, b: T): boolean {
    return a === b;
}

// 默认的字符串转换函数: 用于将其他类型的数据转换为字符串
export function defaultToString(item: any): string {
    if (item === null) {
        return 'null';
    } else if (item === undefined) {
        return 'undefined';
    } else if (typeof item === 'string' || item instanceof String) {
        return `${item}`;
    }
    return item.toString();
}

// 默认的比对函数: 比对参数a和参数b的大小返回其相应的枚举值
export function defaultCompare<T>(a: T, b: T): number {
    if (a === b) {
        return Compare.EQUALS;
    } else if (a > b) {
        return Compare.BIGGER_THAN;
    } else {
        return Compare.LESS_THAN;
    }
}

// 反转比对函数: 比对参数b和参数a的大小返回其对应的枚举值
export function reverseCompare<T>(compareFn: ICompareFunction<T>): ICompareFunction<T> {
    return (a, b) => compareFn(b, a);
}

// 默认比对函数
export function defaultDiff<T>(a: T, b: T): number {
    return Number(a) - Number(b);
}

// 大于等于
export function biggerEquals<T>(a: T, b: T, compareFn: ICompareFunction<T>): boolean {
    const comp = compareFn(a, b);
    return comp === Compare.BIGGER_THAN || comp === Compare.EQUALS;
}

// 小于等于
export function lesserEquals<T>(a: T, b: T, compareFn: ICompareFunction<T>): boolean {
    const comp = compareFn(a, b);
    return comp === Compare.LESS_THAN || comp === Compare.EQUALS;
}