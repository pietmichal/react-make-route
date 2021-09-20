// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ReturnNullableStrings<T> = T extends Record<keyof T, any>
  ? {
      [K in keyof T]: string | null;
    }
  : never;
