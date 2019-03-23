import {
  ObserverLocator,
  InternalPropertyObserver
} from 'aurelia-binding';

import {
  HtmlBehaviorResource,
  ViewCompiler,
  BehaviorInstruction,
  BindableProperty,
  ViewResources,
  TargetInstruction,
  View,
  ViewSlot,
  BoundViewFactory
} from 'aurelia-templating';

/**@internal */
declare module 'aurelia-dependency-injection' {
  interface Container {

    element: Node & { isContentProjectionSource: boolean };
    instruction: TargetInstruction;
    children: (View | ViewSlot)[];
    viewResources: ViewResources;
    partReplacements: Record<string, any>;

    superGet: Container['get'];

    boundViewFactory: BoundViewFactory;
    viewSlot: ViewSlot;
  }
}

/**@internal */
declare module 'aurelia-binding' {
  interface ObserverLocator {
    getOrCreateObserversLookup(instance: object): Record<string, any>;
  }
}

/**@internal */
declare module 'aurelia-templating' {
  interface BindableProperty {
    name: string;
    attribute: string;
  }
  interface HtmlBehaviorResource {
    isInitialized: boolean;
    observerLocator: ObserverLocator;
    elementName: string;
    attributeName: string;
    processAttributes(
      compiler: ViewCompiler,
      viewResources: ViewResources,
      target: any, attributes: NamedNodeMap,
      behaviorInstruction: BehaviorInstruction
    ): void;
    properties: BindableProperty[];
    attributes: Record<string, BindableProperty>;
    target: Function;

    _ensurePropertiesDefined(instance: object, lookup: Record<string, any>): void;
  }
  interface ViewResources {
    elements: Record<string, HtmlBehaviorResource>;
    attributes: Record<string, HtmlBehaviorResource>;
  }

  interface ViewFactory {
    part: any;
  }
}

export interface ICustomElementInfo {
  tagName: string;
  behavior: HtmlBehaviorResource;
  classDefinition: Function;
}

export interface IGetterFunction {
  (): any;
  getObserver?(obj: any): InternalPropertyObserver;
}

export interface ICustomElementViewModelConstructor extends Function {
  is: string;
}

export interface ICustomHtmlRegistry {
  /**
   * Register a class as a custom html component: element/attribute
   */
  register(behavior: Function): void;

  /**
   * Returns `true` if the registry has given behavior registered
   */
  has(behavior: Function): boolean;

}
