import BinarySearchTree from './BSTree';
import { Node } from './BTNode';
import { Compare, defaultCompare, ICompareFunction } from './BTUtil';

// 平衡因子的值
enum BalanceFactor {
    UNBALANCED_RIGHT = 1,
    SLIGHTLY_UNBALANCED_RIGHT = 2,
    BALANCED = 3,
    SLIGHTLY_UNBALANCED_LEFT = 4,
    UNBALANCED_LEFT = 5
}

export default class AVLTree<T> extends BinarySearchTree<T> {
    constructor(protected compareFn: ICompareFunction<T> = defaultCompare) {
        super(compareFn);
    }

    // 计算节点高度
    private getNodeHeight(node: Node<T>): number {
        if (node == null) {
            return -1;
        }
        return Math.max(this.getNodeHeight(<Node<T>>node.left), this.getNodeHeight(<Node<T>>node.right)) + 1;
    }

    // 计算节点的平衡因子:在AVL树中，需要对每个节点计算右子树的高度和左子树的高度的差值，该值应为0 | -1 | 1，如果差值不符合要求则需要平衡该树。
    private getBalanceFactor(node: Node<T>) {
        // 计算差值
        const heightDifference = this.getNodeHeight(<Node<T>>node.left) - this.getNodeHeight(<Node<T>>node.right);
        switch (heightDifference) {
            case -2:
                return BalanceFactor.UNBALANCED_RIGHT;
            case -1:
                return BalanceFactor.SLIGHTLY_UNBALANCED_RIGHT;
            case 1:
                return BalanceFactor.SLIGHTLY_UNBALANCED_LEFT;
            case 2:
                return BalanceFactor.UNBALANCED_LEFT;
            default:
                return BalanceFactor.BALANCED;
        }
    }

    /**
     * 左左情况: 向右的单旋转
     *
     *      b                            a
     *     / \                          / \
     *    a   e -> rotationLL(b) ->    c   b
     *   / \                              / \
     *  c   d                            d   e
     *
     * @param node
     */
    private rotationLL(node: Node<T>) {
        // 创建tmp变量, 存储node的左子节点
        const tmp = <Node<T>>node.left;
        // node的左子节点修改为tmp的右子节点
        node.left = tmp.right;
        // tmp的右子节点修改为node
        tmp.right = node;
        // 更新节点
        return tmp;
    }

    /**
     * 右右情况: 向左的单旋转
     *
     *      a                            b
     *     / \                          / \
     *    c   b -> rotationRR(a) ->    a   e
     *       / \                      / \
     *      d   e                    c   d
     * @param node
     */
    private rotationRR(node: Node<T>) {
        // 将节点X置于节点Y
        const tmp = <Node<T>>node.right;
        // 将Y的右子节点置为X的左子节点
        node.right = tmp.left;
        // 将X的左子节点置为Y
        tmp.left = node;
        // 更新节点
        return tmp;
    }

    /**
     * 左右情况: 向右的双旋转, 先向右旋转然后向左旋转
     * @param node
     */
    private rotationLR(node: Node<T>) {
        node.left = this.rotationRR(<Node<T>>node.left);
        return this.rotationLL(node);
    }

    /**
     * 右左情况: 向左的双旋转,先向左旋转然后向右旋转
     * @param node
     */
    private rotationRL(node: Node<T>) {
        node.right = this.rotationLL(<Node<T>>node.right);
        return this.rotationRR(node);
    }

    // 向树AVL树中插入节点
    insert(key: T) {
        this.root = this.insertNode(<Node<T>>this.root, key);
    }

    protected insertNode(node: Node<T>, key: T) {
        if (node == null) {
            return new Node(key);
        } else if (this.compareFn(key, node.key) === Compare.LESS_THAN) {
            node.left = this.insertNode(<Node<T>>node.left, key);
        } else if (this.compareFn(key, node.key) === Compare.BIGGER_THAN) {
            node.right = this.insertNode(<Node<T>>node.right, key);
        } else {
            return node; // 重复的键
        }

        // 计算平衡因子判断树是否需要平衡操作
        const balanceState = this.getBalanceFactor(node);

        // 向左侧子树插入节点后树失衡
        if (balanceState === BalanceFactor.UNBALANCED_LEFT) {
            // 判断插入的键是否小于左侧子节点的键
            if (this.compareFn(key, node.left && <T>node.left.key) === Compare.LESS_THAN) {
                // 小于则进行LL旋转
                node = this.rotationLL(node);
            } else {
                // 否则进行LR旋转
                return this.rotationLR(node);
            }
        }
        // 向右侧子树插入节点后树失衡
        if (balanceState === BalanceFactor.UNBALANCED_RIGHT) {
            // 判断插入的键是否小于右侧子节点的键
            if (this.compareFn(key, node.right && <T>node.right.key) === Compare.BIGGER_THAN) {
                // 小于则进行RR旋转
                node = this.rotationRR(node);
            } else {
                // 否则进行RL旋转
                return this.rotationRL(node);
            }
        }
        // 更新节点
        return node;
    }

    // 移除节点
    protected removeNode(node: Node<T>, key: T) {
        node = <Node<T>>super.removeNode(node, key);
        if (node == null) {
            return node;
        }

        // 获取树的平衡因子
        const balanceState = this.getBalanceFactor(node);
        // 左树失衡
        if (balanceState === BalanceFactor.UNBALANCED_LEFT) {
            // 计算左树的平衡因子
            const balanceFactorLeft = this.getBalanceFactor(<Node<T>>node.left);
            // 左侧子树向左不平衡
            if (balanceFactorLeft === BalanceFactor.BALANCED || balanceFactorLeft === BalanceFactor.UNBALANCED_LEFT) {
                // 进行LL旋转
                return this.rotationLL(node);
            }
            // 右侧子树向右不平衡
            if (balanceFactorLeft === BalanceFactor.SLIGHTLY_UNBALANCED_RIGHT) {
                // 进行LR旋转
                return this.rotationLR(<Node<T>>node.left);
            }
        }
        // 右树失衡
        if (balanceState === BalanceFactor.UNBALANCED_RIGHT) {
            // 计算右侧子树平衡因子
            const balanceFactorRight = this.getBalanceFactor(<Node<T>>node.right);
            // 右侧子树向右不平衡
            if (balanceFactorRight === BalanceFactor.BALANCED || balanceFactorRight === BalanceFactor.SLIGHTLY_UNBALANCED_RIGHT) {
                // 进行RR旋转
                return this.rotationRR(node);
            }
            // 右侧子树向左不平衡
            if (balanceFactorRight === BalanceFactor.SLIGHTLY_UNBALANCED_LEFT) {
                // 进行RL旋转
                return this.rotationRL(<Node<T>>node.right);
            }
        }
        return node;
    }
}