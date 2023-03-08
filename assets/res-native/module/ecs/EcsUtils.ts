/**
 * Map、Set、Array都是有序的
 */
class CusTomMap<K, V> {
    private map: Map<K, V> = new Map();

    get size() {
        return this.map.size;
    }
    keys(out: K[]) {
        this.map.forEach((v, key) => out.push(key));
        return out;
    }
    values(out: V[]) {
        this.map.forEach((value) => out.push(value));
        return out;
    }
    forEach(callbackfn: (value: V, key: K, map: Map<K, V>) => void, thisArg?: any) {
        return this.map.forEach(callbackfn, thisArg);
    }
    get(key: K) {
        return this.map.get(key);
    }
    has(key: K) {
        return this.map.has(key);
    }
    set(key: K, value: V) {
        return this.map.set(key, value);
    }
    delete(key: K) {
        return this.map.delete(key);
    }
    clear() {
        return this.map.clear();
    }
}

export class NumberMap<K> extends CusTomMap<K, number> {
    add(key: K) {
        const num = (this.get(key) || 0) + 1;
        this.set(key, num);
        return num;
    }
    sub(key: K) {
        if (!this.has(key)) return 0;
        const num = this.get(key) - 1;
        this.set(key, num);
        return num;
    }
    subDel(key: K) {
        if (this.sub(key) === 0) {
            this.delete(key);
            return true;
        }
        return false;
    }
}

export class SetMap<K, V> extends CusTomMap<K, Set<V>> {
    add(key: K, value: V) {
        if (!this.has(key)) {
            return this.set(key, new Set<V>().add(value)).size;
        } else {
            return this.get(key).add(value).size;
        }
    }
    sub(key: K, value: V) {
        if (!this.has(key)) return 0;
        const set = this.get(key);
        set.delete(value);
        return set.size;
    }
    subDel(key: K, value: V) {
        if (this.sub(key, value) === 0) {
            this.delete(key);
            return true;
        }
        return false;
    }
}

/**
 * 唯一数组(同Set)Map
 */
export class UArrayMap<K, V> extends CusTomMap<K, Array<V>> {
    add(key: K, value: V) {
        if (!this.has(key)) {
            this.set(key, [value]);
            return 1;
        } else {
            const array = this.get(key);
            if (array.indexOf(value) === -1) {
                array.push(value);
            }
            return array.length;
        }
    }
    sub(key: K, value: V) {
        if (!this.has(key)) return 0;

        const array = this.get(key);
        const index = array.indexOf(value);
        if (index >= 0) {
            array.splice(index, 1);
        }

        return array.length;
    }
    subDel(key: K, value: V) {
        if (this.sub(key, value) === 0) {
            this.delete(key);
            return true;
        }
        return false;
    }
}

export class Cache<V> {
    private cache: V[] = [];

    get() {
        if (this.cache.length) {
            return this.cache.pop();
        }
        return null;
    }

    put(v: V) {
        this.cache.push(v);
    }
}

export class CacheMap<V> {
    private cache: Map<string, V[]> = new Map();

    get(k: string) {
        const array = this.cache.get(k);
        if (array && array.length) {
            return array.pop();
        }
        return null;
    }

    put(k: string, v: V) {
        const array = this.cache.get(k);
        if (array) {
            array.push(v);
        } else {
            this.cache.set(k, [v]);
        }
    }
}

export function createMap(forceDictMode: boolean) {
    let map = Object.create(null);
    if (forceDictMode) {
        const INVALID_IDENTIFIER_1 = '.';
        const INVALID_IDENTIFIER_2 = '/';
        map[INVALID_IDENTIFIER_1] = true;
        map[INVALID_IDENTIFIER_2] = true;
        delete map[INVALID_IDENTIFIER_1];
        delete map[INVALID_IDENTIFIER_2];
    }
    return map;
}

export function CreateUUID() {
    let uuid = 0;
    return function CreateUUID() {
        return ++uuid;
    };
}