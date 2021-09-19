import { useHistory, useParams, Route, RouteProps } from "react-router-dom";
import { ReturnStrings } from "./utilities/ReturnStrings";
import { ReturnTypes } from "./utilities/ReturnTypes";

interface MakeRouteData<ParamsInputType, ParamsOutputType> {
  path: string;
  paramsMappings: {
    in?: Partial<ParamsInputType>;
    out: ParamsOutputType;
  };
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function makeRoute<
  ParamsInputType extends {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [K in keyof ParamsInputType]: (input: any) => string;
  },
  ParamsOutputType extends {
    [K in keyof ParamsOutputType]: (input: string) => unknown;
  }
>(data: MakeRouteData<ParamsInputType, ParamsOutputType>) {
  const {
    path,
    paramsMappings: { in: inMappings, out: outMappings },
  } = data;

  function useRoute() {
    const history = useHistory();
    const routerParams = useParams<{ [key: string]: string }>();

    const currentRouteParams = Object.fromEntries(
      Object.entries(outMappings).map((entry) => {
        const [param] = entry;
        const value = routerParams[param];

        // FIXME: This shouldn't error. It should be possible to use this hook if you want to navigate from one route to another.
        if (!value) {
          throw new Error(
            `Route param ${param} not found! Make sure that you are using this hook within dedicated route.`
          );
        }

        return [param, value] as [keyof ParamsOutputType, string];
      })
    ) as ReturnStrings<ParamsOutputType>;

    const outParams = Object.fromEntries(
      Object.entries(currentRouteParams).map((entry) => {
        const [param, value] = entry as [keyof ParamsOutputType, string];
        const mapper = outMappings[param];
        return [param, mapper(value)];
      })
    ) as ReturnTypes<ParamsOutputType>;

    function createPath(providedParams: Partial<ReturnTypes<ParamsOutputType>> = {}): string {
      const inParams = Object.fromEntries(
        Object.entries(currentRouteParams).map((entry) => {
          const [param] = entry as [keyof ParamsOutputType, string];
          const providedValue = providedParams[param as keyof ParamsOutputType];

          if (providedValue) {
            const inMapping = inMappings?.[param as unknown as keyof ParamsInputType];

            if (inMapping) {
              return [param, inMapping(providedValue)];
            }

            return [param, providedValue];
          }

          return entry;
        })
      ) as ReturnStrings<ParamsOutputType>;

      let newPath = path;
      Object.entries(inParams).forEach(([param, value]) => {
        newPath = newPath.replace(":" + param, String(value));
      });

      return newPath;
    }

    function go(providedParams: Partial<ReturnTypes<ParamsOutputType>> = {}): void {
      const path = createPath(providedParams);
      history.push(path);
    }

    return {
      params: outParams,
      createPath,
      go,
    };
  }

  function RouteWithPath(props: Omit<RouteProps, "path">): JSX.Element {
    return <Route path={path} {...props} />;
  }

  return [useRoute, RouteWithPath] as const;
}
