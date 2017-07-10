# Mattermost Mobile

**Supported Server Versions:** 3.8+

Mattermost is an open source Slack-alternative used by thousands of companies around the world in 11 languages. Learn more at https://mattermost.com.

You can download our apps from the [App Store](https://about.mattermost.com/mattermost-ios-app/) or [Google Play Store](https://about.mattermost.com/mattermost-android-app/), or package them yourself. 

We plan on releasing monthly updates with new features - check the [changelog](https://github.com/mattermost/mattermost-mobile/blob/master/CHANGELOG.md) for what features are currently supported! 

# How to Contribute

### Testing

To help with testing app updates before they're released, you can:

1. Sign up to be a beta tester
  - [Android](https://play.google.com/apps/testing/com.mattermost.rnbeta)
  - [iOS](https://mattermost-fastlane.herokuapp.com/)
2. Install the `Mattermost Beta` app
3. File any bugs you find by filing a [GitHub issue](https://github.com/mattermost/mattermost-mobile/issues) with:
  - Device information
  - Repro steps
  - Observed behavior (including screenshot / video when possible)
  - Expected behavior
4. (Optional) [Sign up for our team site](https://pre-release.mattermost.com/signup_user_complete/?id=f1924a8db44ff3bb41c96424cdc20676)
  - Join the [Native Mobile Apps channel](https://pre-release.mattermost.com/core/channels/native-mobile-apps) to see what's new and discuss feedback with other contributors and the core team

### Contribute Code 

1. Look in [GitHub issues](https://github.com/mattermost/mattermost-mobile/issues) for issues marked as [Help Wanted]
2. Comment to let people know you’re working on it
3. Follow [these instructions](https://docs.mattermost.com/developer/mobile-developer-setup.html) to set up your developer environment
4. Join the [Native Mobile Apps channel](https://pre-release.mattermost.com/core/channels/native-mobile-apps) on our team site to ask questions

# Installing Dependencies

Follow the [React Native Getting Started Guide](https://facebook.github.io/react-native/docs/getting-started.html) for detailed instructions on setting up your local machine for development.

# Detailed configuration:

## Mac

- General requirements

    - XCode 8.3
    - Install required packages using homebrew:
      ```bash
      $ brew install watchman
      $ brew install yarn
      ```
	  
- Clone repository and configure:
    ```bash
    $ git clone git@github.com:mattermost/mattermost-mobile.git
    $ cd mattermost-mobile
    $ npm install
    $ npm install -g react-native-cli
    ```

- Run application
    ```bash
    $ make run
    ```

- Stop the packager server
    ```bash
    $ make stop
    ```
## Linux:

- General requiriments:

  - JDK 7 or greater
  - Android SDK
  - Virtualbox
  - An Android emulator: Genymotion or Android emulator. If using genymotion ensure that it uses existing adb tools (Settings: "Use custom Android SDK Tools")
  - Install watchman (do this globally):
      ```bash
      $ git clone https://github.com/facebook/watchman.git
      $ cd watchman
      $ git checkout master
      $ ./autogen.sh
      $ ./configure make
      $ sudo make install
      ```
      Configure your kernel to accept a lot of file watches, using a command like:
      ```bash
      $ sudo sysctl -w fs.inotify.max_user_watches=1048576
      ```

- Clone repository and configure:
    ```bash
    $ git clone git@github.com:mattermost/mattermost-mobile.git
    $ cd mattermost-mobile
    $ npm install
    $ npm install -g react-native-cli
    ```

  - Add or edit file `src/config/config.secret.json` and add the url to the Mattermost server that you will use to develop:
    `{
       "DefaultServerUrl": "https://pre-release.mattermost.com"
    }`

    To use a local Mattermost server you will need to configure the "DefaultServerUrl" depending on the emulator you will use:
      * IOs:        "DefaultServerUrl": "http://localhost:8065"
      * Android:    "DefaultServerUrl": "http://10.0.2.2:3000"
      * Genymotion: "DefaultServerUrl": "http://10.0.3.2:8065"

- Run application
  - Start emulator
  - Start react packager: `$ react-native start`
  - Run in emulator: `$ react-native run-android`

# Frequently Asked Questions

**How is data handled on mobile devices after a user account is deactivated?**

App data is wiped from the device when a user logs out of the app. If the user is logged in when the account is deactivated, then within one minute the system logs the user out, and as a result all app data is wiped from the device.
