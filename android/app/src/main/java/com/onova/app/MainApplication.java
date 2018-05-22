package com.onova.app;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.RNFetchBlob.RNFetchBlobPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
// import com.airbnb.android.react.lottie.LottiePackage;
import com.AlexanderZaytsev.RNI18n.RNI18nPackage;
// import com.dylanvann.fastimage.FastImageViewPackage;
// import com.instabug.reactlibrary.RNInstabugReactnativePackage;
import com.reactnative.ivpusic.imagepicker.PickerPackage;
import io.invertase.firebase.messaging.RNFirebaseMessagingPackage;
import io.invertase.firebase.notifications.RNFirebaseNotificationsPackage;
import io.invertase.firebase.RNFirebasePackage;
import io.sentry.RNSentryPackage;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      return Arrays.<ReactPackage>asList(
          new MainReactPackage(),
            new RNFetchBlobPackage(),
            // new FastImageViewPackage(),
            // new LottiePackage(),
            new PickerPackage(),
            new RNFirebaseMessagingPackage(),
            new RNFirebaseNotificationsPackage(),
            new RNFirebasePackage(),
            new RNI18nPackage(),
            // new RNInstabugReactnativePackage.Builder("YOUR_ANDROID_APPLICATION_TOKEN",MainApplication.this)
            //   .setInvocationEvent("shake")
            //   .setPrimaryColor("#1D82DC")
            //   .setFloatingEdge("left")
            //   .setFloatingButtonOffsetFromTop(250)
            //   .build(),
            new RNSentryPackage(MainApplication.this)
      );
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }
}
