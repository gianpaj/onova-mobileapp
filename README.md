# Onova mobile app

> Created using React Native CLI (`react-native`) not Create React Native App (CRNA) or Expo client.

Follow [these instructions](https://facebook.github.io/react-native/docs/getting-started.html) to install the React Native requirements.

## Getting started

    yarn
    react-native run-ios

## Run E2E test

Start the emulator and the React Native packager

    react-native run-ios

Run Detox tests

    yarn test-e2e

## Troubleshooting

1. Issue with packager / Metro bundler

```
error: bundling failed: ambiguous resolution: module `/Users/gianfranco/onova/mobileapp/index.js` tries to require `react-native`, but there are several files providing this module. You can delete or fix them:
```

    yarn start --reset-cache
