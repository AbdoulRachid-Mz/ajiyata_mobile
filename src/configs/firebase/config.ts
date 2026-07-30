import { Platform } from 'react-native';
import { initializeApp } from 'firebase/app';
// @ts-ignore : getReactNativePersistence est disponible au runtime pour React Native mais absent des types Web globaux de Firebase
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getMessaging } from 'firebase/messaging';
import { getDatabase } from 'firebase/database';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBGrDOu75WjQkh5p7HHLZOiR5oEBQHq5p4',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'ajiya-ta.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'ajiya-ta',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'ajiya-ta.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '49737860733',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:49737860733:android:129ff636e69c90b3321314',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-49737860733',
};

// console.log('firebaseConfig:', firebaseConfig);

const app = initializeApp(firebaseConfig);

// Initialisation de l'authentification adaptée selon la plateforme
export const auth = Platform.OS === 'web'
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage)
    });

export const db = getFirestore(app);
export const database = getDatabase(app);

// Activation de Firebase Messaging UNIQUEMENT sur le Web pour éviter le crash sur Android/iOS
export const messaging = Platform.OS === 'web' ? getMessaging(app) : null;

export const firestore = getFirestore(app);

export default app;