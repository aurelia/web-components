import {
  HtmlBehaviorResource,
  BehaviorInstruction,
  TargetInstruction,
  ViewResources,
  ViewSlot,
  BoundViewFactory,
  Controller,
  View,
  ViewCompiler
} from 'aurelia-templating';

import {
  Binding,
  Scope,
  InternalPropertyObserver
} from 'aurelia-binding';

import {
  Container
} from 'aurelia-dependency-injection';

import {
  DOM
} from 'aurelia-pal';

import {
  IGetterFunction
} from './interface';

import {
  definePrototypeGetterSetter,
  defineProperty
} from './utilities';

const emptyArray = Object.freeze([]) as any[];

export const createWebComponentClassFromBehavior = (
  container: Container,
  behavior: HtmlBehaviorResource,
  viewResources: ViewResources,
  compiler: ViewCompiler
) => {

  const CustomElementClass = class extends HTMLElement {

    private _children: View[];
    private _bindings: Binding[];
    private au: { controller: Controller; };

    constructor() {
      super();

      const behaviorInstruction = BehaviorInstruction.element(this, behavior);
      const attributes = this.attributes;
      const children = this._children = [];
      const bindings = this._bindings = [];

      behavior.processAttributes(compiler, viewResources, this, attributes, behaviorInstruction);

      for (let i = 0, ii = attributes.length; i < ii; ++i) {
        const attr = attributes[i];
        behaviorInstruction.attributes[attr.name] = attr.value;
      }

      behavior.compile(compiler, viewResources, this, behaviorInstruction, this.parentNode);

      const targetInstruction = TargetInstruction.normal(
        0,
        0,
        [behavior.target],
        [behaviorInstruction],
        /*no expression*/emptyArray,
        behaviorInstruction
      );

      const childContainer = createElementContainer(
        container,
        this,
        targetInstruction,
        children,
        behaviorInstruction.partReplacements,
        viewResources
      );

      const controller = behavior.create(childContainer, behaviorInstruction, this, bindings);
      controller.created(null);
    }

    connectedCallback(): void {
      let scope = { bindingContext: this, overrideContext: {} } as Scope;
      this.au.controller.bind(scope);
      this._bindings.forEach(x => x.bind(scope));
      this._children.forEach(x => x.bind(scope.bindingContext, scope.overrideContext, true));

      this.au.controller.attached();
      this._children.forEach(x => x.attached());
    }

    disconnectedCallback(): void {
      this.au.controller.detached();
      this._children.forEach(x => x.detached());

      this.au.controller.unbind();
      this._bindings.forEach(x => x.unbind());
      this._children.forEach(x => x.unbind());
    }

    attributeChangedCallback(attrName: string, oldValue: string, newValue: string): void {
      const bindable = behavior.attributes[attrName];
      if (bindable !== undefined) {
        this.au.controller.viewModel[bindable.name] = newValue;
      }
    }
  };

  const CustomElementViewModelClass = behavior.target;
  const proto = CustomElementClass.prototype;
  const observedAttributes: string[] = [];

  behavior.properties.forEach(bindableProperty => {

    const getterFn = function () {
      return this.au.controller.viewModel[bindableProperty.name];
    } as IGetterFunction;

    getterFn.getObserver = function(obj: any) {
      return getObserver(container, behavior, obj.au.controller.viewModel, bindableProperty.name);
    };

    definePrototypeGetterSetter(
      proto,
      bindableProperty.name,
      getterFn,
      function (value: unknown) {
        this.au.controller.viewModel[bindableProperty.name] = value;
      }
    );

    observedAttributes.push(bindableProperty.attribute);
  });

  defineProperty(CustomElementClass, 'observedAttributes', {
    get: () => observedAttributes
  });

  // Object
  //   .keys(CustomElementViewModelClass.prototype)
  //   .forEach(key => {
  //     const descriptor = Reflect.getOwnPropertyDescriptor(CustomElementViewModelClass.prototype, key);
  //     if (typeof descriptor.value === 'function') {
  //       proto[key] = function (...args: any[]) {
  //         return this.au.controller.viewModel[key](...args);
  //       };
  //     }
  //   });

  return CustomElementClass;
};

const getObserver = (
  container: Container,
  behavior: HtmlBehaviorResource,
  instance: object & { __observers__: any; },
  name: string
): InternalPropertyObserver => {
  let lookup = instance.__observers__;

  if (lookup === undefined) {
    if (!behavior.isInitialized) {
      behavior.initialize(container, instance.constructor);
    }

    lookup = behavior.observerLocator.getOrCreateObserversLookup(instance);
    behavior._ensurePropertiesDefined(instance, lookup);
  }

  return lookup[name];
};

function elementContainerGet(this: Container, key: any): any {
  if (key === DOM.Element) {
    return this.element;
  }

  if (key === BoundViewFactory) {
    if (this.boundViewFactory) {
      return this.boundViewFactory;
    }

    let factory = this.instruction.viewFactory;
    let partReplacements = this.partReplacements;

    if (partReplacements) {
      factory = partReplacements[factory.part] || factory;
    }

    this.boundViewFactory = new BoundViewFactory(this, factory, partReplacements);
    return this.boundViewFactory;
  }

  if (key === ViewSlot) {
    if (this.viewSlot === undefined) {
      this.viewSlot = new ViewSlot(this.element, this.instruction.anchorIsContainer);
      this.element.isContentProjectionSource = this.instruction.lifting;
      this.children.push(this.viewSlot);
    }

    return this.viewSlot;
  }

  if (key === ViewResources) {
    return this.viewResources;
  }

  if (key === TargetInstruction) {
    return this.instruction;
  }

  return this.superGet(key);
}

const createElementContainer = (
  parent: Container,
  element: Element,
  instruction: TargetInstruction,
  children: View[],
  partReplacements: Record<string, any>,
  resources: ViewResources
): Container => {
  const container = parent.createChild();
  const provider = instruction.providers[0];

  container.element = element as Element & { isContentProjectionSource: boolean };
  container.instruction = instruction;
  container.children = children;
  container.viewResources = resources;
  container.partReplacements = partReplacements;

  container.registerSingleton(provider, provider);

  container.superGet = container.get;
  container.get = elementContainerGet;

  return container;
};
