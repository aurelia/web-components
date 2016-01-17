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
          behavior.compile(compiler, viewResources, this, instruction, this.parentNode);
          //TODO: read initial attr values into the instruction.attributes

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
          //lookup bindable by attr name and send value through
        }
      }
    });

    //proxy methods (without _) and bindable properties to view model

    return proto;
  }
}
