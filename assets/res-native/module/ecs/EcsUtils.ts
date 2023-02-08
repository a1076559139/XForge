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
            this.set(key, new Set<V>().add(value));
        } else {
            this.get(key).add(value);
        }
    }
    sub(key: K, value: V) {
        if (!this.has(key)) return;
        this.get(key).delete(value);
    }

    subDel(key: K, value: V) {
        this.sub(key, value);

        const set = this.get(key);
        if (set && set.size === 0) {
            this.delete(key);
        }
    }
}

/**
 * 唯一数组(同Set)Map
 */
export class UArrayMap<K, V> extends CusTomMap<K, Array<V>> {
    add(key: K, value: V) {
        if (!this.has(key)) {
            this.set(key, [value]);
        } else {
            const array = this.get(key);
            if (array.indexOf(value) === -1) {
                array.push(value);
            }
        }
    }
    sub(key: K, value: V) {
        if (!this.has(key)) return;

        const array = this.get(key);
        const index = array.indexOf(value);
        if (index >= 0) {
            array.splice(index, 1);
        }
    }

    subDel(key: K, value: V) {
        this.sub(key, value);

        const array = this.get(key);
        if (array && array.length === 0) {
            this.delete(key);
        }
    }
}

export function createMap(forceDictMode) {
    var map = Object.create(null);
    if (forceDictMode) {
        const INVALID_IDENTIFIER_1 = '.';
        const INVALID_IDENTIFIER_2 = '/';
        map[INVALID_IDENTIFIER_1] = true;
        map[INVALID_IDENTIFIER_2] = true;
        delete map[INVALID_IDENTIFIER_1];
        delete map[INVALID_IDENTIFIER_2];
    }
    return map;
};