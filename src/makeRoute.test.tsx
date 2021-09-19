import { makeRoute } from "./makeRoute";
import { render, screen, act } from "@testing-library/react";
import { Router } from "react-router-dom";
import { createMemoryHistory } from "history";

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
