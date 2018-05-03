declare module 'aurelia-web-components' {
  import {
    Container
  } from 'aurelia-dependency-injection';
  import {
    DOM
  } from 'aurelia-pal';
  import {
    ViewCompiler,
    ViewResources,
    BehaviorInstruction,
    TargetInstruction,
    BoundViewFactory,
    ViewSlot
  } from 'aurelia-templating';
  export class ComponentRegistry {
    static inject: any;
    _lookup: any;
    fallbackPrefix: any;
    constructor(container: any, viewCompiler: any, viewResources: any);
    registerAllGlobalElements(): Function[];
    registerBehavior(behavior: any, tagName?: string): Function;
  }
}