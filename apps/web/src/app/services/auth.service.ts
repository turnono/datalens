import { Injectable, signal } from "@angular/core";
import { initializeApp, FirebaseApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  type User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";

function getEnv(key: string) {
  return (
    (globalThis as any).env?.[key] ||
    (import.meta as any).env?.[key] ||
    (process as any)?.env?.[key]
  );
}

@Injectable({ providedIn: "root" })
export class AuthService {
  app: FirebaseApp;
  user = signal<User | null>(null);

  constructor() {
    this.app = initializeApp({
      apiKey: getEnv("FIREBASE_WEB_API_KEY"),
      authDomain: getEnv("FIREBASE_AUTH_DOMAIN"),
      projectId: getEnv("FIREBASE_PROJECT_ID"),
      appId: getEnv("FIREBASE_APP_ID"),
    });
    const auth = getAuth(this.app);
    onAuthStateChanged(auth, (u) => this.user.set(u));
  }

  login(email: string, password: string) {
    return signInWithEmailAndPassword(getAuth(this.app), email, password);
  }

  signup(email: string, password: string) {
    return createUserWithEmailAndPassword(getAuth(this.app), email, password);
  }

  logout() {
    return signOut(getAuth(this.app));
  }
}
