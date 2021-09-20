# react-make-route

⚠️⚠️⚠️ This library haven't reached stable release yet! ⚠️⚠️⚠️

## Links

- [Documentation]()
- [Introductory blog post]()

## The Problem

React Router is narrowly focused. This requires developers to create their own abstractions to reduce repeatedness and enforce behavioral consistency in larger applications.

## The Solution

`react-make-style` introduces its own conventions allowing developers to focus on actual functionality of their applications. No more worrying about maintaing your routing abstraction.

## Features

- `makeRoute` creates a route hook and route component based on provided data.
- Route params and search params accept **in** and **out** mappings. Developers don't have to worry about having correct data in their components.
- Created hook allows to create path, get params and navigate to the route. 
- Fully bound to React's lifecycle to ensure consistency no matter how the router is configured.
- Params and search params, by convention, are inherited from the current route. No need to get and validate params every single time you want to do anything related to routing. Search params can be forced to not to be inherited.
- Written in TypeScript. No need to provide generics every single time you try to access params.

## Basic Example

```jsx
import { BrowserRouter, Switch, NavLink } from "react-router-dom";
import { makeRoute } from "react-make-route";

const [useBlogPostRoute, BlogPostRoute] = makeRoute({
  path: "/posts/:postId",
  paramsMappings: { out: { postId: Number } },
});

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <BlogPostRoute>
          <BlogPost />
        </BlogPostRoute>
      </Switch>
    </BrowserRouter>
  );
}

function BlogPost() {
  const exampleRoute = useExampleRoute();
  const nextPostPath = exampleRoute.createPath({ postId: exampleRoute.params.postId + 1 });

  return (
    <>
      <div>Blog post id: {exampleRoute.getParams().postId}</div>
      <div>
        <NavLink to={nextPostPath}>Next post</NavLink>
      </div>
      <button onClick={() => exampleRoute.go({ postId: 0 })}>go to first post</button>
    </>
  );
}

```

For more advanced examples and detailed explanation, [check the documentation]()!

## Contributors