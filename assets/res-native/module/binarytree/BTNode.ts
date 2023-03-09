/**
 * 二叉树的辅助类: 用于存储二叉树的每个节点
 */
export class Node<K> {
    public left: Node<K> | undefined;
    public right: Node<K> | undefined;
    constructor(public key: K) {
        this.left = undefined;
        this.right = undefined;
    }

    toString() {
        return `${this.key}`;
    }
}

export enum Colors {
    RED = 0,
    BLACK = 1
}

/**
 * 红黑树辅助节点
 *   1. 添加parent和color节点
 *   2. 节点的默认颜色为红色
 */
export class RedBlackNode<K> extends Node<K> {
    public left: RedBlackNode<K> | undefined;
    public right: RedBlackNode<K> | undefined;
    public parent: RedBlackNode<K> | undefined;
    public color: number;
    constructor(public key: K) {
        super(key);
        this.color = Colors.RED;
    }

    isRed() {
        return this.color === Colors.RED;
    }
}