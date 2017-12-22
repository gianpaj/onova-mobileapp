describe('Home', () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });
  /*
  it('should login', async () => {
    await waitFor(element(by.id('welcome'))).toBeVisible();

    await element(by.id('EmailField')).tap();

    await element(by.id('EmailField')).clearText();
    await element(by.id('EmailField')).typeText('hello@gmail.com');
    await element(by.id('PasswordField')).clearText();
    await element(by.id('PasswordField')).typeText('***REMOVED***');

    await element(by.id('LoginButton')).tap();

    await waitFor(element(by.id('Home')))
      .toBeVisible()
      .withTimeout(10000);
    await expect(element(by.id('Home'))).toBeVisible();
  });
  */

  it('should navigate on an Shoes', async () => {
    await element(by.id('Tabs').withDescendant(by.text('Shoes')));
  });
  // it('should navigate on an item', done => {
  //   await
  // });
});
