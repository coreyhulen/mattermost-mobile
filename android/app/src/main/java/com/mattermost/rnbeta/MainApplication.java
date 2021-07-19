package com.mattermost.rnbeta;

import android.content.Context;
import android.content.RestrictionsManager;
import android.os.Bundle;
import android.util.Log;
import java.io.File;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.mattermost.share.RealPathUtil;
import com.mattermost.share.ShareModule;
import com.wix.reactnativenotifications.RNNotificationsPackage;

import com.reactnativenavigation.NavigationApplication;
import com.wix.reactnativenotifications.core.notification.INotificationsApplication;
import com.wix.reactnativenotifications.core.notification.IPushNotification;
import com.wix.reactnativenotifications.core.notificationdrawer.IPushNotificationsDrawer;
import com.wix.reactnativenotifications.core.notificationdrawer.INotificationsDrawerApplication;
import com.wix.reactnativenotifications.core.AppLaunchHelper;
import com.wix.reactnativenotifications.core.AppLifecycleFacade;
import com.wix.reactnativenotifications.core.JsIOHelper;

import com.facebook.react.PackageList;
import com.facebook.react.ReactInstanceManager;
import com.facebook.react.ReactPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.TurboReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.module.model.ReactModuleInfo;
import com.facebook.react.module.model.ReactModuleInfoProvider;
import com.facebook.soloader.SoLoader;

import com.facebook.react.bridge.JSIModulePackage;


public class MainApplication extends NavigationApplication implements INotificationsApplication, INotificationsDrawerApplication {
  public static MainApplication instance;

  public Boolean sharedExtensionIsOpened = false;

  private Bundle mManagedConfig = null;

private final ReactNativeHost mReactNativeHost =
  new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      List<ReactPackage> packages = new PackageList(this).getPackages();
      // Packages that cannot be auto linked yet can be added manually here, for example:
      // packages.add(new MyReactNativePackage());
      packages.add(new RNNotificationsPackage(MainApplication.this));
      packages.add(new RNPasteableTextInputPackage());
      packages.add(
        new TurboReactPackage() {
              @Override
              public NativeModule getModule(String name, ReactApplicationContext reactContext) {
                switch (name) {
                  case "MattermostManaged":
                    return MattermostManagedModule.getInstance(reactContext);
                  case "MattermostShare":
                    return new ShareModule(instance, reactContext);
                  case "NotificationPreferences":
                    return NotificationPreferencesModule.getInstance(instance, reactContext);
                  case "RNTextInputReset":
                    return new RNTextInputResetModule(reactContext);
                  default:
                    throw new IllegalArgumentException("Could not find module " + name);
                }
              }

              @Override
              public ReactModuleInfoProvider getReactModuleInfoProvider() {
                return () -> {
                  Map<String, ReactModuleInfo> map = new HashMap<>();
                  map.put("MattermostManaged", new ReactModuleInfo("MattermostManaged", "com.mattermost.rnbeta.MattermostManagedModule", false, false, false, false, false));
                  map.put("MattermostShare", new ReactModuleInfo("MattermostShare", "com.mattermost.share.ShareModule", false, false, true, false, false));
                  map.put("NotificationPreferences", new ReactModuleInfo("NotificationPreferences", "com.mattermost.rnbeta.NotificationPreferencesModule", false, false, false, false, false));
                  map.put("RNTextInputReset", new ReactModuleInfo("RNTextInputReset", "com.mattermost.rnbeta.RNTextInputResetModule", false, false, false, false, false));
                  return map;
                };
              }
            }
      );

      return packages;
    }

    @Override
    protected String getJSMainModuleName() {
      return "index";
    }

    @Override
    protected JSIModulePackage getJSIModulePackage() {
      return (JSIModulePackage) new CustomMMKVJSIModulePackage();
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    instance = this;

    // Delete any previous temp files created by the app
    File tempFolder = new File(getApplicationContext().getCacheDir(), ShareModule.CACHE_DIR_NAME);
    RealPathUtil.deleteTempFiles(tempFolder);
    Log.i("ReactNative", "Cleaning temp cache " + tempFolder.getAbsolutePath());

    SoLoader.init(this, /* native exopackage */ false);
    initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
  }

  @Override
  public IPushNotification getPushNotification(Context context, Bundle bundle, AppLifecycleFacade defaultFacade, AppLaunchHelper defaultAppLaunchHelper) {
    return new CustomPushNotification(
            context,
            bundle,
            defaultFacade,
            defaultAppLaunchHelper,
            new JsIOHelper()
    );
  }

  @Override
  public IPushNotificationsDrawer getPushNotificationsDrawer(Context context, AppLaunchHelper defaultAppLaunchHelper) {
    return new CustomPushNotificationDrawer(context, defaultAppLaunchHelper);
  }

  public ReactContext getRunningReactContext() {
    if (mReactNativeHost == null) {
        return null;
    }

    return mReactNativeHost
        .getReactInstanceManager()
        .getCurrentReactContext();
  }

  public synchronized Bundle loadManagedConfig(Context ctx) {
    if (ctx != null) {
      RestrictionsManager myRestrictionsMgr =
              (RestrictionsManager) ctx.getSystemService(Context.RESTRICTIONS_SERVICE);

      mManagedConfig = myRestrictionsMgr.getApplicationRestrictions();

      if (mManagedConfig!= null && mManagedConfig.size() > 0) {
        return mManagedConfig;
      }

      return null;
    }

    return null;
  }

  public synchronized Bundle getManagedConfig() {
    if (mManagedConfig != null && mManagedConfig.size() > 0) {
        return mManagedConfig;
    }

    ReactContext ctx = getRunningReactContext();

    if (ctx != null) {
      return loadManagedConfig(ctx);
    }

    return null;
  }

  /**
   * Loads Flipper in React Native templates. Call this in the onCreate method with something like
   * initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
   *
   * @param context application context
   * @param reactInstanceManager instance of React
   */
  private static void initializeFlipper(
      Context context, ReactInstanceManager reactInstanceManager) {
    if (BuildConfig.DEBUG) {
      try {
        /*
         We use reflection here to pick up the class that initializes Flipper,
        since Flipper library is not available in release mode
        */
        Class<?> aClass = Class.forName("com.rn.ReactNativeFlipper");
        aClass
            .getMethod("initializeFlipper", Context.class, ReactInstanceManager.class)
            .invoke(null, context, reactInstanceManager);
      } catch (Exception e) {
        e.printStackTrace();
      }
    }
  }
}
