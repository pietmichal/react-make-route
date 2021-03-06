import { useHistory, useParams, useLocation } from "react-router-dom";
import { ReturnNullableStrings } from "./utilities/ReturnNullableStrings";
import { ReturnNullableTypes } from "./utilities/ReturnNullableTypes";
import { ReturnStrings } from "./utilities/ReturnStrings";
import { ReturnTypes } from "./utilities/ReturnTypes";

interface MakeRouteData<ParamsInputType, ParamsOutputType, QueryParamsInputType, QueryParamsOutputType> {
  path: string;
  paramsMappings?: {
    in?: Partial<ParamsInputType>;
    out: ParamsOutputType;
  };
  queryParamsMappings?: {
    in?: QueryParamsInputType;
    out: QueryParamsOutputType;
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
  },
  QueryParamsInputType extends {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [K in keyof QueryParamsInputType]: (input: any) => string;
  },
  QueryParamsOutputType extends {
    [K in keyof QueryParamsOutputType]: (input: string) => unknown;
  }
>(data: MakeRouteData<ParamsInputType, ParamsOutputType, QueryParamsInputType, QueryParamsOutputType>) {
  const {
    path,
    paramsMappings: { in: inParamMappings, out: outParamMappings } = { out: {} as ParamsOutputType },
    queryParamsMappings: { out: outQueryParamMappings } = {
      out: {} as QueryParamsOutputType,
    },
  } = data;

  function useRoute() {
    const history = useHistory();
    const routerParams = useParams<{ [key: string]: string }>();
    const routerQueryParams = Object.fromEntries(new URLSearchParams(useLocation().search).entries());

    const currentRouteParams = Object.fromEntries(
      Object.entries(outParamMappings).map((entry) => {
        const [param] = entry;
        const value = routerParams[param];
        return [param, value] as [keyof ParamsOutputType, string | null];
      })
    ) as ReturnNullableStrings<ParamsOutputType>;

    const currentRouteQueryParams = Object.fromEntries(
      Object.entries(outQueryParamMappings)
        .map((entry) => {
          const [param] = entry;
          const value = routerQueryParams[param];
          return [param, value] as [keyof QueryParamsOutputType, string | null];
        })
        .filter((entry) => !!entry[1])
    ) as ReturnStrings<ParamsOutputType>;

    function createPath(
      providedParams: Partial<ReturnTypes<ParamsOutputType>> = {},
      providedQueryParams: Partial<ReturnNullableTypes<QueryParamsOutputType>> = {}
    ): string {
      const inParams = Object.fromEntries(
        Object.entries(currentRouteParams).map((entry) => {
          const [param] = entry as [keyof ParamsOutputType, string];
          const providedValue = providedParams[param as keyof ParamsOutputType];

          if (providedValue) {
            const inMapping = inParamMappings?.[param as unknown as keyof ParamsInputType];

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

      // FIXME
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const queryParams = new URLSearchParams({
        ...routerQueryParams,
        ...Object.fromEntries(
          Object.entries(providedQueryParams).map(([key, value]) => {
            const inMapping = data.queryParamsMappings?.in?.[key as keyof QueryParamsInputType];

            if (inMapping) {
              return [key, inMapping(value)];
            }

            return [key, value];
          })
        ),
      });

      queryParams.forEach((value, key) => {
        if (!value || value === "null") {
          queryParams.delete(key);
        }
      });

      const pathQueryParams = queryParams.toString().length > 0 ? "?" + queryParams.toString() : "";

      return newPath + pathQueryParams;
    }

    function go(
      providedParams: Partial<ReturnTypes<ParamsOutputType>> = {},
      providedQueryParams: Partial<ReturnNullableTypes<QueryParamsOutputType>> = {}
    ): void {
      const path = createPath(providedParams, providedQueryParams);
      history.push(path);
    }

    function getParams() {
      return Object.fromEntries(
        Object.entries(currentRouteParams).map((entry) => {
          const [param, value] = entry as [keyof ParamsOutputType, string | null];

          if (!value) {
            throw new Error(`Expected a value for param ${param}`);
          }

          const mapper = outParamMappings[param];
          return [param, mapper(value)];
        })
      ) as ReturnTypes<ParamsOutputType>;
    }

    function getQueryParams() {
      return Object.fromEntries(
        Object.entries(currentRouteQueryParams).map((entry) => {
          const [param, value] = entry as [keyof QueryParamsOutputType, string];

          const mapper = outQueryParamMappings[param];
          return [param, mapper(value)];
        })
      ) as ReturnTypes<QueryParamsOutputType>;
    }

    return {
      getParams,
      getQueryParams,
      createPath,
      go,
    };
  }

  return [useRoute, path] as const;
}
