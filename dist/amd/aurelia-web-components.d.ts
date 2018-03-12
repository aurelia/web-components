declare module 'aurelia-web-components' {
  import {
    inject,
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
    _lookup: any;
    constructor(container: any, viewCompiler: any, viewResources: any);
    registerAllGlobalElements(): Function[];
    registerBehavior(behavior: any, tagName?: string): Function;
  }
}