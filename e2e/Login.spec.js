// @flow

describe('Login', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should not login', async () => {
    await waitFor(element(by.id('welcome')))
      .toBeVisible()
      .withTimeout(5000);

    await element(by.id('EmailField')).clearText();
    await element(by.id('EmailField')).typeText('wronggmail.com');
    await element(by.id('PasswordField')).clearText();
    await element(by.id('PasswordField')).typeText('wrongpass');

    await element(by.id('LoginButton')).tap();

    await waitFor(element(by.id('Home')))
      .toBeNotVisible()
      .withTimeout(10000);
  });

});
