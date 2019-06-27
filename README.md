# web-components

[![npm Version](https://img.shields.io/npm/v/aurelia-web-components.svg)](https://www.npmjs.com/package/aurelia-web-components)
[![Join the chat at https://gitter.im/aurelia/discuss](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/aurelia/discuss?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

This library is part of the [Aurelia](http://www.aurelia.io/) platform and contains a plugin capable of transforming Aurelia components into standards-compliant Web Components.

> To keep up to date on [Aurelia](http://www.aurelia.io/), please visit and subscribe to [the official blog](http://aurelia.io/blog) and [our email list](http://eepurl.com/ces50j). We also invite you to [follow us on twitter](https://twitter.com/aureliaeffect). If you have questions, please [join our community on Gitter](https://gitter.im/aurelia/discuss) or use [stack overflow](http://stackoverflow.com/search?q=aurelia). Documentation can be found [in our developer hub](http://aurelia.io/docs).

## Platform Support

This library can be used in the **browser**.

## Usage

Here's an example configuration for main.js to show how to convert all global custom elements into web components:

```JavaScript
import { CustomElementRegistry } from 'aurelia-web-components';

export function configure(aurelia) {
   aurelia.use
     .standardConfiguration()
     .developmentLogging()
     .globalResources('resources/my-component');

   aurelia
     .start()
     .then(() => {
      const registry = aurelia.container.get(CustomElementRegistry);

      //The following line takes all global resource custom elements and registers them as web components.
      //Once the element is registered, in-page elements will begin rendering.
      registry.useGlobalElements();
    });
 }
```

> Warning: Note that calling `.useGlobalElements()` will remove all global elements from your global resources, including `<router-view>` and `<compose>`.


Alternatively, custom elements can also be registered on the fly:

```JavaScript
import { InlineViewStrategy, useView } from 'aurelia-templating';
import { CustomElementRegistry } from 'aurelia-web-components';

export function configure(aurelia) {
   aurelia.use
     .standardConfiguration()
     .developmentLogging()
     .globalResources('resources/my-component');

   aurelia
     .start()
     .then(() => {
      const registry = aurelia.container.get(CustomElementRegistry);

      // the following register 
      return registry.register(class MyButton {

        static $view = `<template>
          <button>\${icon}<slot></slot></button>
        </template>`

        @bindable icon
      });
     })
     // or
     .then(() => {
      const registry = aurelia.container.get(CustomElementRegistry);

      // with useView path strategy & globalResource
      @useView('path/to/view.html')
      class MyCarousel {
        // ...
      }
      aurelia.use.globalResources(MyCarousel);

      // the following register 
      return Promise.all([
        // with static view strategy
        registry.register(class MyButton {

          static $view = `<template>
            <button>\${icon}<slot></slot></button>
          </template>`

          // ...
        }),
        // with a pre-defined view-model class that has already been registered using aurelia.globalResources(MyCarousel)
        registry.register(MyCarousel)
      ]);
     })
     .then(() => {
       aurelia.setRoot('app')
     });
 }
```

> Note: This plugin requires that your browser have native support for the CustomElements v1 spec or that you have configured a v1 spec-compliant polyfill prior to calling registry methods.

### Extending Built-In Elements

One nice feature of web-components custom elements is that you can extend built-in html elements, such as: button, input etc... and enable the following usage:

```html
<button is=my-custom-button>...</button>
```

To extends built-in html element, add `extends` to your view model class, with the value of built-in element that you would like to extend, an example:

```js
  class MyButton {

    static extends = 'button';
    static $view = '<template>my button ${icon}</template>';

    @bindable icon;
  }

  await registry.register(MyButton2);
```
And then, you can do

```js
element.innerHTML = '<button is=my-button icon=♥></button>'
```

It will render something like this:
```html
<button is=my-button icon=♥>my button ♥</button>
```

`button` is not the only thing you can extend, imagine textarea, paragraph, div and more.

### Usage With Webpack

Web components require the es6/es2015 constructor call type to be used rather than es5 or earlier function prototype-based calls.
In order to use this plugin with webpack, ensure the `dist` configuration of the `AureliaPlugin` is set to `es2015` or later in `webpack.config.js`

```js
module.exports = ({...} = {}) => ({
  ...
  plugins: [
    ....
    new AureliaPlugin({
      dist: 'es2015'
    }),
  ]
});
```

## Building The Code

To build the code, follow these steps.

1. Ensure that [NodeJS](http://nodejs.org/) is installed. This provides the platform on which the build tooling runs.
2. From the project folder, execute the following command:

  ```shell
  npm install
  ```
3. To build the code, you can now run:

  ```shell
  npm run build
  ```
5. You will find the compiled code in the `dist` folder, available in module formats: UMD, AMD, CommonJS and ES6.

## Running The Tests

To run the unit tests, first ensure that you have followed the steps above in order to install all dependencies and successfully build the library. Once you have done that, proceed with these additional steps:

1. You can now run the tests with this command:

  ```shell
  npm test
  ```


## How it works

* Each of custom element will be backed by a view model.
* For each view model class, a corresponding native custom element class will be created and defined, with the name derived from metadata and fallbacks to view model class name. If there is no hyphen `-` in the name of a custom element view model, a prefix (`au-` by default) will be added to the name. This can be change in `CustomElementRegistry` instance.
* Slot: By default, content projection is done using Aurelia slot emulation. This is to keep it consistent with the rest of Aurelia ecosystem. To use native slot/shadow dom for content projection, decorate view model class with `@useShadowDOM`.
* To comply with Custom element v1 specs, the element created by by Aurelia when calling `document.createElement` is empty until an attribute is modified or the element is added to a document. Specifically, the child elements are not created until the `connectedCallback` or `attributeChangedCallback` hooks are triggered.
