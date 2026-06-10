// GENERATED FILE — run `flutterfire configure` to replace this with real values.
// See: https://firebase.google.com/docs/flutter/setup
//
// Steps:
//   1. Install FlutterFire CLI: dart pub global activate flutterfire_cli
//   2. Run: flutterfire configure
//   3. Select your Firebase project
//   4. This file will be auto-generated with the correct keys.

import 'package:firebase_core/firebase_core.dart' show FirebaseOptions;
import 'package:flutter/foundation.dart'
    show defaultTargetPlatform, kIsWeb, TargetPlatform;

class DefaultFirebaseOptions {
  static FirebaseOptions get currentPlatform {
    if (kIsWeb) return web;
    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return android;
      case TargetPlatform.iOS:
        return ios;
      default:
        throw UnsupportedError(
          'DefaultFirebaseOptions are not supported for this platform.',
        );
    }
  }

  // ⚠️  Replace ALL placeholder values below by running `flutterfire configure`

  static const FirebaseOptions web = FirebaseOptions(
    apiKey: 'AIzaSyDDz9KIuH4iCan7GqVvcjgImawUMg3wjlQ',
    appId: '1:269800696958:web:cc94ebcb99bb59fb4f7c2f',
    messagingSenderId: '269800696958',
    projectId: 'xlcare-partner',
    authDomain: 'xlcare-partner.firebaseapp.com',
    storageBucket: 'xlcare-partner.firebasestorage.app',
    measurementId: 'G-BH9CB8NVQG',
  );

  static const FirebaseOptions android = FirebaseOptions(
    apiKey: 'AIzaSyAanbR2QYBxevYOA478tfz2neLmF2cCPhI',
    appId: '1:269800696958:android:34914307cd6ddcc64f7c2f',
    messagingSenderId: '269800696958',
    projectId: 'xlcare-partner',
    storageBucket: 'xlcare-partner.firebasestorage.app',
  );
  static const FirebaseOptions ios = FirebaseOptions(
    apiKey: 'YOUR_IOS_API_KEY',
    appId: 'YOUR_IOS_APP_ID',
    messagingSenderId: 'YOUR_SENDER_ID',
    projectId: 'YOUR_PROJECT_ID',
    storageBucket: 'YOUR_PROJECT_ID.appspot.com',
    iosClientId: 'YOUR_IOS_CLIENT_ID',
    iosBundleId: 'com.medireferral.app',
  );
}
