export type IModel<T> = {
    [P in keyof T]: T[P] extends Function ? '❌👉Model中「不能定义任何方法」, 可以创建ModelManager负责管理Model👈' : T[P];
};