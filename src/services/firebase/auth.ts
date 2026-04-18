import type { Role, User } from "@/src/types/domain";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firebaseAuth, firestore } from "./client";

const USERS_COLLECTION = "users";

function toDomainUser(
  firebaseUser: FirebaseUser,
  profile: Partial<User> = {},
): User {
  return {
    id: firebaseUser.uid,
    firebaseUid: firebaseUser.uid,
    role: (profile.role as Role) ?? "patient",
    name: profile.name ?? firebaseUser.displayName ?? "Usuario",
    email: profile.email ?? firebaseUser.email ?? null,
    phone: profile.phone ?? null,
    avatarUrl: profile.avatarUrl ?? null,
    createdAt: profile.createdAt ?? new Date().toISOString(),
  };
}

export async function getUserProfile(uid: string): Promise<User | null> {
  const ref = doc(firestore, USERS_COLLECTION, uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    return null;
  }

  return snap.data() as User;
}

export async function createUserProfile(input: {
  uid: string;
  role: Role;
  name: string;
  email: string;
}): Promise<User> {
  const userDoc: User = {
    id: input.uid,
    firebaseUid: input.uid,
    role: input.role,
    name: input.name,
    email: input.email,
    phone: null,
    avatarUrl: null,
    createdAt: new Date().toISOString(),
  };

  const ref = doc(firestore, USERS_COLLECTION, input.uid);
  await setDoc(ref, userDoc, { merge: true });

  return userDoc;
}

export async function signInUser(email: string, password: string) {
  return signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
  role: Role;
}) {
  const credentials = await createUserWithEmailAndPassword(
    firebaseAuth,
    input.email.trim(),
    input.password,
  );

  if (input.name.trim()) {
    await updateProfile(credentials.user, { displayName: input.name.trim() });
  }

  const profile = await createUserProfile({
    uid: credentials.user.uid,
    role: input.role,
    name: input.name.trim(),
    email: input.email.trim(),
  });

  return { credentials, profile };
}

export async function signOutUser() {
  await signOut(firebaseAuth);
}

export function subscribeToAuthState(
  callback: (input: {
    firebaseUser: FirebaseUser | null;
    user: User | null;
  }) => void,
) {
  return onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
    if (!firebaseUser) {
      callback({ firebaseUser: null, user: null });
      return;
    }

    const profile = await getUserProfile(firebaseUser.uid);

    // If profile does not exist yet, fallback to firebase identity.
    callback({
      firebaseUser,
      user: profile ?? toDomainUser(firebaseUser),
    });
  });
}
