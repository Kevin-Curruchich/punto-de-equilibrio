import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { getApps, initializeApp } from "firebase/app";
import type { Auth, Persistence } from "firebase/auth";
import * as FirebaseAuth from "firebase/auth";

import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { Platform } from "react-native";

const {
  firebaseApiKey,
  firebaseAuthDomain,
  firebaseProjectId,
  firebaseStorageBucket,
  firebaseMessagingSenderId,
  firebaseAppId,
} = Constants.expoConfig?.extra ?? {};

const firebaseConfig = {
  apiKey: firebaseApiKey as string,
  authDomain: firebaseAuthDomain as string,
  projectId: firebaseProjectId as string,
  storageBucket: firebaseStorageBucket as string,
  messagingSenderId: firebaseMessagingSenderId as string,
  appId: firebaseAppId as string,
};

// Prevent re-initialization during hot reload
const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let firebaseAuth: Auth;

if (Platform.OS === "web") {
  firebaseAuth = FirebaseAuth.getAuth(app);
} else {
  const getReactNativePersistence = (
    FirebaseAuth as unknown as {
      getReactNativePersistence?: (storage: typeof AsyncStorage) => Persistence;
    }
  ).getReactNativePersistence;

  try {
    if (getReactNativePersistence) {
      firebaseAuth = FirebaseAuth.initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage),
      });
    } else {
      firebaseAuth = FirebaseAuth.getAuth(app);
    }
  } catch {
    // Auth may already be initialized during fast refresh.
    firebaseAuth = FirebaseAuth.getAuth(app);
  }
}

export { firebaseAuth };
export const firestore = getFirestore(app);
export const storage = getStorage(app);
