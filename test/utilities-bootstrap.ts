import { Aurelia, PLATFORM, Controller } from 'aurelia-framework';
import { CustomElementRegistry } from '../src/aurelia-web-components';

export interface IBootstrapOptions {
  root: string | Function;
  /**
   * Predefined host, needs to be connected to the document
   * If not defined, will used a newly created element
   */
  host?: HTMLElement;
  /**
   * Global resources used for each aurelia instance
   */
  resources?: Array<string | Function>;
  /**
   * Plugin used for each aurelia instance
   */
  plugins?: any[];
}

/**
 * A bootstrapper utility to bootstrap an aurelia application for integration testing
 *
 * Handles all preparation and disposing steps for tests
 */
export const bootstrapAurelia = async (options: IBootstrapOptions) => {
  const host = options.host || document.body.appendChild(document.createElement('div'));
  const aurelia = new Aurelia();
  // avoid excessive logging behavior everytime an aurelia instance starts
  const methodNames = ['log', 'warn', 'info', 'debug'];
  const fns = methodNames.map(methodName => {
    const fn = (console as Record<string, any>)[methodName];
    (console as Record<string, any>)[methodName] = PLATFORM.noop;
    return fn;
  });
  aurelia.use
    .standardConfiguration()
    .developmentLogging()
    .globalResources(options.resources || []);
  await aurelia.start();
  const ceRegistry: CustomElementRegistry = aurelia.container.get(CustomElementRegistry);
  await aurelia.setRoot(
    options.root,
    host
  );
  // restore logging behavior back to normal
  methodNames.forEach((methodName, idx) => (console as Record<string, any>)[methodName] = fns[idx]);
  return {
    host,
    aurelia,
    registry: ceRegistry,
    dispose: () => {
      const root = (aurelia as any).root as Controller;
      root.unbind();
      root.detached();
      host.remove();
    }
  };
};
