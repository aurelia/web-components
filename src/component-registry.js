import {inject, Container} from 'aurelia-dependency-injection';
import {ViewCompiler, ViewResources, BehaviorInstruction} from 'aurelia-templating';

@inject(Container, ViewCompiler, ViewResources)
export class ComponentRegistry {
  _lookup = {};

  constructor(container, viewCompiler, viewResources) {
    this.container = container;
    this.viewCompiler = viewCompiler;
    this.viewResources = viewResources;
  }

  register(behavior, tagName?:string) {
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
          let instruction = BehaviorInstruction.element(this, behavior);
          let attributes = this.attributes;

          for (let i = 0, ii = attributes.length; i < ii; ++i) {
            attr = attributes[i];
            instruction.attributes[attr.name] = attr.value;
          }

          behavior.compile(compiler, viewResources, this, instruction, this.parentNode);

          let childContainer = container.createChild();
          //TODO: set up container with local entities

          let controller = behavior.create(childContainer, instruction, this)
          controller.created(null);
        }
      },
      attachedCallback: {
        value: function() {
          this.au.controller.bind();
          this.au.controller.attached();
        }
      },
      detachedCallback: {
        value: function() {
          this.au.controller.detached();
          this.au.controller.unbind();
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
