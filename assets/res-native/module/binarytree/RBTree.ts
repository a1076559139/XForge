import BinarySearchTree from './BSTree';
import { Colors, RedBlackNode } from './BTNode';
import { Compare, defaultCompare, ICompareFunction } from './BTUtil';

/**
 * 红黑树的实现
 * 概念: 红黑树也是一个自平衡二叉搜索树，可以应对多次删除和插入的场景
 * 特点:
 *   1. 每个节点不是红的就是黑的
 *   2. 树的根节点是黑的
 *   3. 所有叶节点都是黑的(用NULL引用标识的节点)
 *   4. 如果一个节点是红的，那么它的两个子节点都是黑的
 *   5. 不能有两个相邻的红节点，一个红节点不能有红的父节点或子节点
 *   6. 从给定的节点到它的后代节点(NULL叶节点)的所有路径包含相同数量的黑色节点
 */
export default class RedBlackTree<T> extends BinarySearchTree<T> {
    protected root: RedBlackNode<T> | undefined;
    constructor(protected compareFn: ICompareFunction<T> = defaultCompare) {
        super(compareFn);
    }

    /**
     * 重写insert方法:
     *   1. 插入节点后给节点应用一种颜色
     *   2. 验证树是否满足红黑树的条件以及是否还是自平衡的
     * @param key
     */
    insert(key: T) {
        if (this.root == null) {
            // 树为空，创建一个红黑树节点
            this.root = new RedBlackNode(key);
            // 红黑树的特点2: 根节点的颜色为黑色
            this.root.color = Colors.BLACK;
        } else {
            // 在合适的位置插入节点, insertNode方法返回新插入的节点
            const newNode = this.insertNode(this.root, key);
            // 节点插入后，验证红黑树属性
            this.fixTreeProperties(newNode);
        }
    }

    /**
     * 对于红黑树来说，节点和之前比起来需要一些额外的属性: 节点的颜色和指向父节点的引用, 因此我们需要创建一个RedBlackNode辅助类
     * 重写insertNode方法:
     *   1. 保存被插入节点的父节点的引用
     *   2. 返回节点的引用
     * @param node
     * @param key
     */
    protected insertNode(node: RedBlackNode<T>, key: T): RedBlackNode<T> {
        // 当前插入key小于当前节点的key
        if (this.compareFn(key, node.key) === Compare.LESS_THAN) {
            if (node.left == null) {
                // 当前节点的左子节点为null
                // 在当前节点的左子节点创建一个红黑树节点
                node.left = new RedBlackNode(key);
                // 保存父节点的引用
                node.left.parent = node;
                // 返回节点的引用
                return node.left;
            } else {
                // 当前节点的左子节点不为null, 递归寻找合适的位置将其插入
                return this.insertNode(node.left, key);
            }
        } else if (node.right == null) {
            // 右子节点为null
            // 在当前节点的右子节点创建一个红黑树节点
            node.right = new RedBlackNode(key);
            // 保存父节点的引用
            node.right.parent = node;
            // 返回节点的引用
            return node.right;
        } else {
            // 递归寻找合适的位置将其插入
            return this.insertNode(node.right, key);
        }
    }

    /**
     * 插入节点后验证红黑树属性
     * 验证红黑树是否平衡以及满足他的所有要求，需要使用两个概念: 重新填色和旋转
     * 1. 向树中插入节点后，新节点默认是红色，不会影响黑色节点数量的规则(规则6), 但会影响规则5: 两个后代红节点不能共存
     * 2. 如果插入节点的父节点是黑色, 不会冲突。
     * 3. 如果插入节点的父节点是红色, 会违反规则5
     * 4. 解决第3点的冲突: 改变父节点、祖父节点和叔节点
     *
     * 举个例子说明下上述过程:
     *             20                  20
     *            (黑)                 (红)
     *            / \                 / \
     *          11  23    ->        11  23
     *         (红) (红)            (黑) (黑)
     *               \                   \
     *               25                  25
     *            (红newNode)        (红newNode)
     * @param node
     */
    private fixTreeProperties(node: RedBlackNode<T>) {
        /**
         * 从插入的节点开始验证:
         *   1. 当前节点存在且节点的父节点颜色是红色
         *   2. 当前节点的颜色不为黑色
         */
        while (node && node.parent && node.parent.color === Colors.RED && node.color !== Colors.BLACK) {
            // 保证代码可读性: 保存当前节点的父节点引用以及祖父节点引用
            let parent = node.parent;
            const grandParent = <RedBlackNode<T>>parent.parent;
            // 父节点是祖父节点的左侧子节点: 情形A
            if (grandParent && grandParent.left === parent) {
                // 获取叔节点
                const uncle = grandParent.left;
                // 情形1A: 叔节点也是红色 -- 只需要重新填色
                if (uncle && uncle.color === Colors.RED) {
                    grandParent.color = Colors.RED;
                    parent.color = Colors.BLACK;
                    uncle.color = Colors.BLACK;
                    node = grandParent;
                } else {
                    // 情形2A: 节点是父节点是右侧子节点 -- 左旋转
                    if (node === parent.right) {
                        this.rotationRR(parent);
                        node = parent;
                        parent = <RedBlackNode<T>>node.parent;
                    }
                    // 情形3A: 节点是父节点的左侧子节点 -- 右旋转
                    this.rotationLL(grandParent);
                    parent.color = Colors.BLACK;
                    grandParent.color = Colors.RED;
                    node = parent;
                }
            } else {
                // 父节点是右侧子节点: 情形B
                // 获取叔节点
                const uncle = grandParent.left;
                // 情形1B: 叔节点是红色 -- 只需要填色
                if (uncle && uncle.color === Colors.RED) {
                    grandParent.color = Colors.RED;
                    parent.color = Colors.BLACK;
                    uncle.color = Colors.BLACK;
                    node = grandParent;
                } else {
                    // 情形2B: 节点是左侧子节点 -- 右旋转
                    if (node === parent.left) {
                        this.rotationLL(parent);
                        node = parent;
                        parent = <RedBlackNode<T>>node.parent;
                    }
                    // 情形3B: 节点是右侧子节点 -- 左旋转
                    this.rotationRR(grandParent);
                    parent.color = Colors.BLACK;
                    grandParent.color = Colors.RED;
                    node = parent;
                }
            }
        }
        // 设置根节点颜色
        this.root != null ? (this.root.color = Colors.BLACK) : this.root;
    }

    // 向右的单旋转
    private rotationLL(node: RedBlackNode<T>) {
        const tmp = <RedBlackNode<T>>node.left;
        node.left = tmp.right;
        if (tmp.right && tmp.right.key) {
            tmp.right.parent = node;
        }
        tmp.parent = node.parent;
        if (!node.parent) {
            this.root = tmp;
        } else {
            if (node === node.parent.left) {
                node.parent.left = tmp;
            } else {
                node.parent.right = tmp;
            }
            tmp.right = node;
            node.parent = tmp;
        }
    }

    // 向左的单旋转
    private rotationRR(node: RedBlackNode<T>) {
        const tmp = <RedBlackNode<T>>node.right;
        node.right = tmp.left;
        if (tmp.left && tmp.left.key) {
            tmp.left.parent = node;
        }
        tmp.parent = node.parent;
        if (!node.parent) {
            this.root = tmp;
        } else {
            if (node === node.parent.left) {
                node.parent.left = tmp;
            } else {
                node.parent.right = tmp;
            }
        }
        tmp.left = node;
        node.parent = tmp;
    }
}