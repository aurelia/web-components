import { Container } from 'aurelia-dependency-injection';
import { ViewCompiler, ViewResources } from 'aurelia-templating';

export interface ICustomHtmlRegistry {
	/**
	 * Register a class as a custom html component: element/attribute
	 * @returns Mapped class of view model class to be used as custom element/custom attribute
	 */
	register(behavior: Function): Promise<Function>;
	/**
	 * Returns `true` if the registry has given behavior registered
	 */
	has(behavior: Function): boolean;
}
export declare class CustomElementRegistry implements ICustomHtmlRegistry {
	static inject: (typeof Container | typeof ViewResources | typeof ViewCompiler)[];
	/**
	 * Custom element name must have hyphen. With custom elements that do not have, prefix with `au-`
	 */
	fallbackPrefix: string;
	mandatoryPrefix: boolean;
	constructor(container: Container, viewCompiler: ViewCompiler, viewResources: ViewResources);
	/**
	 * Use all global elements from current view resources and define them as native custom element
	 */
	useGlobalElements(): Function[];
	register(Type: Function): Promise<Function>;
	has(Type: Function): boolean;
}