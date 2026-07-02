Expo SecureStore
A library that provides a way to encrypt and securely store key-value pairs locally on the device.


Ask AI




Bundled version:
~57.0.0

Copy page

expo-secure-store provides a way to encrypt and securely store key-value pairs locally on the device. Each Expo project has a separate storage system and has no access to the storage of other Expo projects.

Large payloads can be rejected by the underlying platform. Historically, some iOS releases refused values above roughly 2048 bytes. Expo does not enforce a limit, so make sure to handle native errors if you plan to store very large strings.

The requireAuthentication option is not supported in Expo Go when biometric authentication is available due to a missing NSFaceIDUsageDescription key.

Installation
Terminal
npm
yarn
pnpm
bun

Copy

pnpm expo install expo-secure-store
If you are installing this in an existing React Native app, make sure to install expo in your project.

Configuration in app config
You can configure expo-secure-store using its built-in config plugin if you use config plugins in your project (Continuous Native Generation (CNG)). The plugin allows you to configure various properties that cannot be set at runtime and require building a new app binary to take effect. If your app does not use CNG, then you'll need to manually configure the library.

Example app.json with config plugin
app.json

Copy


{
  "expo": {
    "plugins": [
      [
        "expo-secure-store",
        {
          "configureAndroidBackup": true,
          "faceIDPermission": "Allow $(PRODUCT_NAME) to access your Face ID biometric data."
        }
      ]
    ]
  }
}
Configurable properties
Name	Default	Description
configureAndroidBackup	true	
Only for: 

A boolean indicating whether to configure automatic Android backup to work correctly with expo-secure-store. Learn more.

faceIDPermission	"Allow $(PRODUCT_NAME) to access your Face ID biometric data."	
Only for: 

A string to set the NSFaceIDUsageDescription permission message.

Are you using this library in an existing React Native app?


Platform value storage
Android
On Android, values are stored in SharedPreferences, encrypted with Android's Keystore system.

iOS
On iOS, values are stored using the keychain services as kSecClassGenericPassword. Due to the underlying nature of iOS Keychain, data stored with expo-secure-store will persist across app uninstallations when the app is reinstalled with the same bundle ID. This is an expected behavior of the iOS Keychain system and should be considered when designing your app's data handling. iOS has the additional option of being able to set the value's kSecAttrAccessible attribute, which controls when the value is available to be fetched.

Data persistence
expo-secure-store is designed to provide a persistent data storage solution across app restarts and updates. However, it is important not to rely on it as a single source of truth for irreplaceable, critical data.

On Android: Data saved using expo-secure-store will not be preserved upon app uninstallation.
On iOS: Data saved using expo-secure-store will persist across app uninstallations if the app is reinstalled with the same bundle ID. This is due to how the iOS Keychain manages stored credentials. Keep in mind that this is not guaranteed and you should never rely on this implementation detail.
Additionally, any data protected with the requireAuthentication option set to true will become inaccessible if there are changes to the user's biometric settings, such as adding a new fingerprint.

Exempting encryption prompt
Apple App Store Connect prompts you to select the type of encryption algorithm your app implements. This is known as Export Compliance Information. It is asked when publishing the app or submitting for TestFlight.

When using expo-secure-store, you can set the ios.config.usesNonExemptEncryption property to false in the app config:

app.json

Copy


{
  "expo": {
    "ios": {
      "config": {
        "usesNonExemptEncryption": false
      }
      ... 
    }
  }
}
Setting this property automatically handles the compliance information prompt.

Android Auto Backup
Android Auto Backup for Apps automatically backs up a user's data from apps that target and run on Android 6.0 (API level 23) or higher.

The Auto Backup system has to be configured to exclude expo-secure-store shared preferences entries, as it's impossible to decrypt them after restoring the backup — app's entries are deleted from the Android Key Store when the app is uninstalled.

If your app doesn't have any custom backup configuration, expo-secure-store will automatically configure the Auto Backup system to ignore the expo-secure-store data.

If you are using your own Auto Backup configuration, you should exclude the SecureStore under the sharedpref domain and set the configureAndroidBackup to false in the config plugin configuration.

