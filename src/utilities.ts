import { HtmlBehaviorResource } from 'aurelia-templating';

export const defineProperty = Reflect.defineProperty;
export const tagNameOf = (behavior: HtmlBehaviorResource) => behavior.elementName || behavior.target.name;

const sharedPropertyDescriptor = {
  enumerable: false,
  configurable: true,
  get: undefined,
  set: undefined
} as PropertyDescriptor;

export const definePrototypeGetterSetter = <T extends object = object>(obj: T, propertyName: string, getter: () => any, setter: (val: any) => any): T => {
  sharedPropertyDescriptor.get = getter;
  sharedPropertyDescriptor.set = setter;
  defineProperty(obj, propertyName, sharedPropertyDescriptor);
  sharedPropertyDescriptor.get = sharedPropertyDescriptor.set = undefined;
  return obj;
};

const hyphenateCache = {};
const capitalMatcher = /([A-Z])/g;

const addHyphenAndLower = (char: string): string => {
  return '-' + char.toLowerCase();
};

export const hyphenate = (name: string): string => {
  const result = hyphenateCache[name];
  if (result !== undefined) {
    return result;
  }
  return hyphenateCache[name] = (name.charAt(0).toLowerCase() + name.slice(1)).replace(capitalMatcher, addHyphenAndLower);
};
