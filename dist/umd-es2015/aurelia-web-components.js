(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('aurelia-dependency-injection'), require('aurelia-templating'), require('aurelia-pal'), require('aurelia-metadata')) :
  typeof define === 'function' && define.amd ? define(['exports', 'aurelia-dependency-injection', 'aurelia-templating', 'aurelia-pal', 'aurelia-metadata'], factory) :
  (global = global || self, factory((global.au = global.au || {}, global.au.webComponents = {}), global.au, global.au, global.au, global.au));
}(this, function (exports, aureliaDependencyInjection, aureliaTemplating, aureliaPal, aureliaMetadata) { 'use strict';

  const defineProperty = Reflect.defineProperty;
  const tagNameOf = (behavior) => behavior.elementName || behavior.target.name;
  const sharedPropertyDescriptor = {
      enumerable: false,
      configurable: true,
      get: undefined,
      set: undefined
  };
  const definePrototypeGetterSetter = (obj, propertyName, getter, setter) => {
      sharedPropertyDescriptor.get = getter;
      sharedPropertyDescriptor.set = setter;
      defineProperty(obj, propertyName, sharedPropertyDescriptor);
      sharedPropertyDescriptor.get = sharedPropertyDescriptor.set = undefined;
      return obj;
  };

  const emptyArray = Object.freeze([]);
  const createWebComponentClassFromBehavior = (container, behavior, viewResources, compiler) => {
      const CustomElementClass = class extends HTMLElement {
          constructor() {
              super();
              const behaviorInstruction = aureliaTemplating.BehaviorInstruction.element(this, behavior);
              const attributes = this.attributes;
              const children = this._children = [];
              const bindings = this._bindings = [];
              behavior.processAttributes(compiler, viewResources, this, attributes, behaviorInstruction);
              for (let i = 0, ii = attributes.length; i < ii; ++i) {
                  const attr = attributes[i];
                  behaviorInstruction.attributes[attr.name] = attr.value;
              }
              behavior.compile(compiler, viewResources, this, behaviorInstruction, this.parentNode);
              const targetInstruction = aureliaTemplating.TargetInstruction.normal(0, 0, [behavior.target], [behaviorInstruction], emptyArray, behaviorInstruction);
              const childContainer = createElementContainer(container, this, targetInstruction, children, behaviorInstruction.partReplacements, viewResources);
              const controller = behavior.create(childContainer, behaviorInstruction, this, bindings);
              controller.created(null);
          }
          connectedCallback() {
              let scope = { bindingContext: this, overrideContext: {} };
              this.au.controller.bind(scope);
              this._bindings.forEach(x => x.bind(scope));
              this._children.forEach(x => x.bind(scope.bindingContext, scope.overrideContext, true));
              this.au.controller.attached();
              this._children.forEach(x => x.attached());
          }
          disconnectedCallback() {
              this.au.controller.detached();
              this._children.forEach(x => x.detached());
              this.au.controller.unbind();
              this._bindings.forEach(x => x.unbind());
              this._children.forEach(x => x.unbind());
          }
          attributeChangedCallback(attrName, oldValue, newValue) {
              const bindable = behavior.attributes[attrName];
              if (bindable !== undefined) {
                  this.au.controller.viewModel[bindable.name] = newValue;
              }
          }
      };
      const CustomElementViewModelClass = behavior.target;
      const proto = CustomElementClass.prototype;
      const observedAttributes = [];
      behavior.properties.forEach(bindableProperty => {
          const getterFn = function () {
              return this.au.controller.viewModel[bindableProperty.name];
          };
          getterFn.getObserver = function (obj) {
              return getObserver(container, behavior, obj.au.controller.viewModel, bindableProperty.name);
          };
          definePrototypeGetterSetter(proto, bindableProperty.name, getterFn, function (value) {
              this.au.controller.viewModel[bindableProperty.name] = value;
          });
          observedAttributes.push(bindableProperty.attribute);
      });
      defineProperty(CustomElementClass, 'observedAttributes', {
          get: () => observedAttributes
      });
      return CustomElementClass;
  };
  const getObserver = (container, behavior, instance, name) => {
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
  function elementContainerGet(key) {
      if (key === aureliaPal.DOM.Element) {
          return this.element;
      }
      if (key === aureliaTemplating.BoundViewFactory) {
          if (this.boundViewFactory) {
              return this.boundViewFactory;
          }
          let factory = this.instruction.viewFactory;
          let partReplacements = this.partReplacements;
          if (partReplacements) {
              factory = partReplacements[factory.part] || factory;
          }
          this.boundViewFactory = new aureliaTemplating.BoundViewFactory(this, factory, partReplacements);
          return this.boundViewFactory;
      }
      if (key === aureliaTemplating.ViewSlot) {
          if (this.viewSlot === undefined) {
              this.viewSlot = new aureliaTemplating.ViewSlot(this.element, this.instruction.anchorIsContainer);
              this.element.isContentProjectionSource = this.instruction.lifting;
              this.children.push(this.viewSlot);
          }
          return this.viewSlot;
      }
      if (key === aureliaTemplating.ViewResources) {
          return this.viewResources;
      }
      if (key === aureliaTemplating.TargetInstruction) {
          return this.instruction;
      }
      return this.superGet(key);
  }
  const createElementContainer = (parent, element, instruction, children, partReplacements, resources) => {
      const container = parent.createChild();
      const provider = instruction.providers[0];
      container.element = element;
      container.instruction = instruction;
      container.children = children;
      container.viewResources = resources;
      container.partReplacements = partReplacements;
      container.registerSingleton(provider, provider);
      container.superGet = container.get;
      container.get = elementContainerGet;
      return container;
  };

  class CustomElementRegistry {
      constructor(container, viewCompiler, viewResources) {
          this.fallbackPrefix = 'au-';
          this._lookup = Object.create(null);
          this.container = container;
          this.viewCompiler = viewCompiler;
          this.viewResources = viewResources;
      }
      useGlobalElements() {
          const viewResources = this.viewResources;
          const elements = viewResources.elements;
          viewResources.elements = Object.create(null);
          return Object.keys(elements).map(tagName => {
              const behavior = elements[tagName];
              return this.registerBehavior(behavior, tagName).classDefinition;
          });
      }
      registerBehavior(behavior, tagName) {
          const classDefinition = createWebComponentClassFromBehavior(this.container, behavior, this.viewResources, this.viewCompiler);
          tagName = tagName || tagNameOf(behavior);
          const info = this._lookup[tagName] = {
              tagName: tagName,
              behavior: behavior,
              classDefinition: classDefinition
          };
          if (tagName.indexOf('-') === -1) {
              tagName = this.fallbackPrefix + tagName;
          }
          customElements.define(tagName, classDefinition);
          return info;
      }
      register(Type) {
          let htmlBehaviorResource = aureliaMetadata.metadata.get(aureliaMetadata.metadata.resource, Type);
          if (htmlBehaviorResource) {
              aureliaTemplating.ViewResources.convention(Type, htmlBehaviorResource);
          }
          else {
              htmlBehaviorResource = aureliaTemplating.ViewResources.convention(Type);
          }
          if (!(htmlBehaviorResource instanceof aureliaTemplating.HtmlBehaviorResource) || htmlBehaviorResource.elementName === null) {
              throw new Error(`class ${Type.name} is already associated with a different type of resource. Cannot register as a custom element.`);
          }
          const customElementInfo = this.registerBehavior(htmlBehaviorResource, Type['is']);
          return htmlBehaviorResource
              .load(this.container, Type)
              .then(() => customElementInfo.classDefinition);
      }
      has(Type) {
          let htmlBehaviorResource = aureliaMetadata.metadata.get(aureliaMetadata.metadata.resource, Type);
          if (!htmlBehaviorResource || !(htmlBehaviorResource instanceof aureliaTemplating.HtmlBehaviorResource)) {
              return false;
          }
          return this._lookup[tagNameOf(htmlBehaviorResource)] !== undefined;
      }
  }
  CustomElementRegistry.inject = [aureliaDependencyInjection.Container, aureliaTemplating.ViewCompiler, aureliaTemplating.ViewResources];

  exports.CustomElementRegistry = CustomElementRegistry;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=aurelia-web-components.js.map
