class UuidMaker {
    private static _inst: UuidMaker = null;
    static get inst() {
        if (!this._inst) this._inst = new UuidMaker();
        return this._inst;
    }
    private constructor() { }

    private index = 0;
    public create() {
        if (++this.index > 1E10) {
            this.index = 1;
        }
        return this.index;
    }
}

/**
 * 默认碰撞检测过滤器
 * @param rect 
 * @param other 
 */
function FilterHandle(rect: QuadRect, other: QuadRect, filter?: (rect: QuadRect, other: QuadRect) => boolean): boolean {
    if (rect.uuid === other.uuid) return false;
    return filter ? filter(rect, other) : rect.intersect(other);
}

/**
 * 每个象限的flag
 */
const QuadFlag = [1 << 0, 1 << 1, 1 << 2, 1 << 3];
/**
 * 混合象限的flag
 * [1象限+2象限, 2象限+3象限, 3象限+4象限, 4象限+1象限]
 */
const QuadFlagMix = [QuadFlag[0] | QuadFlag[1], QuadFlag[1] | QuadFlag[2], QuadFlag[2] | QuadFlag[3], QuadFlag[0] | QuadFlag[3]];

export class QuadRect {
    static setPosAndSize(rect: QuadRect, x: number, y: number, w: number, h: number) {
        return rect.setPosAndSize(x, y, w, h);
    }

    static setPositon(rect: QuadRect, x: number, y: number) {
        return rect.setPositon(x, y);
    }

    static setSize(rect: QuadRect, w: number, h: number) {
        return rect.setSize(w, h);
    }

    private _uuid: number = 0;

    private _x: number = 0;
    private _y: number = 0;
    private _width: number = 0;
    private _height: number = 0;

    private _xMid: number = 0;
    private _yMid: number = 0;

    private _xMax: number = 0;
    private _yMax: number = 0;

    public get uuid() {
        return this._uuid;
    }
    public get x() {
        return this._x;
    }
    public get y() {
        return this._y;
    }
    public get width() {
        return this._width;
    }
    public get height() {
        return this._height;
    }
    public get xMin() {
        return this._x;
    }
    public get xMid() {
        return this._xMid;
    }
    public get xMax() {
        return this._xMax;
    }
    public get yMin() {
        return this._y;
    }
    public get yMid() {
        return this._yMid;
    }
    public get yMax() {
        return this._yMax;
    }

    constructor(x: number, y: number, w: number, h: number) {
        this._uuid = UuidMaker.inst.create();
        this.setPosAndSize(x, y, w, h);
    }

    protected setPosAndSize(x: number, y: number, w: number, h: number) {
        this._x = x;
        this._y = y;
        this.setSize(w, h);
    }

    protected setPositon(x: number, y: number) {
        this._x = x;
        this._y = y;

        this._xMax = x + this._width;
        this._yMax = y + this._height;

        this._xMid = x + this._width / 2;
        this._yMid = y + this._height / 2;
    }

    protected setSize(w: number, h: number) {
        this._width = w;
        this._height = h;

        this._xMax = this._x + w;
        this._yMax = this._y + h;

        this._xMid = this._x + w / 2;
        this._yMid = this._y + h / 2;
    }

    /**
     * 测试自身矩形是否与rect矩形相交
     */
    public intersect(rect: QuadRect) {
        return rect.xMax >= this.xMin &&
            rect.xMin <= this.xMax &&
            rect.yMax >= this.yMin &&
            rect.yMin <= this.yMax;
    }

    /**
     * 测试自身矩形是否包含rect矩形
     */
    public contain(rect: QuadRect) {
        return this.xMin <= rect.xMax &&
            this.xMax >= rect.xMin &&
            this.yMin <= rect.yMax &&
            this.yMax >= rect.yMin;
    }
}

class QuadtreeChild {
    protected maxLevel: number = 4;

    protected level: number = 0;
    protected bounds: QuadRect = null;
    protected rects: QuadRect[][] = [[], [], [], [], []];
    protected childs: QuadtreeChild[] = [];

    // 是否有效
    private _isValid = true;

    constructor(bounds: QuadRect, max_levels?: number, level?: number) {
        this.bounds = bounds;

        this.maxLevel = max_levels || 4;

        this.level = level || 0;
    }

    public get isValid(): boolean {
        return this._isValid;
    }

    public get size(): number {
        let n = 0;
        for (let i = 0; i < this.childs.length; i++) {
            n += this.childs[i].size;
        }
        return n + this.rects.length;
    }

    /**
     * 分裂
     */
    protected split() {
        if (!this.childs.length) {
            const x = this.bounds.x;
            const y = this.bounds.y;
            const w = this.bounds.width / 2;
            const h = this.bounds.height / 2;
            const level = this.level + 1;
            this.childs.push(
                new QuadtreeChild(new QuadRect(x + w, y + h, w, h), this.maxLevel, level),
                new QuadtreeChild(new QuadRect(x, y + h, w, h), this.maxLevel, level),
                new QuadtreeChild(new QuadRect(x, y, w, h), this.maxLevel, level),
                new QuadtreeChild(new QuadRect(x + w, y, w, h), this.maxLevel, level)
            );
        }
    }

    /**
     * 获得所在象限
     */
    protected getQuadFlags(rect: QuadRect): number {
        let flags = 0;

        const startInLeft = rect.xMin < this.bounds.xMid,
            startInTop = rect.yMax > this.bounds.yMid,
            endInRight = rect.xMax > this.bounds.xMid,
            endInBottom = rect.yMin < this.bounds.yMid;

        if (startInTop && endInRight) {
            flags |= QuadFlag[0];
        }
        if (startInTop && startInLeft) {
            flags |= QuadFlag[1];
        }
        if (startInLeft && endInBottom) {
            flags |= QuadFlag[2];
        }
        if (endInRight && endInBottom) {
            flags |= QuadFlag[3];
        }

        return flags;
    }

