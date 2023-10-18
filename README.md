# marko-lazy
A simple lazy loader for marko components that will only load the component when it's in view
To use: `npm install marko-lazy`
Create a `lazy-renderers.js` file at your project root that looks something like this:
```
export default async function (componentName) {
  switch (componentName) {
    case "myAwesomeWidget":
      return await import("/path/to/myAwesomeWidget.marko");
    case "myAwesomeWidget2":
      return await import("/path/to/myAwesomeWidget2.marko");
  }
}
```
Then, inside a marko file you can use it like this:
`lazy-loader component="myAwesomeWidget" model={foo:"bar"}`
or if you want a loading widget to display you can supply a skeleton like this:
```
lazy-load component="myAwesomeWidget" model={foo:"bar"}
    @skeleton
        div -- loading...
```