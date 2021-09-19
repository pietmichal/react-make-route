import { makeRoute } from "./makeRoute";
import { render, screen, act } from "@testing-library/react";
import { Router, MemoryRouter } from "react-router-dom";
import { createMemoryHistory } from "history";
import { renderHook } from "@testing-library/react-hooks";
import { ReactNode } from "react";

describe("makeRoute", () => {
  test("outputs a hook and route component tuple", () => {
    const output = makeRoute({ path: "/hello" });
    expect(output).toHaveLength(2);
    expect(output[0]).toBeDefined();
    expect(output[1]).toBeDefined();
  });
});

describe("route component", () => {
  test("returned route component matches path defined during creation", () => {
    const [, TestRoute] = makeRoute({ path: "/test-path" });

    const history = createMemoryHistory();

    render(
      <Router history={history}>
        <TestRoute>content</TestRoute>
      </Router>
    );

    expect(screen.queryByText("content")).toBeFalsy();

    act(() => history.push("/test-path"));
    expect(screen.queryByText("content")).toBeTruthy();
  });
});

describe("hook", () => {
  describe("createPath", () => {
    test("allows path creation from provided params", () => {
      const [useCommentRoute] = makeRoute({
        path: "/posts/:postId/comments/:commentId",
        params: { postId: Number, commentId: Number },
      });

      const wrapper = (props: { children: ReactNode }) => (
        <MemoryRouter>{props.children}</MemoryRouter>
      );

      const { result } = renderHook(() => useCommentRoute(), { wrapper });
      expect(result.current.createPath({ postId: 9001, commentId: 1337 })).toBe(
        "/posts/9001/comments/1337"
      );
    });

    test("inhertis params from the current route when creating path without providing all params", () => {
      const [useCommentRoute, CommentRoute] = makeRoute({
        path: "/posts/:postId/comments/:commentId",
        params: { postId: Number, commentId: Number },
      });

      const wrapper = (props: { children: ReactNode }) => (
        <MemoryRouter initialEntries={["/posts/100/comments/200"]}>
          <CommentRoute>{props.children}</CommentRoute>
        </MemoryRouter>
      );

      const { result } = renderHook(() => useCommentRoute(), { wrapper });

      expect(result.current.createPath({ commentId: 1337 })).toBe(
        "/posts/100/comments/1337"
      );
      expect(result.current.createPath({ postId: 1337 })).toBe(
        "/posts/1337/comments/200"
      );
      expect(result.current.createPath({})).toBe("/posts/100/comments/200");
      expect(result.current.createPath()).toBe("/posts/100/comments/200");
    });
  });

  describe("go", () => {
    test("navigates to path with provided params", () => {
      const history = createMemoryHistory({
        initialEntries: ["/posts/100/comments/200"],
      });

      const [useCommentRoute, CommentRoute] = makeRoute({
        path: "/posts/:postId/comments/:commentId",
        params: { postId: Number, commentId: Number },
      });

      const wrapper = (props: { children: ReactNode }) => (
        <Router history={history}>
          <CommentRoute>{props.children}</CommentRoute>
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

      const [useCommentRoute, CommentRoute] = makeRoute({
        path: "/posts/:postId/comments/:commentId",
        params: { postId: Number, commentId: Number },
      });

      const wrapper = (props: { children: ReactNode }) => (
        <Router history={history}>
          <CommentRoute>{props.children}</CommentRoute>
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
  });
});