<!--  Auto Backup configuration for Android 12 and higher -->
<data-extraction-rules>
  <cloud-backup>
    <include domain="sharedpref" path="."/>
    <exclude domain="sharedpref" path="SecureStore"/>
  </cloud-backup>
  <device-transfer>
    <include domain="sharedpref" path="."/>
    <exclude domain="sharedpref" path="SecureStore"/>
  </device-transfer>
</data-extraction-rules>
<!--  Auto Backup configuration for Android 11 and lower -->
<full-backup-content>
  <include domain="sharedpref" path="."/>
  <exclude domain="sharedpref" path="SecureStore"/>
</full-backup-content>
Usage
SecureStore

Copy


Open in Snack


import { useState } from 'react';
import { Text, View, StyleSheet, TextInput, Button } from 'react-native';
import * as SecureStore from 'expo-secure-store';

async function save(key, value) {
  await SecureStore.setItemAsync(key, value);
}

async function getValueFor(key) {
  let result = await SecureStore.getItemAsync(key);
  if (result) {
    alert("🔐 Here's your value 🔐 \n" + result);
  } else {
    alert('No values stored under that key.');
  }
}

export default function App() {
  const [key, onChangeKey] = useState('Your key here');
  const [value, onChangeValue] = useState('Your value here');

  return (
    <View style={styles.container}>
      <Text style={styles.paragraph}>Save an item, and grab it later!</Text>
      {Add some TextInput components... }
      <Button
        title="Save this key/value pair"
        onPress={() => {
          save(key, value);
          onChangeKey('Your key here');
          onChangeValue('Your value here');
        }}
      />
      <Text style={styles.paragraph}>🔐 Enter your key 🔐</Text>
      <TextInput
        style={styles.textInput}
        onSubmitEditing={event => {
          getValueFor(event.nativeEvent.text);
        }}
        placeholder="Enter the key for the value you want to get"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 10,
    backgroundColor: '#ecf0f1',
    padding: 8,
  },
  paragraph: {
    marginTop: 34,
    margin: 24,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  textInput: {
    height: 35,
    borderColor: 'gray',
    borderWidth: 0.5,
    padding: 4,
  },
});

Show More
API
import * as SecureStore from 'expo-secure-store';
Constants
SecureStore.AFTER_FIRST_UNLOCK
Type: KeychainAccessibilityConstant

The data in the keychain item cannot be accessed after a restart until the device has been unlocked once by the user. This may be useful if you need to access the item when the phone is locked.

SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY
Type: KeychainAccessibilityConstant

Similar to AFTER_FIRST_UNLOCK, except the entry is not migrated to a new device when restoring from a backup.

Deprecated: Use an accessibility level that provides some user protection, such as AFTER_FIRST_UNLOCK.

SecureStore.ALWAYS
Type: KeychainAccessibilityConstant

The data in the keychain item can always be accessed regardless of whether the device is locked. This is the least secure option.

Deprecated: Use an accessibility level that provides some user protection, such as AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY.

SecureStore.ALWAYS_THIS_DEVICE_ONLY
Type: KeychainAccessibilityConstant

Similar to ALWAYS, except the entry is not migrated to a new device when restoring from a backup.

SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY
Type: KeychainAccessibilityConstant

Similar to WHEN_UNLOCKED_THIS_DEVICE_ONLY, except the user must have set a passcode in order to store an entry. If the user removes their passcode, the entry will be deleted.

SecureStore.WHEN_UNLOCKED
Type: KeychainAccessibilityConstant

The data in the keychain item can be accessed only while the device is unlocked by the user.

SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY
Type: KeychainAccessibilityConstant

Similar to WHEN_UNLOCKED, except the entry is not migrated to a new device when restoring from a backup.

Methods
SecureStore.canUseBiometricAuthentication()
Checks if the value can be saved with requireAuthentication option enabled.

Returns:
boolean
true if the device supports biometric authentication and the enrolled method is sufficiently secure. Otherwise, returns false. Always returns false on tvOS.

SecureStore.deleteItemAsync(key, options)
Parameter	Type	Description
key	string	
The key that was used to store the associated value.

options
(optional)
SecureStoreOptions	
An SecureStoreOptions object.

Default:
{}

