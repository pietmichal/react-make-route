import { makeRoute } from "./makeRoute";
import { Router, MemoryRouter, Route } from "react-router-dom";
import { createMemoryHistory } from "history";
import { renderHook, act } from "@testing-library/react-hooks";
import { ReactNode } from "react";

test("outputs a hook and path tuple", () => {
  const output = makeRoute({ path: "/hello" });
  expect(output).toHaveLength(2);
  expect(output[0]).toBeDefined();
  expect(output[1]).toBe("/hello");
});

describe("path creation", () => {
  test("allows path creation from provided params", () => {
    const [useCommentRoute, commentRoutePath] = makeRoute({
      path: "/posts/:postId/comments/:commentId",
      paramsMappings: { out: { postId: Number, commentId: Number } },
    });

    const wrapper = (props: { children: ReactNode }) => (
      <MemoryRouter initialEntries={["/posts/1/comments/1"]}>
        <Route path={commentRoutePath}>{props.children}</Route>
      </MemoryRouter>
    );

    const { result } = renderHook(() => useCommentRoute(), { wrapper });
    expect(result.current.createPath({ postId: 9001, commentId: 1337 })).toBe("/posts/9001/comments/1337");
  });

  test("inhertis params from the current route when creating path without providing all params", () => {
    const [useCommentRoute, commentRoutePath] = makeRoute({
      path: "/posts/:postId/comments/:commentId",
      paramsMappings: { out: { postId: Number, commentId: Number } },
    });

    const wrapper = (props: { children: ReactNode }) => (
      <MemoryRouter initialEntries={["/posts/100/comments/200"]}>
        <Route path={commentRoutePath}>{props.children}</Route>
      </MemoryRouter>
    );

    const { result } = renderHook(() => useCommentRoute(), { wrapper });

    expect(result.current.createPath({ commentId: 1337 })).toBe("/posts/100/comments/1337");
    expect(result.current.createPath({ postId: 1337 })).toBe("/posts/1337/comments/200");
    expect(result.current.createPath({})).toBe("/posts/100/comments/200");
    expect(result.current.createPath()).toBe("/posts/100/comments/200");
  });

  test("allows path creation from provided params and query params", () => {
    const [useCommentRoute, commentRoutePath] = makeRoute({
      path: "/posts/:postId/comments/:commentId",
      paramsMappings: { out: { postId: Number, commentId: Number } },
      queryParamsMappings: { out: { hideComments: Boolean } },
    });

    const wrapper = (props: { children: ReactNode }) => (
      <MemoryRouter initialEntries={["/posts/1/comments/1"]}>
        <Route path={commentRoutePath}>{props.children}</Route>
      </MemoryRouter>
    );

    const { result } = renderHook(() => useCommentRoute(), { wrapper });
    expect(result.current.createPath({ postId: 9001, commentId: 1337 }, { hideComments: true })).toBe(
      "/posts/9001/comments/1337?hideComments=true"
    );
  });

  test("path inherits query params", () => {
    const [useCommentRoute, commentRoutePath] = makeRoute({
      path: "/posts/:postId/comments/:commentId",
      paramsMappings: { out: { postId: Number, commentId: Number } },
      queryParamsMappings: { out: { hideComments: Boolean } },
    });

    const wrapper = (props: { children: ReactNode }) => (
      <MemoryRouter initialEntries={["/posts/1/comments/1?hideComments=false"]}>
        <Route path={commentRoutePath}>{props.children}</Route>
      </MemoryRouter>
    );

    const { result } = renderHook(() => useCommentRoute(), { wrapper });
    expect(result.current.createPath({ postId: 9001, commentId: 1337 })).toBe(
      "/posts/9001/comments/1337?hideComments=false"
    );
  });

  test("path does not inherit query param if `null` is provided", () => {
    const [useCommentRoute, commentRoutePath] = makeRoute({
      path: "/posts/:postId/comments/:commentId",
      paramsMappings: { out: { postId: Number, commentId: Number } },
      queryParamsMappings: { out: { hideComments: (input: string) => (input === "true" ? true : false) } },
    });

    const wrapper = (props: { children: ReactNode }) => (
      <MemoryRouter initialEntries={["/posts/1/comments/1?hideComments=false"]}>
        <Route path={commentRoutePath}>{props.children}</Route>
      </MemoryRouter>
    );

    const { result } = renderHook(() => useCommentRoute(), { wrapper });
    expect(result.current.createPath({ postId: 9001, commentId: 1337 }, { hideComments: null })).toBe(
      "/posts/9001/comments/1337"
    );
  });

  test("path does not include query param if value is falsy", () => {
    const [useCommentRoute, commentRoutePath] = makeRoute({
      path: "/posts/:postId/comments/:commentId",
      paramsMappings: { out: { postId: Number, commentId: Number } },
      queryParamsMappings: { out: { text: String } },
    });

    const wrapper = (props: { children: ReactNode }) => (
      <MemoryRouter initialEntries={["/posts/1/comments/1?text="]}>
        <Route path={commentRoutePath}>{props.children}</Route>
      </MemoryRouter>
    );

    const { result } = renderHook(() => useCommentRoute(), { wrapper });
    expect(result.current.createPath({ postId: 9001, commentId: 1337 })).toBe("/posts/9001/comments/1337");
  });

  test("query params are mapped", () => {
    const [useCommentRoute, commentRoutePath] = makeRoute({
      path: "/posts/:postId/comments/:commentId",
      paramsMappings: { out: { postId: Number, commentId: Number } },
      queryParamsMappings: { in: { text: (input: string) => input + "9001" }, out: { text: String } },
    });

    const wrapper = (props: { children: ReactNode }) => (
      <MemoryRouter initialEntries={["/posts/1/comments/1"]}>
        <Route path={commentRoutePath}>{props.children}</Route>
      </MemoryRouter>
    );

    const { result } = renderHook(() => useCommentRoute(), { wrapper });
    expect(result.current.createPath({}, { text: "hello" })).toBe("/posts/1/comments/1?text=hello9001");
  });
});

