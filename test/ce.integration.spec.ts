import './setup';
import { bootstrapAurelia } from './utilities-bootstrap';
import { waitForTimeout } from './utilities-timing';
import { bindable } from 'aurelia-framework';

describe('ce.integration.spec.ts', () => {

  it('should bootstrap', async () => {
    const { host, dispose } = await bootstrapAurelia({
      root: class RootViewModel {
        static $view = '<template><custom-element-one></template>';
      },
      resources: [
        class CustomElementOne {
          static $view = '<template>One</template>';
        }
      ]
    });
    await waitForTimeout(50);
    expect(host.textContent).toBe('One');
    dispose();
  });

  it('should initialise web component when attached to document', async () => {
    class CustomElementTwo {
      static $view = '<template>One</template>';
    }
    const { host, registry, dispose } = await bootstrapAurelia({
      root: class RootViewModel {
        static $view = '<template></template>';
      },
      resources: [CustomElementTwo]
    });
    registry.register(CustomElementTwo);
    await waitForTimeout(50);

    const customComponent = document.createElement('custom-element-two');
    host.appendChild(customComponent);
    expect(customComponent.textContent).toBe('One');
    dispose();
  });

  it('should not initialise web component when attribute changed on disconnected element', async () => {
    class CustomElementThree {
      static $view = '<template>One</template>';
      // Bindable property must exist in order for the attributeChangedCallback to be executed
      @bindable testing;
    }
    const { registry, dispose } = await bootstrapAurelia({
      root: class RootViewModel {
        static $view = '<template></template>';
      },
      resources: [CustomElementThree]
    });
    registry.register(CustomElementThree);
    await waitForTimeout(50);

    const customComponent = document.createElement('custom-element-three');
    customComponent.setAttribute('testing', 'xx-ignored-xx');
    expect(customComponent.textContent).toBe('One');
    dispose();
  });

  it('should initialise web component with modified attribute value', async () => {
    class CustomElementFour {
      static $view = '<template>${testing}</template>';
      // Bindable property must exist in order for the attributeChangedCallback to be executed
      @bindable testing;
    }
    const { host, registry, dispose } = await bootstrapAurelia({
      root: class RootViewModel {
        static $view = '<template></template>';
      },
      resources: [CustomElementFour]
    });
    registry.register(CustomElementFour);
    await waitForTimeout(50);

    const customComponent = document.createElement('custom-element-four');
    expect(customComponent.textContent).toBe('');
    customComponent.setAttribute('testing', 'One');
    // TODO this value is unexpected... I can't explain why the text changes here...
    expect(customComponent.textContent).toBe(' ');

    host.appendChild(customComponent);
    // Now the controller is bound. Should immediately pick up the attribute values set
    // before attaching.
    expect(customComponent.textContent).toBe('One');
    dispose();
  });

  it('should update web component when attribute value is modified later', async () => {
    class CustomElementFive {
      static $view = '<template>${testing}</template>';
      // Bindable property must exist in order for the attributeChangedCallback to be executed
      @bindable testing;
    }
    const { host, registry, dispose } = await bootstrapAurelia({
      root: class RootViewModel {
        static $view = '<template></template>';
      },
      resources: [CustomElementFive]
    });
    registry.register(CustomElementFive);
    await waitForTimeout(50);

    const customComponent = document.createElement('custom-element-five');
    host.appendChild(customComponent);
    await waitForTimeout(50);

    customComponent.setAttribute('testing', 'One');
    expect(customComponent.textContent).not.toBe('One');

    await waitForTimeout(50);
    expect(customComponent.textContent).toBe('One');
    dispose();
  });

  it('should initialise web component with forced prefix when attached to document', async () => {
    class CustomElementSix {
      static $view = '<template>Six</template>';
    }
    const { host, registry, dispose } = await bootstrapAurelia({
      root: class RootViewModel {
        static $view = '<template></template>';
      },
      resources: [CustomElementSix]
    });
    registry.forcePrefix = true;
    registry.register(CustomElementSix);
    await waitForTimeout(50);

    const customComponent0 = document.createElement('custom-element-six');
    host.appendChild(customComponent0);
    expect(customComponent0.textContent).toBe('');
    const customComponent = document.createElement('au-custom-element-six');
    host.appendChild(customComponent);
    expect(customComponent.textContent).toBe('Six');
    dispose();
  });
  it('should initialise web component with forced prefix, but prefix should not be doubled when attached to document', async () => {
    class CustomElementSeven {
      static $view = '<template>Seven</template>';
    }
    const { host, registry, dispose } = await bootstrapAurelia({
      root: class RootViewModel {
        static $view = '<template></template>';
      },
      resources: [CustomElementSeven]
    });
    registry.forcePrefix = true;
    registry.fallbackPrefix = 'custom-'
    registry.register(CustomElementSeven);
    await waitForTimeout(50);

    const customComponent0 = document.createElement('custom-element-seven');
    host.appendChild(customComponent0);
    expect(customComponent0.textContent).toBe('Seven');
    const customComponent = document.createElement('custom-custom-element-seven');
    host.appendChild(customComponent);
    expect(customComponent.textContent).toBe('');
    dispose();
  });
});
