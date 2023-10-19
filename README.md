# marko-lazy
A simple lazy loader for marko components that will only load the component when it's in view  
To use: `npm install marko-lazy`  
Create a `lazy-renderers.js` file at your project root that looks something like this:  
```
export default async function (componentName) {
  switch (componentName) {
    case "myAwesomeWidget":
      return await import("./path/to/myAwesomeWidget.marko");
    case "myAwesomeWidget2":
      return await import("./path/to/myAwesomeWidget2.marko");
  }
}
```
Then, inside a marko file you can use it like this:  
`lazy-loader component="myAwesomeWidget" model={foo:"bar"}`  
or if you want a loading widget to display you can supply a skeleton like this:  
```
lazy-loader component="myAwesomeWidget" model={foo:"bar"}
    @skeleton
        div -- loading...
```


Alternatively you can use the `renderMethod` prop to pass in a function that resolves to the component. (*Note: this may not work as expected in the root component*)
```
$ let renderMethod = async () => {
  return await import('./path/to/myAwesomeWidget.marko')
}
lazy-loader component="myAwesomeWidget" model={foo:"bar"} renderMethod=renderMethod
  @skeleton
    div -- loading...
```

Pass a url to the `enhanceModel` prop to have the lazy-loader fetch data from your server that gets appended to the model.
```
lazy-loader component="myAwesomeWidget" model={foo:"bar"} enhanceModel="/path/to/data"
```

To allow lazy loaded components to hot-reload, exclude marko-lazy from the optimized dependency list in your vite config.  
```
import { defineConfig } from "vite";
export default defineConfig({
    ...
    optimizeDeps: {
        exclude: ["marko-lazy"],
    }
});
```

note:  
this seemed to work best with node v18, your mileage may vary with older node versions.
