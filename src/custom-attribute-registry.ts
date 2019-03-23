import { ICustomHtmlRegistry } from './interface';

export class CustomAttributeRegistry implements ICustomHtmlRegistry {

  register(behavior: Function): void {
    throw new Error('Method not implemented.');
  }

  unregister(behavior: Function): boolean {
    throw new Error('Method not implemented.');
  }
  has(behavior: Function): boolean {
    throw new Error('Method not implemented.');
  }

}
