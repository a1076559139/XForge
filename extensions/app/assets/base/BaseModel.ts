// export type IModel<T> = {
//     [P in keyof T]: T[P] extends Function
//     ? '❌此处不能定义任何方法'
//     : (
//         T[P] extends Array<infer R>
//         ? (
//             R extends Function
//             ? '❌此处不能定义任何方法'
//             : T[P]
//         )
//         : T[P] // IModel<T[P]> 性能消耗大
//     );
// };

// export type IStore<T> = {
//     [P in keyof T]: T[P] extends Function
//     ? T[P]
//     : (
//         T[P] extends Array<infer R>
//         ? (
//             R extends Function
//             ? '❌此处不能定义任何方法'
//             : IModel<T[P]>
//         )
//         : IModel<T[P]>
//     );
// };

export type IModel<T> = {
    [P in keyof T]: T[P] extends Function
    ? '❌此处不能定义任何方法'
    : T[P];
};

// export type IStore<T> = {
//     [P in keyof T]: T[P] extends Function
//     ? T[P]
//     : IModel<T[P]>;
// };

export type IStore<T> = {
    [P in keyof T]: T[P];
};