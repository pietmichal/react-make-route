# react-make-route

![GitHub package.json version](https://img.shields.io/github/package-json/v/pietmichal/react-make-route?style=for-the-badge)

> <h1>:warning: Work in progress. Feedback is welcome!</h1> 
> API will become stable after releasing version 1.0.0.

## The Problem

Using React Router in larger apps requires a lot of repetition when dealing with parameters and types what forces developers to create their own abstraction.

## The Solution

`react-make-style` brings an abstraction for common React Router operations and interactions.

## Features

- TypeScript support out of the box.
- `makeRoute` function producing a hook providing means to interact with a specific route in the following ways:
  - parameters retrieval
  - query parameters retrieval
  - parameters and query parameters inheritance
  - path creation
  - navigation  

## Installation

For NPM users:

`npm install react-make-route`

For Yarn users:

`yarn add react-make-route`

## Basic Example

Create routes and navigate between them.

```jsx
import { BrowserRouter, Switch, Link } from "react-router-dom";
import { makeRoute } from "react-make-route";

const [useInitialRoute, initialRoutePath] = makeRoute({ path: "/" });

const [useAboutRoute, aboutRoutePath] = makeRoute({ path: "/about" });

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path={aboutRoutePath}>
          <About />
        </Route>
        <Route path={initialRoutePath}>
          <Initial />
        </Route>
      </Switch>
    </BrowserRouter>
  );
}

function Initial() {
  const aboutRoute = useAboutRoute();
  return <Link to={aboutRoute.createPath()}>Go to about page</Link>
}

function About() {
  const initialRoute = useInitialRoute();
  return <Link to={initialRoute.createPath()}>Go to initial page</Link>
}
```

## Advanced Example

Create route with mappings. Retrieve params and query params. Create paths and utilise inheritance.

```jsx
import { BrowserRouter, Switch, Link, Route } from "react-router-dom";
import { makeRoute } from "react-make-route";

const [useBlogPostRoute, blogPostRoutePath] = makeRoute({
  path: "/posts/:postId",
  paramsMappings: { 
    in: { postId: String } 
    out: { postId: Number } 
  },
  queryParamsMappings: {
    in: { showComments: (input) => input ? "true" : "false" }
    out: { showComments: (input) => input === "true" ? true : false }
  }
});

function App() {
  return (
    <BrowserRouter>
      <Switch>
        <Route path={blogPostRoutePath}>
          <BlogPost />
        </Route>
      </Switch>
    </BrowserRouter>
  );
}

function BlogPost() {
  const blogPostRoute = useBlogPostRoute();

  // `postId` is a number because of mapping provided in `makeRoute` function!
  const { postId } = blogPostRoute.getParams();

  // `showComments` is a boolean or undefined
  const { showComments } = blogPostRoute.getQueryParams();

  const nextPostPath = exampleRoute.createPath({ postId: postId + 1 });
  const previousPostPath = exampleRoute.createPath({ postId: postId - 1 });

  return (
    <>
      <h1>Blog post id: {postId}</h1>
      <Link to={previousPostPath}>Go to previous post</Link> or <Link to={nextPostPath}>go to next post</Link>
      <div>
        { /* `.go(params, queryParams)` navigates to the route programatically */ }
        <button onClick={() => blogPostRoute.go({}, { showComments: true })}>
          show comments
        </button>
      </div>
      <div>
        { /* providing `null` disables inheritance */ }
        <button onClick={() => blogPostRoute.go({}, { showComments: null })}>
          hide comments
        </button>
      </div>
    </>
  );
}
```