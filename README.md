# Onova and Drop mobile apps (`mobileapp`)

> Part of [Onova](https://www.onova.co/), a mobile marketplace for second-hand and sustainable clothing that [Gianfranco Palumbo](https://github.com/gianpaj) and Alex Kostinskyi built in Lviv, Ukraine. The company ran until September 2019. This repository is an archive and is not maintained.

One React Native codebase that builds two apps, Onova and Drop, through Android product flavours and iOS targets. The app mixes e-commerce with a social network: buyers follow shops to build a personal feed, "Instagram with a buy button". Sellers list clothing in batches called drops and announce each one ahead of time. Buyers subscribe to a drop, get a notification when it opens and compete to buy the items. Checkout, escrow payments and delivery tracking all happen in the app.

- React Native 0.59, Redux and Flow, with English and Ukrainian translations
- Chat on Pusher ChatKit, later Sendbird; push notifications with Firebase Cloud Messaging
- Over-the-air updates with CodePush; builds on CodeShip and Codemagic

| | |
|---|---|
| First commit | 2017-11-17 |
| Last commit | 2021-04-25 (the company ran until September 2019) |
| Commits | 1,565 by Gianfranco (1,127 of them in 2018) |
| Code | about 22,300 lines of JavaScript across 32 screens |
| Tests | 19 test files (Jest and Enzyme) |
| Releases | 12 tags, from 1.0.0 (2018-07-29) to Android build 13 / iOS build 11 (2019-09-12) |

### Onova repositories

- [onova-mobileapp](https://github.com/gianpaj/onova-mobileapp): the Onova and Drop iOS and Android apps
- [onova-server.data](https://github.com/gianpaj/onova-server.data): the REST API
- [onova-server.data.global](https://github.com/gianpaj/onova-server.data.global): the API fork for an international version
- [onova-server.push](https://github.com/gianpaj/onova-server.push): push notifications
- [onova-server.chat](https://github.com/gianpaj/onova-server.chat): order messages in buyer–seller chats
- [onova-webapp-drop](https://github.com/gianpaj/onova-webapp-drop): the Drop web app
- [onova-forest-admin](https://github.com/gianpaj/onova-forest-admin): the back office
- [onova-automl-server](https://github.com/gianpaj/onova-automl-server): an image classifier prototype

---

<!-- @prettier -->

## Original README

Onova

- Android app: [link](https://play.google.com/store/apps/details?id=uno.drop.app&hl=uk)
- iOS app: [link](https://itunes.apple.com/ua/app/onova/id1365771422?mt=8)

Drop

- Android app: [link](https://play.google.com/store/apps/details?id=com.onova.app&hl=uk)
- iOS app: [link](https://itunes.apple.com/ua/app/drop/id1462884885?mt=8)

> Created using React Native CLI (`react-native`), not the Create React Native App (CRNA) or Expo client.

Follow [these instructions](https://facebook.github.io/react-native/docs/getting-started.html) to install the requirements for React Native.

## Getting started

1.  Start the local development server (`server.data`).

    or connect the production server

2.  Copy `config-example_env.json` to `.config-dev.json` to the URL of where the `server.data` is running (e.g. you laptop's, `http://192.168.1.5:4040`).

    Note: `localhost` works with the iOS Simulator but not for the Android Emulator.

3.  Install `npm -g flow-typed` or `yarn global add flow-typed`. It's automatically executed after running `yarn`.

```bash
yarn

react-native run-ios
# or
yarn run start-emulator # for Android - only tested on Gian's laptop
# and
react-native run-android

# run packager and connect to the local server
yarn start

# run packager and connect to the remote server
NODE_ENV=prod yarn start
```

## Storybook for Component design

Run the packager for [Storybook](https://storybook.js.org)

    yarn storybook

## Tests with jest

    yarn test

## Run E2E test on iOS 🍎

_todo_

<!--
Start the emulator and the React Native packager

    react-native run-ios

Run Detox tests on iOS 🍎

    yarn test-e2e -->

## Build production builds

### Android 🤖

Currently supporting `Android 8.0 (SDK 27)` – for react-native-firebase

#### Setup 🔨🤖

1.  Install Android SDK/Android Studio
2.  (_optional_) Clone the [repo](https://bitbucket.org/onova/private.stuff) contaning the Android certificate for the release build (you need to have access)

    ```bash
    cd onova
    git clone git@bitbucket.org:onova/private.stuff.git
    ls
    drwxr-xr-x    8 gianfranco  staff   272B 27 Feb 10:07 .
    drwxr-xr-x+ 244 gianfranco  staff   8.1K 28 Feb 13:39 ..
    drwxr-xr-x   33 gianfranco  staff   1.1K 27 Feb 09:58 mobileapp
    drwxr-xr-x    6 gianfranco  staff   204B 28 Feb 12:13 private.stuff
    ```

    Put `private.stuff` folder at the same level as the `mobileapp`.

3.  Now you're ready to make a prod build.

#### Build Android 🤖

- Build release APK

  This builds and uploads the sourcemap files to Sentry.io 🎉

      yarn build-android-onova
      yarn build-android-drop

- Build release for internal testing ONLY

      yarn run-android-onova
      yarn run-android-drop

<!-- * Deploy a new version to the Google Play

  Build and sends the sourcemap files to Sentry.io and sends a msg on Slack the #bots-dev-onova channel once finished 🎉

      fastlane deploy -->

### iOS 🍎

#### Setup 🔨🍎

1.  Install Xcode

2.  Install Cocoapods

    brew install cocoapods

3.  Install CocoaPods dependencies

    cd ios
    pod install

#### Build iOS 🍎

1.  Archive a build

This builds and uploads the sourcemap files to Sentry.io 🎉

## Tools

### Check the size of the JavaScript bundle

Using [react-native-bundle-visualizer](https://github.com/IjzerenHein/react-native-bundle-visualizer)

    yarn react-native-bundle-visualizer

## Troubleshooting 🔫

- Issue with JS packager (Metro bundler)

  ```
  error: bundling failed: ambiguous resolution: module `.../onova/mobileapp/index.js` tries to require `react-native`, but there are several files providing this module. You can delete or fix them:
  ```

      yarn start --reset-cache

- iOS is just being a b\*tch

      yarn nuke-ios

- Android is just being a b\*tch

      yarn nuke-android

- Issues with Redux Store

  1.  To delete all the store, uncomment `// persistor.purge();` in `store.js`
  2.  Refresh the App
  3.  Comment the line again to persist it.
  4.  Refresh tha App, one last time

- Issues with yarn and `node-gyp.js build --fallback-to-build`

Use node < v10 e.g. v8.11
