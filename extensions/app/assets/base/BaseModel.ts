export type IModel<T> = {
    [P in keyof T]: T[P] extends Function ? 'Model中不能定义方法' : T[P];
};