    /**
     * 插入
     */
    public insert(rect: QuadRect): QuadtreeChild {
        // 获取与哪些象限相交
        const quadFlags = this.getQuadFlags(rect);
        // 子集index
        const index = QuadFlag.indexOf(quadFlags);

        // 相交数为0或多于1个，直接存储在自身
        // 自身是最后一层，直接存储在自身
        if (index === -1 || this.level === this.maxLevel) {
            // 0: 4象限都相交
            // 1: 与1-2象限相交
            // 2: 与2-3象限相交
            // 3: 与3-4象限相交
            // 4: 与4-1象限相交
            this.rects[QuadFlagMix.indexOf(quadFlags) + 1].push(rect);
            return this;
        }

        // 分割子象限
        if (this.childs.length === 0) {
            this.split();
        }

        // 插入到子象限中
        return this.childs[index].insert(rect);
    }

    /**
     * 删除(只在自身返回内查找，不查询子树)
     */
    public remove(rectUuid: number): QuadRect {
        for (let index = 0, rects: QuadRect[] = null; index < this.rects.length; index++) {
            rects = this.rects[index];
            for (let i = 0; i < rects.length; i++) {
                if (rects[i].uuid === rectUuid) {
                    return rects.splice(i, 1)[0];
                }
            }
        }

        return null;
    }

    /**
     * 检索
     * @param rect 检索区域
     * @param filter 过滤器
     */
    public retrieve(out: QuadRect[], rect: QuadRect, filter?: (rect: QuadRect, other: QuadRect) => boolean): QuadRect[] {
        // 获取rect与哪些象限相交
        const quadFlags = this.getQuadFlags(rect);

        // 自身存储的rect一定会被检索到
        for (let i = -1; i < QuadFlagMix.length; i++) {
            if (i >= 0 && !(QuadFlagMix[i] & quadFlags)) continue;

            for (let index = 0, rects = this.rects[i + 1], other: QuadRect = null; index < rects.length; index++) {
                other = rects[index];
                if (FilterHandle(rect, other, filter)) {
                    out.push(other);
                }
            }
        }

        // 自身是最后一层，没有子节点
        if (this.childs.length === 0 || this.level === this.maxLevel) {
            return out;
        }

        // 都不相交
        if (quadFlags === 0) {
            console.error('rect不与tree中的任何一个象限相交，这个情况不该发生');
            return out;
        }

        // 组合子象限数据
        for (let index = 0, value = 0; index < QuadFlag.length; index++) {
            value = QuadFlag[index];

            if (!(value & quadFlags)) continue;
            this.childs[index].retrieve(out, rect, filter);
        }

        return out;
    }

    /**
     * 清空
     */
    public clear() {
        for (let i = this.childs.length - 1; i >= 0; i--) {
            this.childs[i].clear();
        }

        this._isValid = false;
        this.rects.length = 0;
        this.childs.length = 0;
    }
}

export class Quadtree {
    private quadTree: QuadtreeChild = null;
    private rectTree: Map<number, QuadtreeChild> = new Map();
    private rectInfo: Map<number, QuadRect> = new Map();

    /**
     * 创建
     * @param bounds    界限范围
     * @param maxLevels 最大深度
     */
    constructor(bounds: QuadRect, max_levels?: number) {
        this.quadTree = new QuadtreeChild(bounds, max_levels);
    }

    /**
     * 插入一个rect
     * @param rect 
     */
    public insert(rect: QuadRect): boolean {
        const tree = this.quadTree.insert(rect);
        if (!tree) return false;

        this.rectTree.set(rect.uuid, tree);
        this.rectInfo.set(rect.uuid, rect);

        return true;
    }

    /**
     * 移除一个rect
     * @param uuid 
     */
    public remove(uuid: number): QuadRect {
        const tree = this.rectTree.get(uuid);
        if (!tree) return null;

        this.rectTree.delete(uuid);
        this.rectInfo.delete(uuid);

        return tree.remove(uuid);
    }

    /**
     * 刷新一个rect
     * @param uuid 
     * @param data 
     */
    public refresh(uuid: number, data?: { x?: number, y?: number, width?: number, height?: number }): boolean {
        const rect = this.remove(uuid);
        if (!rect) return false;

        // 设置
        if (data) {
            const x = typeof data.x === 'undefined' ? rect.x : data.x;
            const y = typeof data.y === 'undefined' ? rect.y : data.y;
            const w = typeof data.width === 'undefined' ? rect.width : data.width;
            const h = typeof data.height === 'undefined' ? rect.height : data.height;
            QuadRect.setPosAndSize(rect, x, y, w, h);
        }

        const tree = this.insert(rect);
        if (!tree) return false;

        return true;
    }

    /**
     * 检索rect数组
     * @param rectOrUuid 
     * @param filter 
     */
    public retrieve(out: QuadRect[], rectOrUuid: QuadRect | number, filter?: (rect: QuadRect, other: QuadRect) => boolean): QuadRect[] {
        if (typeof rectOrUuid === 'number') {
            const rect = this.rectInfo.get(rectOrUuid);
            if (!rect) return out;
            return this.quadTree.retrieve(out, rect, filter);
        } else {
            return this.quadTree.retrieve(out, rectOrUuid, filter);
        }
    }

    /**
     * 清理内存
     */
    public clear() {
        this.quadTree.clear();
        this.rectTree.clear();
        this.rectInfo.clear();
    }
}