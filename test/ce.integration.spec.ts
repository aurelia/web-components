import './setup';
import { bootstrapAurelia } from './utilities-bootstrap';
import { waitForTimeout } from './utilities-timing';

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
});
