// It only works with `any`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ReturnTypes<T> = T extends Record<keyof T, (value: any) => any>
  ? {
      [K in keyof T]: ReturnType<T[K]>;
    }
  : never;
