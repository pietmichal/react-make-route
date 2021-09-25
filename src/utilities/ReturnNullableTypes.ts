// It only works with `any`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ReturnNullableTypes<T> = T extends Record<keyof T, (value: any) => any>
  ? {
      [K in keyof T]: ReturnType<T[K]> | null;
    }
  : never;
