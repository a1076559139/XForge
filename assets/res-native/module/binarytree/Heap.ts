/**
 * @see https://github.com/likaia/JavaScript-test/blob/master/src/Heap/lib/Heap.ts
 */
import { Compare, defaultCompare, ICompareFunction, reverseCompare } from './BTUtil';

/**
 * 堆是一颗完全二叉树
 *  1. 左子节点的位置: 2 * index + 1
 *  2. 右子节点的位置: 2 * index + 2
 *  3. 父节点的位置: (index - 1) / 2
 */
export class MinHeap<T> {
    // 用数组来描述一个堆
    protected heap: T[];

    constructor(protected compareFn: ICompareFunction<T> = defaultCompare) {
        this.heap = [];
    }

    // 获取左子节点的位置
    protected getLeftIndex(index: number): number {
        return 2 * index + 1;
    }

    // 获取右子节点的位置
    protected getRightIndex(index: number): number {
        return 2 * index + 2;
    }

    // 获取父节点的位置
    protected getParentIndex(index: number): number | undefined {
        if (index === 0) {
            return undefined;
        }
        return Math.floor((index - 1) / 2);
    }

    // 实现插入函数
    insert(value: T): boolean {
        if (value != null) {
            // 向堆的叶结点添加元素，即数组的尾部
            this.heap.push(value);
            // 进行上移操作，即上移节点至合适的位置
            this.siftUp(this.heap.length - 1);
            return true;
        }
        return false;
    }

    // 堆排序
    heapSort(array: T[]): void {
        // 构建堆
        this.buildHeap(array);
        // 从堆的末尾开始遍历，将遍历到的元素与0好元素进行交换，然后执行下移操作
        for (let i = array.length - 1; i >= 0; i--) {
            this.swap(array, i, 0);
            this.heapify(array, i, 0);
        }
    }

    // 交换节点
    private heapify(array: T[], size: number, index: number): boolean | void {
        // 递归基线条件
        if (index >= size) {
            return false;
        }

        // 找到当前要操作节点的左、右子树
        const left = this.getLeftIndex(index);
        const right = this.getRightIndex(index);
        // 保存当前要操作节点的位置
        let element = index;

        // 如果当前要操作节点的左子节点大于其父节点，更新element的值
        if (left < size && this.compareFn(array[left], array[element]) === Compare.BIGGER_THAN) {
            element = left;
        }

        // 如果当前要操作节点的右子节点大于其父节点，更新element的值
        if (right < size && this.compareFn(array[right], array[element]) === Compare.BIGGER_THAN) {
            element = right;
        }

        // element的位置不等于当前要操作节点，交换元素位置，递归执行
        if (element !== index) {
            this.swap(array, element, index);
            this.heapify(array, size, element);
        }
    }

    // 构建堆
    private buildHeap(array: T[]) {
        // 获取最后一个节点的位置
        const last = array.length - 1;
        const lastParent = <number>this.getParentIndex(last);
        // 从最后一个节点的父节点开始进行heapify操作
        for (let i = lastParent; i >= 0; i--) {
            this.heapify(array, array.length, i);
        }
    }

    // 实现上移函数
    protected siftUp(index: number): void {
        // 获取父节点位置
        let parent = <number>this.getParentIndex(index);
        // 插入的位置必须大于0，且它的父节点大于其本身就执行循环里的操作
        while (index > 0 && this.compareFn(this.heap[parent], this.heap[index]) === Compare.BIGGER_THAN) {
            // 交换元素的位置
            this.swap(this.heap, parent, index);
            // 修改当前插入值的位置为它的父节点，重新获取父节点的位置，即重复这个过程直到堆的根节点也经过了交换
            index = parent;
            parent = <number>this.getParentIndex(index);
        }
    }

    // 实现交换数组元素位置函数
    protected swap(array: T[], exchangeElement: number, exchangedElement: number): void {
        // 用一个临时变量保存交换元素
        const temp = array[exchangeElement];
        // 将被交换元素赋值给交换元素
        array[exchangeElement] = array[exchangedElement];
        // 将第一步保存的临时变量赋值给被交换元素
        array[exchangedElement] = temp;
    }

    // 获取堆大小
    size(): number {
        return this.heap.length;
    }

    // 判断堆是否为空
    isEmpty(): boolean {
        return this.size() === 0;
    }

    // 获取堆的最小值
    findMinimum(): T | undefined {
        // 返回数组的最小元素
        return this.isEmpty() ? undefined : this.heap[0];
    }

    // 导出堆中的值
    extract(): T | undefined {
        if (this.isEmpty()) {
            return undefined;
        }

        if (this.size() === 1) {
            // 返回数组的第一个元素
            return this.heap.shift();
        }

        const removedValue = this.heap.shift();
        // 执行下移操作
        this.siftDown(0);
        return removedValue;
    }

    // 下移操作
    protected siftDown(index: number): void {
        // 保存当前插入值的位置
        let element = index;
        // 获取其左、右子节点的位置
        const left = this.getLeftIndex(index);
        const right = this.getRightIndex(index);
        const size = this.size();
        // 元素有效，且当前元素大于其左子节点
        if (left < size && this.compareFn(this.heap[element], this.heap[left]) === Compare.BIGGER_THAN) {
            element = left;
        }

        // 元素有效，当前元素大于其右子节点
        if (right < size && this.compareFn(this.heap[element], this.heap[right]) === Compare.BIGGER_THAN) {
            element = right;
        }

        // 找到最小子节点的位置，校验它的值是否和element相同
        if (index !== element) {
            // 如果不相同将它和最小的element进行交换
            this.swap(this.heap, index, element);
            // 递归执行
            this.siftDown(element);
        }
    }

    // 获取堆中的数据
    getIsArray(): T[] {
        return this.heap;
    }
}

// 最大堆只需要继承最小堆，更改比对方法，将b与a进行比对即可。
export class MaxHeap<T> extends MinHeap<T> {
    constructor(protected compareFn: ICompareFunction<T> = defaultCompare) {
        super(compareFn);
        this.compareFn = reverseCompare(compareFn);
    }
}