Delete the value associated with the provided key.

Returns:
Promise<void>
A promise that rejects if the value can't be deleted.

SecureStore.getItem(key, options)
Parameter	Type	Description
key	string	
The key that was used to store the associated value.

options
(optional)
SecureStoreOptions	
An SecureStoreOptions object.

Default:
{}

Synchronously reads the stored value associated with the provided key.

Note: This function blocks the JavaScript thread, so the application may not be interactive when reading a value with requireAuthentication option set to true until the user authenticates.

Returns:
string | null
Previously stored value. It resolves with null if there is no entry for the given key or if the key has been invalidated.

SecureStore.getItemAsync(key, options)
Parameter	Type	Description
key	string	
The key that was used to store the associated value.

options
(optional)
SecureStoreOptions	
An SecureStoreOptions object.

Default:
{}

Reads the stored value associated with the provided key.

Returns:
Promise<string | null>
A promise that resolves to the previously stored value. It resolves with null if there is no entry for the given key or if the key has been invalidated. It rejects if an error occurs while retrieving the value.

Keys are invalidated by the system when biometrics change, such as adding a new fingerprint or changing the face profile used for face recognition. After a key has been invalidated, it becomes impossible to read its value. This only applies to values stored with requireAuthentication set to true.

SecureStore.isAvailableAsync()
Returns whether the SecureStore API is enabled on the current device. This does not check the app permissions.

Returns:
Promise<boolean>
Promise which fulfils with a boolean, indicating whether the SecureStore API is available on the current device. Currently, this resolves true on Android and iOS only.

SecureStore.setItem(key, value, options)
Parameter	Type	Description
key	string	
The key to associate with the stored value. Keys may contain alphanumeric characters, ., -, and _.

value	string	
The value to store.

options
(optional)
SecureStoreOptions	
An SecureStoreOptions object.

Default:
{}

Stores a key–value pair synchronously.

Note: This function blocks the JavaScript thread, so the application may not be interactive when the requireAuthentication option is set to true until the user authenticates.

Returns:
void
SecureStore.setItemAsync(key, value, options)
Parameter	Type	Description
key	string	
The key to associate with the stored value. Keys may contain alphanumeric characters, ., -, and _.

value	string	
The value to store.

options
(optional)
SecureStoreOptions	
An SecureStoreOptions object.

Default:
{}

Stores a key–value pair.

Returns:
Promise<void>
A promise that rejects if value cannot be stored on the device.

Types
KeychainAccessibilityConstant
Type: number

SecureStoreOptions
Property	Type	Description
accessGroup
(optional)
string	
Only for: 

Specifies the access group the stored entry belongs to.

See: Apple's documentation on Sharing access to keychain items among a collection of apps.

authenticationPrompt
(optional)
string	
Custom message displayed to the user while requireAuthentication option is turned on.

keychainAccessible
(optional)
KeychainAccessibilityConstant	
Only for: 

Specifies when the stored entry is accessible, using iOS's kSecAttrAccessible property.

Default:
SecureStore.WHEN_UNLOCKED
See: Apple's documentation on keychain item accessibility.

keychainService
(optional)
string	
Android: Equivalent of the public/private key pair Alias.
iOS: The item's service, equivalent to kSecAttrService.
If the item is set with the keychainService option, it will be required to later fetch the value.

requireAuthentication
(optional)
boolean	
Option responsible for enabling the usage of the user authentication methods available on the device while accessing data stored in SecureStore.

Android: Equivalent to setUserAuthenticationRequired(true) (requires API 23).
iOS: Equivalent to biometryCurrentSet. Complete functionality is unlocked only with a freshly generated key - this would not work in tandem with the keychainService value used for the others non-authenticated operations.
This option works slightly differently across platforms: On Android, user authentication is required for all operations. On iOS, the user is prompted to authenticate only when reading or updating an existing value (not when creating a new one).

Warning: This option is not supported in Expo Go when biometric authentication is available due to a missing NSFaceIDUsageDescription. In release builds or when using continuous native generation, make sure to use the expo-secure-store config plugin.

Note: This library requires a real device for testing since emulators/simulators do not require biometric authentication when retrieving secrets, unlike real iOS devices.

