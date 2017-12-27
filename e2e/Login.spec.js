describe('Login', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should not login', async () => {
    await waitFor(element(by.id('login-form')))
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

  it('should login', async () => {
    await waitFor(element(by.id('login-form'))).toBeVisible();

    await element(by.id('EmailField')).tap();

    await element(by.id('EmailField')).clearText();
    await element(by.id('EmailField')).typeText('gianpa+test2@gmail.com');
    await element(by.id('PasswordField')).clearText();
    await element(by.id('PasswordField')).typeText('express2');

    await element(by.id('LoginButton')).tap();

    await waitFor(element(by.id('Home')))
      .toBeVisible()
      .withTimeout(10000);
    await expect(element(by.id('Home'))).toBeVisible();
  });
});
