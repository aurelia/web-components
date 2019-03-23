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