describe("navigation", () => {
  test("navigates to path with provided params", () => {
    const history = createMemoryHistory({
      initialEntries: ["/posts/100/comments/200"],
    });

    const [useCommentRoute, commentRoutePath] = makeRoute({
      path: "/posts/:postId/comments/:commentId",
      paramsMappings: { out: { postId: Number, commentId: Number } },
    });

    const wrapper = (props: { children: ReactNode }) => (
      <Router history={history}>
        <Route path={commentRoutePath}>{props.children}</Route>
      </Router>
    );

    const { result } = renderHook(() => useCommentRoute(), { wrapper });
    expect(history.location.pathname).toBe("/posts/100/comments/200");

    act(() => result.current.go({ postId: 1, commentId: 2 }));
    expect(history.location.pathname).toBe("/posts/1/comments/2");

    act(() => result.current.go({ postId: 9001, commentId: 9002 }));
    expect(history.location.pathname).toBe("/posts/9001/comments/9002");
  });

  test("navigation inherits params from current route when not all params are provided", () => {
    const history = createMemoryHistory({
      initialEntries: ["/posts/100/comments/200"],
    });

    const [useCommentRoute, commentRoutePath] = makeRoute({
      path: "/posts/:postId/comments/:commentId",
      paramsMappings: { out: { postId: Number, commentId: Number } },
    });

    const wrapper = (props: { children: ReactNode }) => (
      <Router history={history}>
        <Route path={commentRoutePath}>{props.children}</Route>
      </Router>
    );

    const { result } = renderHook(() => useCommentRoute(), { wrapper });
    expect(history.location.pathname).toBe("/posts/100/comments/200");

    act(() => result.current.go({ postId: 1 }));
    expect(history.location.pathname).toBe("/posts/1/comments/200");

    act(() => result.current.go({ commentId: 1 }));
    expect(history.location.pathname).toBe("/posts/1/comments/1");

    act(() => result.current.go({}));
    expect(history.location.pathname).toBe("/posts/1/comments/1");
  });

  test("navigation uses param mappings provided during creation", () => {
    const history = createMemoryHistory({
      initialEntries: ["/posts/100/comments/200aaa"],
    });

    const [useCommentRoute, commentRoutePath] = makeRoute({
      path: "/posts/:postId/comments/:commentId",
      paramsMappings: {
        in: { commentId: (input: number) => String(input) + "aaa" },
        out: { postId: Number, commentId: Number },
      },
    });

    const wrapper = (props: { children: ReactNode }) => (
      <Router history={history}>
        <Route path={commentRoutePath}>{props.children}</Route>
      </Router>
    );

    const { result } = renderHook(() => useCommentRoute(), { wrapper });
    expect(history.location.pathname).toBe("/posts/100/comments/200aaa");

    act(() => result.current.go({ postId: 1 }));
    expect(history.location.pathname).toBe("/posts/1/comments/200aaa");

    act(() => result.current.go({ commentId: 1 }));
    expect(history.location.pathname).toBe("/posts/1/comments/1aaa");

    act(() => result.current.go({}));
    expect(history.location.pathname).toBe("/posts/1/comments/1aaa");
  });

  test("outputs mapped params from the current path", () => {
    const [useCommentRoute, commentRoutePath] = makeRoute({
      path: "/users/:username/posts/:postId/comments/:commentId",
      paramsMappings: {
        out: { username: (input: string) => input.toUpperCase(), postId: Number, commentId: String },
      },
    });

    const wrapper = (props: { children: ReactNode }) => (
      <MemoryRouter initialEntries={["/users/foobar/posts/100/comments/200"]}>
        <Route path={commentRoutePath}>{props.children}</Route>
      </MemoryRouter>
    );

    const { result } = renderHook(() => useCommentRoute(), { wrapper });

    expect(result.current.getParams()).toEqual({
      username: "FOOBAR",
      postId: 100,
      commentId: "200",
    });
  });
});

describe("params retrieval", () => {
  test("params retrieval throws an error when used within incompatible route", () => {
    const [useCommentRoute, commentRoutePath] = makeRoute({
      path: "/users/:username/posts/:postId/comments/:commentId",
      paramsMappings: {
        out: { username: (input: string) => input.toUpperCase(), postId: Number, commentId: String },
      },
    });

    const wrapper = (props: { children: ReactNode }) => (
      <MemoryRouter initialEntries={["/posts/100/comments/200"]}>
        <Route path={commentRoutePath}>{props.children}</Route>
      </MemoryRouter>
    );

    const { result } = renderHook(() => useCommentRoute(), { wrapper });

    expect(() => result.current.getParams()).toThrowError();
  });

  test("params retrieval throws an error when used within incompatible route", () => {
    const [useCommentRoute, commentRoutePath] = makeRoute({
      path: "/users/:username/posts/:postId/comments/:commentId",
      paramsMappings: {
        out: { username: (input: string) => input.toUpperCase(), postId: Number, commentId: String },
      },
    });

    const wrapper = (props: { children: ReactNode }) => (
      <MemoryRouter initialEntries={["/posts/100/comments/200"]}>
        <Route path={commentRoutePath}>{props.children}</Route>
      </MemoryRouter>
    );

    const { result } = renderHook(() => useCommentRoute(), { wrapper });

    expect(() => result.current.getParams()).toThrowError();
  });
});
