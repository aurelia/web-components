import './setup';
import { bootstrapAurelia } from './utilities-bootstrap';
import { waitForTimeout } from './utilities-timing';
import { bindable, customElement } from 'aurelia-framework';

describe('ce.extend-built-in.integration.spec.ts', () => {

  it('should [[NOT]] work in normal usage', async () => {
    const { host, registry, dispose } = await bootstrapAurelia({
      root: class RootViewModel {
        static $view = '<template>';
      }
    });

    class MyButton1 {

      static extends = 'button';
      static $view = '<template>One</template>';

      @bindable icon;
    }

    await registry.register(MyButton1);
    host.innerHTML = '<my-button1>';
    await waitForTimeout(50);
    expect(host.textContent).toBe('');
    return dispose();
  });

  it('should work with "is" attribute', async () => {
    const { host, registry, dispose } = await bootstrapAurelia({
      root: class RootViewModel {
        static $view = '<template>';
      }
    });

    class MyButton2 {

      static extends = 'button';
      static $view = '<template>One';

      @bindable icon;
    }

    await registry.register(MyButton2);
    host.innerHTML = '<button is=my-button2>';
    await waitForTimeout(50);
    expect(host.textContent).toBe('One');
    return dispose();
  });
});
