import { useHistory, useParams, Route, RouteProps } from "react-router-dom";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function makeRoute<
  PathType extends string,
  ParamsType extends Record<keyof ParamsType, () => string | number>
>(data: { path: PathType; params?: ParamsType }) {
  const { path, params: definedParams = {} } = data;

  function useRoute() {
    function usePath(
      providedParams?: Partial<Record<keyof ParamsType, string | number>>
    ): string {
      const routerParams = useParams<{ [key: string]: string }>();

      if (!providedParams) {
        return path;
      }

      // FIXME: Make TS happier, it should know that param is keyof ParamsType.
      const paramsToUse = Object.fromEntries(
        // TODO: Use mapper
        Object.entries(definedParams).map(([param]) => {
          const value =
            (providedParams[param as keyof ParamsType] as string | number) ||
            routerParams[param];
          return [param, String(value)];
        })
      );

      let newPath: string = path;
      Object.entries(paramsToUse).forEach(([param, value]) => {
        newPath = newPath.replace(":" + param, String(value));
      });

      return newPath;
    }

    function go(
      providedParams: Partial<Record<keyof ParamsType, string | number>>
    ): void {
      const path = usePath(providedParams);
      const history = useHistory();
      history.push(path);
    }

    return {
      usePath,
      go,
    };
  }

  function RouteWithPath(props: Omit<RouteProps, "path">): JSX.Element {
    return <Route path={path} {...props} />;
  }

  return [useRoute, RouteWithPath] as const;
}
