# marko-lazy

A Marko component loader with viewport prefetching, deferred rendering, and
layout-stability controls.

## Installation

```sh
npm install marko-lazy
```

Create a `lazy-renderers.js` file at the root of the consuming project:

```js
export default async function renderLazyComponent(componentName) {
  switch (componentName) {
    case "my-widget":
      return import("./src/components/my-widget.marko");
    case "server-widget":
      return "/lazy-components/server-widget";
    default:
      return null;
  }
}
```

Use the loader in a Marko template:

```marko
lazy-loader component="my-widget" model={ message: "Hello" }
```

## Preventing layout shifts

Lazy rendering is safe only when the page reserves enough room for the loaded
component. Use `layout="stable"` and provide a size contract:

```marko
lazy-loader
  component="my-widget"
  model={ message: "Hello" }
  layout="stable"
  reserveBlockSize="420px"
  @skeleton
    div.skeleton -- Loading…
```

`reserveBlockSize`, `intrinsicSize`, or `aspectRatio` automatically enables
stable layout, so the explicit `layout` input can be omitted:

```marko
lazy-loader
  component="video-card"
  model=input.video
  aspectRatio="16 / 9"
  @skeleton
    div.skeleton
```

The stable layout wrapper remains in the document after loading. This preserves
its minimum height and prevents a shorter loaded component from contracting the
page. If the loaded content is taller than the reserved space, it can still
expand the page, so the reservation should match or exceed the expected size.

For responsive components, use a CSS custom property:

```marko
lazy-loader.recommendedLoader
  component="recommended-rotator"
  reserveBlockSize="var(--recommended-height)"
  @skeleton
    div.skeleton
```

```css
.recommendedLoader {
  --recommended-height: 525px;
}

@media (max-width: 768px) {
  .recommendedLoader {
    --recommended-height: 625px;
  }
}
```

Existing components retain legacy replacement behavior unless stable layout is
enabled. This avoids adding a persistent wrapper to existing layouts during a
minor-version upgrade.

## Prefetch and render stages

The module uses two `IntersectionObserver` instances:

1. At `800px` from the viewport, it imports the component and starts
   `enhanceModel` or server-rendered HTML requests.
2. At `200px` from the viewport, it renders the prepared result.

Both margins are configurable:

```marko
lazy-loader
  component="my-widget"
  prefetchRootMargin="1600px 0px"
  renderRootMargin="800px 0px"
```

`rootMargin` remains an alias for `renderRootMargin`.

Browsers without `IntersectionObserver` use scroll, resize, and focus listeners
with `prefetchBuffer` and `renderBuffer`. The legacy `scrollBuffer` input is an
alias for `renderBuffer`.

## Skeletons

Skeletons remain optional for backward compatibility:

```marko
lazy-loader component="my-widget" model=input.model
  @skeleton
    div.skeleton -- Loading…
```

When `debug=true`, the module warns if an automatically loaded component has no
skeleton or stable size contract.

## Server-rendered structure

When layout stability matters more than deferring the HTML, use server mode.
The content is emitted with the initial response inside the same stable wrapper:

```marko
lazy-loader mode="server" reserveBlockSize="300px"
  @content
    my-widget model=input.model
```

This mode does not import or fetch a lazy renderer. It is useful as a migration
path for structural content that should be server-rendered rather than inserted
while the user scrolls.

## Custom render method

Pass `renderMethod` when a renderer should be resolved without
`lazy-renderers.js`:

```marko
$ const renderMethod = () => import("./my-widget.marko");

lazy-loader
  component="my-widget"
  renderMethod=renderMethod
  model=input.model
  reserveBlockSize="300px"
```

## Enhancing a model

`enhanceModel` sends the current model as JSON in a `POST` request. The response
must contain a `model` property:

```marko
lazy-loader
  component="my-widget"
  model={ id: input.id }
  enhanceModel=`/lazy-models/my-widget/${input.id}`
```

