# marko-lazy
A simple lazy loader for marko components that will only load the component when it's in view  
To use: `npm install marko-lazy`  
Create a `lazy-renderers.js` file at your project root that looks something like this:  
```
export default async function (componentName) {
  switch (componentName) {
    case "myAwesomeWidget":
      return await import("./path/to/myAwesomeWidget.marko"); //client side rendering is better for complex items with state
    case "myAwesomeWidget2":
      return "/path/to/ssr/of/myAwesomeWidget2.marko"; //server side rendering is better for simple items
  }
}
```
Then, inside a marko file you can use it like this:  
`lazy-loader component="myAwesomeWidget" model={foo:"bar"}`  
### @skeleton (optional)
If you want a placeholder loading widget to display you can supply a skeleton like this:  
```
lazy-loader component="myAwesomeWidget" model={foo:"bar"}
    @skeleton
        div -- loading...
```

### renderMethod (optional)
Alternatively you can use the `renderMethod` prop to pass in a function that resolves to the component. (*Note: this may not work as expected in the root component*)
```
$ let renderMethod = async () => {
  return await import('./path/to/myAwesomeWidget.marko')
}
lazy-loader component="myAwesomeWidget" model={foo:"bar"} renderMethod=renderMethod
  @skeleton
    div -- loading...
```
### enhanceModel (optional)
Pass a url to the `enhanceModel` property to have the lazy-loader fetch data from your server that gets appended to the model before attempting to render it.
```
lazy-loader component="myAwesomeWidget" model={foo:"bar"} enhanceModel="/path/to/data"
```
### customLoadEvent (optional)
If the customLoadEvent property is set, then view-based lazy loading will be disabled and it will instead attach a listener to the custom load event.  
Example:  
```
lazy-loader component="pop-up" customLoadEvent="myFormSubmit" model={foo:"bar"}

//^that would only render when the myFormSubmit event is fired elsewhere in code like this:

document.dispatchEvent(new CustomEvent("myFormSubmit"));
```
### vite config note
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

### example code for server-side rendering of a single marko component in express
```
import icon from '../path/to/icon.marko'
const lazyComponents = {
    "icon":icon
}
export const getHTMLComponent = async(req,res)=>{
  let model = req.body || {};
	let componentName = String(req.params.componentName).replace(/[^0-9A-Za-z\-\_\/\?\.]/g,'');
    if(typeof lazyComponents[componentName] == "undefined") return res.json({error:"invalid component"});
    let html = await new Promise((resolve) => {
        lazyComponents[componentName].renderToString(model, (err, result) => {
            if(err) console.log(err);
            resolve(result)
        });
    });
    res.set('Content-Type', 'text/html');
    res.send(html);
}
```

note:  
this project seemed to work best with node v18, your mileage may vary with older node versions.
