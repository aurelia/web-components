import { Container } from 'aurelia-dependency-injection';
import { HtmlBehaviorResource, ViewCompiler, ViewResources, ViewFactory } from 'aurelia-templating';
import { createWebComponentClassFromBehavior } from './custom-element-utilities';
import './interface';
import { ICustomElementInfo, ICustomHtmlRegistry } from './interface';
import { tagNameOf, hyphenate } from './utilities';
import { metadata } from 'aurelia-metadata';

export class CustomElementRegistry implements ICustomHtmlRegistry {

  static inject = [Container, ViewCompiler, ViewResources];

  /**
   * Custom element name must have hyphen. With custom elements that do not have, prefix with `au-`
   */
  fallbackPrefix: string;
  forcePrefix: boolean;

  /**@internal */
  private _lookup: Record<string, ICustomElementInfo>;

  /**@internal */
  private container: Container;

  /**@internal */
  private viewCompiler: ViewCompiler;

  /**@internal */
  private viewResources: ViewResources;

  constructor(container: Container, viewCompiler: ViewCompiler, viewResources: ViewResources) {
    this.fallbackPrefix = 'au-';
    this.forcePrefix = false;
    this._lookup = Object.create(null);
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
      return this.registerBehavior(behavior, tagName).classDefinition;
    });
  }

  /**@internal */
  registerBehavior(behavior: HtmlBehaviorResource, tagName?: string): ICustomElementInfo {
    const classDefinition = createWebComponentClassFromBehavior(
      this.container,
      behavior,
      this.viewResources,
      this.viewCompiler
    );
    tagName = tagName || tagNameOf(behavior);

    const info: ICustomElementInfo = this._lookup[tagName] = {
      tagName: tagName,
      behavior: behavior,
      classDefinition: classDefinition
    };

    if ((this.forcePrefix && !tagName.startsWith(this.fallbackPrefix) )|| tagName.indexOf('-') === -1)  {
      tagName = this.fallbackPrefix + tagName;
    }

    const args: [string, Function, ElementDefinitionOptions?] = [tagName, classDefinition];
    const extensionBase = classDefinition.$extends;
    if (extensionBase) {
      args.push({ extends: extensionBase });
    }
    customElements.define(...args);

    return info;
  }

  register(Type: Function): Promise<Function> {
    let htmlBehaviorResource = metadata.get(metadata.resource, Type) as HtmlBehaviorResource;
    // validating metadata
    if (htmlBehaviorResource) {
      ViewResources.convention(Type, htmlBehaviorResource);
    }
    else {
      htmlBehaviorResource = ViewResources.convention(Type) as HtmlBehaviorResource;
    }

    // after running static convetion and there's nothing applied
    // check if it's a valid html behavior resource
    if (!(htmlBehaviorResource instanceof HtmlBehaviorResource) || htmlBehaviorResource.attributeName !== null) {
      throw new Error(`class ${Type.name} is already associated with a different type of resource. Cannot register as a custom element.`);
    }
    else {
      htmlBehaviorResource.elementName = htmlBehaviorResource.elementName || hyphenate(Type.name);
    }

    htmlBehaviorResource.target = Type;
    const customElementInfo = this.registerBehavior(htmlBehaviorResource, Type['is']);
    return htmlBehaviorResource
      .load(this.container, Type)
      .then(() => customElementInfo.classDefinition);
  }

  has(Type: Function): boolean {
    let htmlBehaviorResource = metadata.get(metadata.resource, Type) as HtmlBehaviorResource;
    if (!htmlBehaviorResource || !(htmlBehaviorResource instanceof HtmlBehaviorResource)) {
      return false;
    }
    return this._lookup[tagNameOf(htmlBehaviorResource)] !== undefined;
  }
}