```json
{
  "model": {
    "id": "123",
    "title": "Loaded title"
  }
}
```

Requests time out after 10 seconds by default, are aborted when the component is
destroyed, and retry with exponential backoff. Configure this behavior with
`requestTimeout`, `maxRetries`, and `retryDelay`.

## Server-rendered lazy components

A renderer may return a URL instead of a component module. The loader sends the
model to that URL and renders the returned HTML:

```js
case "server-widget":
  return "/lazy-components/server-widget";
```

Example Express handler:

```js
import serverWidget from "../components/server-widget.marko";

export async function getServerWidget(req, res) {
  const html = await serverWidget.renderToString(req.body);
  res.type("html").send(html);
}
```

## Custom load events

Providing `customLoadEvent` disables automatic viewport loading:

```marko
lazy-loader
  component="share-dialog"
  customLoadEvent="showShareDialog"
  model=input.model
```

```js
document.dispatchEvent(new CustomEvent("showShareDialog"));
```

This is appropriate for dialogs and fixed overlays that do not participate in
normal page flow.

## Errors

Use an error slot for a safe fallback:

```marko
lazy-loader component="my-widget" maxRetries=2
  @skeleton
    div.skeleton -- Loading…
  @error
    p -- This section could not be loaded.
```

## Layout diagnostics

After rendering, the loader compares the reserved and rendered heights. If the
difference exceeds `layoutShiftThreshold` (8px by default), it dispatches:

```text
marko-lazy:layout-change
```

The event detail contains:

```js
{
  component: "my-widget",
  delta: 120,
  renderedHeight: 540,
  reservedHeight: 420,
}
```

Set `debug=true` to also log the mismatch to the console. The event can be used
by browser tests or real-user monitoring without enabling console output.

## Inputs

| Input                   | Default       | Purpose                                                                   |
| ----------------------- | ------------- | ------------------------------------------------------------------------- |
| `component`             | —             | Renderer name; optional only when `mode="server"`.                        |
| `model`                 | —             | Input passed to the loaded component or endpoint.                         |
| `layout`                | `"legacy"`    | Use `"stable"` to retain the layout wrapper.                              |
| `reserveBlockSize`      | —             | Persistent minimum block size; enables stable layout.                     |
| `intrinsicSize`         | —             | Estimated offscreen size for `content-visibility`; enables stable layout. |
| `aspectRatio`           | —             | Reserved aspect ratio; enables stable layout.                             |
| `preserveReservedSpace` | `true`        | Retain the measured skeleton height in stable mode.                       |
| `prefetchRootMargin`    | `"800px 0px"` | Distance at which preparation starts.                                     |
| `renderRootMargin`      | `"200px 0px"` | Distance at which rendering starts.                                       |
| `rootMargin`            | —             | Alias for `renderRootMargin`.                                             |
| `prefetchBuffer`        | `800`         | Non-observer fallback prefetch distance.                                  |
| `renderBuffer`          | `200`         | Non-observer fallback render distance.                                    |
| `scrollBuffer`          | —             | Alias for `renderBuffer`.                                                 |
| `requestTimeout`        | `10000`       | Request timeout in milliseconds.                                          |
| `maxRetries`            | `3`           | Retries after the first failed attempt.                                   |
| `retryDelay`            | `1000`        | Base exponential retry delay in milliseconds.                             |
| `layoutShiftThreshold`  | `8`           | Height delta that emits a diagnostic event.                               |
| `debug`                 | `false`       | Enables development warnings.                                             |

The existing `skeletonContainerClass` and `skeletonContainerStyle` inputs remain
supported. In stable mode they are applied to the persistent root.

## Vite

Exclude `marko-lazy` from dependency optimization so lazy components can
hot-reload:

```js
export default {
  optimizeDeps: {
    exclude: ["marko-lazy"],
  },
};
```
