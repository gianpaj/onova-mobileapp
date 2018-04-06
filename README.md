# Onova mobile app

- Android app: <!-- [link](https://play.google.com/store/apps/details?id=com.onova.app) -->
- iOS app: <!-- [link](https://itunes.apple.com/us/app/?mt=8) -->

> Created using React Native CLI (`react-native`), not Create React Native App (CRNA) or Expo client.

Follow [these instructions](https://facebook.github.io/react-native/docs/getting-started.html) to install the React Native requirements.

## Getting started

1. Start the development server (server.data).
2. Update the `.env` to the IP address of where the server.data is running (e.g. you laptop's)
3. Install `npm -g flow-typed`. It's automatically executed after running `yarn`.

```bash
yarn
react-native run-ios
# or
yarn run start-emulator # only tested in Gian's laptop
react-native run-android
```

## Run E2E test on iOS 🍎

_todo_

<!--
Start the emulator and the React Native packager

    react-native run-ios

Run Detox tests on iOS 🍎

    yarn test-e2e -->

## Build production builds

### Android 🤖

Currently supporting `Android 6.0 (SDK 23)` – default with React Native v0.54

#### Setup 🔨🤖

1. Install [fastlane](https://docs.fastlane.tools/getting-started/android/setup/)
2. Install Android SDK/Android Studio
3. (_optional_) Clone the [repo](https://bitbucket.org/onova/private.stuff) containg the Android certificate for the release build (you need to have access)

    ```bash
    cd onova
    git clone git@bitbucket.org:onova/private.stuff.git
    ls
    drwxr-xr-x    8 gianfranco  staff   272B 27 Feb 10:07 .
    drwxr-xr-x+ 244 gianfranco  staff   8.1K 28 Feb 13:39 ..
    drwxr-xr-x   33 gianfranco  staff   1.1K 27 Feb 09:58 mobileapp
    drwxr-xr-x    6 gianfranco  staff   204B 28 Feb 12:13 private.stuff
    ```

    The `private.stuff` folder needs to be at the same level as the `mobileapp`.

4. Now you're ready to make a prod build.

#### Build Android 🤖

- Simple release build

      fastlane beta

- Deploy a new version to the Google Play

  Build and sends the source code to Sentry.io and sends a msg on Slack the #bots-dev-onova channel once finished 🎉

      fastlane deploy

### iOS 🍎

#### Setup 🔨🍎

_todo_

#### Build iOS 🍎

_todo_

## Tools

### Check the size of the JavaScript bundle

Using [react-native-bundle-visualizer](https://github.com/IjzerenHein/react-native-bundle-visualizer)

    yarn run react-native-bundle-visualizer

## Troubleshooting 🔫

1. Issue with packager / Metro bundler

    ```
    error: bundling failed: ambiguous resolution: module `.../onova/mobileapp/index.js` tries to require `react-native`, but there are several files providing this module. You can delete or fix them:
    ```

        yarn start --reset-cache

2. iOS is just being a b*tch

        yarn run nuke-ios
