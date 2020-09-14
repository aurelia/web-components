(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('aurelia-dependency-injection'), require('aurelia-templating'), require('aurelia-pal'), require('aurelia-metadata')) :
    typeof define === 'function' && define.amd ? define(['exports', 'aurelia-dependency-injection', 'aurelia-templating', 'aurelia-pal', 'aurelia-metadata'], factory) :
    (global = global || self, factory((global.au = global.au || {}, global.au.webComponents = {}), global.au, global.au, global.au, global.au));
}(this, function (exports, aureliaDependencyInjection, aureliaTemplating, aureliaPal, aureliaMetadata) { 'use strict';

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation. All rights reserved.
    Licensed under the Apache License, Version 2.0 (the "License"); you may not use
    this file except in compliance with the License. You may obtain a copy of the
    License at http://www.apache.org/licenses/LICENSE-2.0

    THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
    KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
    WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
    MERCHANTABLITY OR NON-INFRINGEMENT.

    See the Apache Version 2.0 License for specific language governing permissions
    and limitations under the License.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var defineProperty = Reflect.defineProperty;
    var tagNameOf = function (behavior) { return behavior.elementName || behavior.target.name; };
    var sharedPropertyDescriptor = {
        enumerable: false,
        configurable: true,
        get: undefined,
        set: undefined
    };
    var definePrototypeGetterSetter = function (obj, propertyName, getter, setter) {
        sharedPropertyDescriptor.get = getter;
        sharedPropertyDescriptor.set = setter;
        defineProperty(obj, propertyName, sharedPropertyDescriptor);
        sharedPropertyDescriptor.get = sharedPropertyDescriptor.set = undefined;
        return obj;
    };

    var emptyArray = Object.freeze([]);
    var createWebComponentClassFromBehavior = function (container, behavior, viewResources, compiler) {
        var CustomElementClass = (function (_super) {
            __extends(class_1, _super);
            function class_1() {
                var _this = _super.call(this) || this;
                _this.initialized = false;
                return _this;
            }
            class_1.prototype.auInit = function () {
                if (this.initialized) {
                    return;
                }
                this.initialized = true;
                var behaviorInstruction = aureliaTemplating.BehaviorInstruction.element(this, behavior);
                var attributes = this.attributes;
                var children = this._children = [];
                var bindings = this._bindings = [];
                behavior.processAttributes(compiler, viewResources, this, attributes, behaviorInstruction);
                for (var i = 0, ii = attributes.length; i < ii; ++i) {
                    var attr = attributes[i];
                    behaviorInstruction.attributes[attr.name] = attr.value;
                }
                behavior.compile(compiler, viewResources, this, behaviorInstruction, this.parentNode);
                var targetInstruction = aureliaTemplating.TargetInstruction.normal(0, 0, [behavior.target], [behaviorInstruction], emptyArray, behaviorInstruction);
                var childContainer = createElementContainer(container, this, targetInstruction, children, behaviorInstruction.partReplacements, viewResources);
                var controller = behavior.create(childContainer, behaviorInstruction, this, bindings);
                controller.created(null);
            };
            class_1.prototype.connectedCallback = function () {
                this.auInit();
                var scope = { bindingContext: this, overrideContext: {} };
                this.au.controller.bind(scope);
                this._bindings.forEach(function (x) { return x.bind(scope); });
                this._children.forEach(function (x) { return x.bind(scope.bindingContext, scope.overrideContext, true); });
                this.au.controller.attached();
                this._children.forEach(function (x) { return x.attached(); });
            };
            class_1.prototype.disconnectedCallback = function () {
                this.au.controller.detached();
                this._children.forEach(function (x) { return x.detached(); });
                this.au.controller.unbind();
                this._bindings.forEach(function (x) { return x.unbind(); });
                this._children.forEach(function (x) { return x.unbind(); });
            };
            class_1.prototype.attributeChangedCallback = function (attrName, oldValue, newValue) {
                this.auInit();
                var bindable = behavior.attributes[attrName];
                if (bindable !== undefined) {
                    this.au.controller.viewModel[bindable.name] = newValue;
                }
            };
            return class_1;
        }(HTMLElement));
        var CustomElementViewModelClass = behavior.target;
        var proto = CustomElementClass.prototype;
        var observedAttributes = [];
        behavior.properties.forEach(function (bindableProperty) {
            var getterFn = function () {
                return this.au.controller.viewModel[bindableProperty.name];
            };
            getterFn.getObserver = function (obj) {
                return getObserver(container, behavior, obj.au.controller.viewModel, bindableProperty.name);
            };
            definePrototypeGetterSetter(proto, bindableProperty.name, getterFn, function (value) {
                this.au.controller.viewModel[bindableProperty.name] = value;
            });
            observedAttributes.push(bindableProperty.attribute);
        });
        defineProperty(CustomElementClass, 'observedAttributes', {
            get: function () { return observedAttributes; }
        });
        return CustomElementClass;
    };
    var getObserver = function (container, behavior, instance, name) {
        var lookup = instance.__observers__;
        if (lookup === undefined) {
            if (!behavior.isInitialized) {
                behavior.initialize(container, instance.constructor);
            }
            lookup = behavior.observerLocator.getOrCreateObserversLookup(instance);
            behavior._ensurePropertiesDefined(instance, lookup);
        }
        return lookup[name];
    };
    function elementContainerGet(key) {
        if (key === aureliaPal.DOM.Element) {
            return this.element;
        }
        if (key === aureliaTemplating.BoundViewFactory) {
            if (this.boundViewFactory) {
                return this.boundViewFactory;
            }
            var factory = this.instruction.viewFactory;
            var partReplacements = this.partReplacements;
            if (partReplacements) {
                factory = partReplacements[factory.part] || factory;
            }
            this.boundViewFactory = new aureliaTemplating.BoundViewFactory(this, factory, partReplacements);
            return this.boundViewFactory;
        }
        if (key === aureliaTemplating.ViewSlot) {
            if (this.viewSlot === undefined) {
                this.viewSlot = new aureliaTemplating.ViewSlot(this.element, this.instruction.anchorIsContainer);
                this.element.isContentProjectionSource = this.instruction.lifting;
                this.children.push(this.viewSlot);
            }
            return this.viewSlot;
        }
        if (key === aureliaTemplating.ViewResources) {
            return this.viewResources;
        }
        if (key === aureliaTemplating.TargetInstruction) {
            return this.instruction;
        }
        return this.superGet(key);
    }
    var createElementContainer = function (parent, element, instruction, children, partReplacements, resources) {
        var container = parent.createChild();
        var provider = instruction.providers[0];
        container.element = element;
        container.instruction = instruction;
        container.children = children;
        container.viewResources = resources;
        container.partReplacements = partReplacements;
        container.registerSingleton(provider, provider);
        container.superGet = container.get;
        container.get = elementContainerGet;
        return container;
    };

    var CustomElementRegistry = (function () {
        function CustomElementRegistry(container, viewCompiler, viewResources) {
            this.fallbackPrefix = 'au-';
            this._lookup = Object.create(null);
            this.container = container;
            this.viewCompiler = viewCompiler;
            this.viewResources = viewResources;
        }
        CustomElementRegistry.prototype.useGlobalElements = function () {
            var _this = this;
            var viewResources = this.viewResources;
            var elements = viewResources.elements;
            viewResources.elements = Object.create(null);
            return Object.keys(elements).map(function (tagName) {
                var behavior = elements[tagName];
                return _this.registerBehavior(behavior, tagName).classDefinition;
            });
        };
        CustomElementRegistry.prototype.registerBehavior = function (behavior, tagName) {
            var classDefinition = createWebComponentClassFromBehavior(this.container, behavior, this.viewResources, this.viewCompiler);
            tagName = tagName || tagNameOf(behavior);
            var info = this._lookup[tagName] = {
                tagName: tagName,
                behavior: behavior,
                classDefinition: classDefinition
            };
            if (tagName.indexOf('-') === -1) {
                tagName = this.fallbackPrefix + tagName;
            }
            customElements.define(tagName, classDefinition);
            return info;
        };
        CustomElementRegistry.prototype.register = function (Type) {
            var htmlBehaviorResource = aureliaMetadata.metadata.get(aureliaMetadata.metadata.resource, Type);
            if (htmlBehaviorResource) {
                aureliaTemplating.ViewResources.convention(Type, htmlBehaviorResource);
            }
            else {
                htmlBehaviorResource = aureliaTemplating.ViewResources.convention(Type);
            }
            if (!(htmlBehaviorResource instanceof aureliaTemplating.HtmlBehaviorResource) || htmlBehaviorResource.elementName === null) {
                throw new Error("class " + Type.name + " is already associated with a different type of resource. Cannot register as a custom element.");
            }
            var customElementInfo = this.registerBehavior(htmlBehaviorResource, Type['is']);
            return htmlBehaviorResource
                .load(this.container, Type)
                .then(function () { return customElementInfo.classDefinition; });
        };
        CustomElementRegistry.prototype.has = function (Type) {
            var htmlBehaviorResource = aureliaMetadata.metadata.get(aureliaMetadata.metadata.resource, Type);
            if (!htmlBehaviorResource || !(htmlBehaviorResource instanceof aureliaTemplating.HtmlBehaviorResource)) {
                return false;
            }
            return this._lookup[tagNameOf(htmlBehaviorResource)] !== undefined;
        };
        CustomElementRegistry.inject = [aureliaDependencyInjection.Container, aureliaTemplating.ViewCompiler, aureliaTemplating.ViewResources];
        return CustomElementRegistry;
    }());

    exports.CustomElementRegistry = CustomElementRegistry;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=aurelia-web-components.js.map
