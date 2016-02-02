import {inject, Container} from 'aurelia-dependency-injection';
import {DOM} from 'aurelia-pal';
import {
  ViewCompiler,
  ViewResources,
  BehaviorInstruction,
  TargetInstruction,
  BoundViewFactory,
  ViewSlot
} from 'aurelia-templating';

let emptyArray = Object.freeze([]);

@inject(Container, ViewCompiler, ViewResources)
export class ComponentRegistry {
  _lookup = {};

  constructor(container, viewCompiler, viewResources) {
    this.container = container;
    this.viewCompiler = viewCompiler;
    this.viewResources = viewResources;
  }

  registerBehavior(behavior, tagName?:string) {
    let proto = this._createWebComponentPrototypeFromBehavior(behavior);
    tagName = this._determineTagName(behavior, tagName);
    this._lookup[tagName] = {
      tagName: tagName,
      behavior: behavior,
      proto: proto
    };

    document.register(tagName, { prototype: proto });
  }

  _determineTagName(behavior, tagName) {
    return tagName || behavior.elementName
  }

  _createWebComponentPrototypeFromBehavior(behavior) {
    let viewResources = this.viewResources;
    let compiler = this.viewCompiler;
    let container = this.container;

    let proto = Object.create(HTMLElement.prototype, {
      createdCallback: {
        value: function() {
          let behaviorInstruction = BehaviorInstruction.element(this, behavior);
          let attributes = this.attributes;
          let children = this._children = [];
          let bindings = this._bindings = [];

          //TODO: processAttributes

          for (let i = 0, ii = attributes.length; i < ii; ++i) {
            attr = attributes[i];
            behaviorInstruction.attributes[attr.name] = attr.value;
          }

          behavior.compile(compiler, viewResources, this, behaviorInstruction, this.parentNode);

          let targetInstruction = TargetInstruction.normal(
            0,
            0,
            [behavior.target],
            [behaviorInstruction],
            emptyArray,
            behaviorInstruction
          );

          let childContainer = createElementContainer(
            container,
            this,
            targetInstruction,
            behaviorInstruction.partReplacements,
            children,
            viewResources
          );

          let controller = behavior.create(childContainer, behaviorInstruction, this, bindings);
          controller.created(null);
        }
      },
      attachedCallback: {
        value: function() {
          this.au.controller.bind();
          this._bindings.forEach(x => x.bind());
          this._children.forEach(x => x.bind());

          this.au.controller.attached();
          this._children.forEach(x => x.attached());
        }
      },
      detachedCallback: {
        value: function() {
          this.au.controller.detached();
          this._children.forEach(x => x.detached());

          this.au.controller.unbind();
          this._bindings.forEach(x => x.unbind());
          this._children.forEach(x => x.unbind());
        }
      },
      attributeChangedCallback: {
        value: function(attrName, oldValue, newValue) {
          let bindable = behavior.attributes[attrName];
          if (bindable) {
            this.au.controller.viewModel[bindable.name] = newValue;
          }
        }
      }
    });

    behavior.properties.forEach(prop => {
      let descriptor = {
        get: function() {
          return this.au.controller.viewModel[prop.name];
        },
        set: function(value) {
          this.au.controller.viewModel[prop.name] = value;
        }
      };

      descriptor.get.getObserver = function(obj) {
        return getObserver(behavior, obj.au.controller.viewModel, prop.name);
      };

      Object.defineProperty(proto, prop.name, descriptor);
    });

    Object.keys(behavior.target.prototype).forEach(key => {
      let value = behavior.target.prototype[key];

      if(typeof value === 'function') {
        proto[key] = function(...args) {
          return this.au.controller.viewModel[key](...args);
        };
      }
    });

    return proto;
  }
}

function getObserver(behavior, instance, name) {
  let lookup = instance.__observers__;

  if (lookup === undefined) {
    if (!behavior.isInitialized) {
      behavior.initialize(Container.instance || new Container(), instance.constructor);
    }

    lookup = behavior.observerLocator.getOrCreateObserversLookup(instance);
    behavior._ensurePropertiesDefined(instance, lookup);
  }

  return lookup[name];
}

function elementContainerGet(key) {
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

function createElementContainer(parent, element, instruction, children, partReplacements, resources) {
  let container = parent.createChild();
  let provider = instruction.providers[0];

  container.element = element;
  container.instruction = instruction;
  container.children = children;
  container.viewResources = resources;
  container.partReplacements = partReplacements;

  container.registerSingleton(provider, provider);

  container.superGet = container.get;
  container.get = elementContainerGet;

  return container;
}
