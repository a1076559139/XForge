/**
 * Binary Search Tree
 * 二叉查找树
 * 
 * @see https://juejin.im/post/6847902219216355341
 * @see https://mp.weixin.qq.com/s/Hbny1btHo6ZARfIp15PrQQ
 */
import { Node } from './BTNode';
import { Compare, defaultCompare, ICompareFunction } from './BTUtil';

interface callbackFn<T> {
    (val: T): void;
}

/**
 * 二叉搜索树的实现
 */
export default class BinarySearchTree<T> {
    protected root: Node<T> | undefined;

    constructor(protected compareFn: ICompareFunction<T> = defaultCompare) {
        this.root = undefined;
    }

    insert(key: T): void {
        if (this.root == null) {
            // 如果根节点不存在则直接新建一个节点
            this.root = new Node(key);
        } else {
            // 在根节点中找合适的位置插入子节点
            this.insertNode(this.root, key);
        }
    }

    // 节点插入
    protected insertNode(node: Node<T>, key: T): void {
        // 新节点的键小于当前节点的键，则将新节点插入当前节点的左边
        // 新节点的键大于当前节点的键，则将新节点插入当前节点的右边
        if (this.compareFn(key, node.key) === Compare.LESS_THAN) {
            if (node.left == null) {
                // 当前节点的左子树为null直接插入
                node.left = new Node(key);
            } else {
                // 从当前节点(左子树)向下递归,找到null位置将其插入
                this.insertNode(node.left, key);
            }
        } else {
            if (node.right == null) {
                // 当前节点的右子树为null直接插入
                node.right = new Node(key);
            } else {
                // 从当前节点(右子树)向下递归，找到null位置将其插入
                this.insertNode(node.right, key);
            }
        }
    }

    // 中序遍历
    inOrderTraverse(callback: callbackFn<T>): void {
        this.inOrderTraverseNode(<Node<T>>this.root, callback);
    }

    // 按顺序遍历节点
    private inOrderTraverseNode(node: Node<T>, callback: callbackFn<T>) {
        if (node != null) {
            this.inOrderTraverseNode(<Node<T>>node.left, callback);
            callback(node.key);
            this.inOrderTraverseNode(<Node<T>>node.right, callback);
        }
    }

    // 先序遍历
    preOrderTraverse(callback: callbackFn<T>): void {
        this.preOrderTraverseNode(<Node<T>>this.root, callback);
    }

    // 先序遍历结点
    private preOrderTraverseNode(node: Node<T>, callback: callbackFn<T>): void {
        if (node != null) {
            callback(node.key);
            this.preOrderTraverseNode(<Node<T>>node.left, callback);
            this.preOrderTraverseNode(<Node<T>>node.right, callback);
        }
    }

    // 后序遍历
    postOrderTraverse(callback: callbackFn<T>): void {
        this.postOrderTraverseNode(<Node<T>>this.root, callback);
    }

    // 后序遍历节点
    private postOrderTraverseNode(node: Node<T>, callback: callbackFn<T>): void {
        if (node != null) {
            this.postOrderTraverseNode(<Node<T>>node.left, callback);
            this.postOrderTraverseNode(<Node<T>>node.right, callback);
            callback(node.key);
        }
    }

    // 获取最小值
    min(): Node<T> {
        return this.minNode(<Node<T>>this.root);
    }

    // 树的最小节点
    protected minNode(node: Node<T>): Node<T> {
        let current = node;
        while (current != null && current.left != null) {
            current = current.left;
        }
        return current;
    }

    // 获取最大值
    max(): Node<T> {
        return this.maxNode(<Node<T>>this.root);
    }

    // 树的最大节点
    private maxNode(node: Node<T>) {
        let current = node;
        while (current != null && current.right != null) {
            current = current.right;
        }
        return current;
    }

    // 搜索特定值
    search(key: T): boolean | Node<T> {
        return this.searchNode(<Node<T>>this.root, key);
    }

    // 搜索节点
    private searchNode(node: Node<T>, key: T): boolean | Node<T> {
        if (node == null) {
            return false;
        }

        if (this.compareFn(key, node.key) === Compare.LESS_THAN) {
            // 要查找的key在节点的左侧
            return this.searchNode(<Node<T>>node.left, key);
        } else if (this.compareFn(key, node.key) === Compare.BIGGER_THAN) {
            // 要查找的key在节点的右侧
            return this.searchNode(<Node<T>>node.right, key);
        } else {
            // 节点已找到
            return true;
        }
    }

    // 删除节点函数
    remove(key: T): void {
        this.removeNode(<Node<T>>this.root, key);
    }

    // 删除节点
    protected removeNode(node: Node<T> | null, key: T): null | Node<T> {
        // 正在检测的节点为null，即键不存在于树中
        if (node == null) {
            return null;
        }

        // 不为null,需要在树中找到要移除的键
        if (this.compareFn(key, node.key) === Compare.LESS_THAN) {
            // 目标key小于当前节点的值则沿着树的左边找
            node.left = <Node<T>>this.removeNode(<Node<T>>node.left, key);
            return node;
        } else if (this.compareFn(key, node.key) === Compare.BIGGER_THAN) {
            // 目标key大于当前节点的值则沿着树的右边找
            node.right = <Node<T>>this.removeNode(<Node<T>>node.right, key);
            return node;
        } else {
            // 键等于key,需要处理三种情况
            if (node.left == null && node.right == null) {
                // 移除一个叶节点,即该节点没有左、右子节点
                // 将节点指向null来移除它
                node = null;
                return node;
            }

            if (node.left == null) {
                // 移除一个左侧子节点的节点
                // node有一个右侧子节点，因此需要把对它的引用改为对它右侧子节点的引用
                node = <Node<T>>node.right;
                // 返回更新后的节点
                return node;
            } else if (node.right == null) {
                // 移除一个右侧子节点的节点
                // node有一个左侧子节点，因此需要把对它的引用改为对它左侧子节点的引用
                node = node.left;
                // 返回更新后的节点
                return node;
            }

            // 移除有两个子节点的节点
            const aux = this.minNode(node.right); // 当找到了要移除的节点后,需要找到它右边子树最小的节点,即它的继承者
            node.key = aux.key; // 用右侧子树最小的节点的键去更新node的键
            // 更新完node的键后，树中存在了两个相同的键，因此需要移除多余的键
            node.right = <Node<T>>this.removeNode(node.right, aux.key); // 移除右侧子树中的最小节点
            return node; // 返回更新后的节点
        }
    }
}