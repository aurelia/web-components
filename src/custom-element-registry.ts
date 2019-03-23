import { Container } from 'aurelia-dependency-injection';
import { HtmlBehaviorResource, ViewCompiler, ViewResources } from 'aurelia-templating';
import { createWebComponentClassFromBehavior } from './custom-element-utilities';
import './interface';
import { ICustomElementInfo, ICustomHtmlRegistry } from './interface';
import { tagNameOf } from './utilities';
import { metadata } from 'aurelia-metadata';

export class CustomElementRegistry implements ICustomHtmlRegistry {

  static inject = [Container, ViewCompiler, ViewResources];

  /**
   * Custom element name must have hyphen. With custom elements that do not have, prefix with `au-`
   */
  fallbackPrefix: string;

  private _lookup: Record<string, ICustomElementInfo> = {};
  private container: Container;
  private viewCompiler: ViewCompiler;
  private viewResources: ViewResources;

  constructor(container: Container, viewCompiler: ViewCompiler, viewResources: ViewResources) {
    this.fallbackPrefix = 'au-';
    this.container = container;
    this.viewCompiler = viewCompiler;
    this.viewResources = viewResources;
  }

  /**
   * Use all global elements from current view resources and define them as native custom element
   */
  useGlobalElements(): Function[] {
    const viewResources = this.viewResources;
    // store reference to all existing global resources
    const elements = viewResources.elements;
    // remove all global element resources
    viewResources.elements = Object.create(null);

    return Object.keys(elements).map(tagName => {
      const behavior = elements[tagName];
      return this.registerBehavior(behavior, tagName);
    });
  }

  /**@internal */
  registerBehavior(behavior: HtmlBehaviorResource, tagName?: string): Function {
    const classDefinition = createWebComponentClassFromBehavior(
      this.container,
      behavior,
      this.viewResources,
      this.viewCompiler
    );
    tagName = tagName || tagNameOf(behavior);

    this._lookup[tagName] = {
      tagName: tagName,
      behavior: behavior,
      classDefinition: classDefinition
    };

    if (tagName.indexOf('-') === -1) {
      tagName = this.fallbackPrefix + tagName;
    }

    customElements.define(tagName, classDefinition);

    return classDefinition;
  }

  register(Type: Function): Function {
    let htmlBehaviorResource = metadata.get(metadata.resource, Type) as HtmlBehaviorResource;
    // validating metadata
    if (htmlBehaviorResource) {
      ViewResources.convention(Type, htmlBehaviorResource);
    } else {
      htmlBehaviorResource = ViewResources.convention(Type) as HtmlBehaviorResource;
    }
    if (!(htmlBehaviorResource instanceof HtmlBehaviorResource)) {
      throw new Error(`class ${Type.name} is already associated with different type of resource. Cannot register as custom element.`);
    }
    return this.registerBehavior(htmlBehaviorResource, Type['is']);
  }

  has(Type: Function): boolean {
    let htmlBehaviorResource = metadata.get(metadata.resource, Type) as HtmlBehaviorResource;
    if (!htmlBehaviorResource || !(htmlBehaviorResource instanceof HtmlBehaviorResource)) {
      return false;
    }
    return this._lookup[tagNameOf(htmlBehaviorResource)] !== undefined;
  }
}
