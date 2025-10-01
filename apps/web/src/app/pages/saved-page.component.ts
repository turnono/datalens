import { Component, signal, computed } from "@angular/core";
import { CommonModule } from "@angular/common";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";

@Component({
  standalone: true,
  selector: "dl-saved-page",
  imports: [CommonModule],
  template: `
    <div class="card">
      <h3>Saved queries</h3>
      <div *ngIf="!uid()" class="muted">Login to view your saved queries.</div>
      <ul *ngIf="uid()">
        <li *ngFor="let item of items()">
          {{ item?.q }} —
          <span class="muted">{{ item?.createdAt?.toDate?.() || '' }}</span>
        </li>
      </ul>
    </div>
  `,
})
export class SavedPageComponent {
  uid = signal<string | null>(null);
  items = signal<any[]>([]);

  private app = initializeApp({
    apiKey:
      (globalThis as any).env?.FIREBASE_WEB_API_KEY ||
      (import.meta as any).env?.FIREBASE_WEB_API_KEY,
    authDomain:
      (globalThis as any).env?.FIREBASE_AUTH_DOMAIN ||
      (import.meta as any).env?.FIREBASE_AUTH_DOMAIN,
    projectId:
      (globalThis as any).env?.FIREBASE_PROJECT_ID ||
      (import.meta as any).env?.FIREBASE_PROJECT_ID,
    appId:
      (globalThis as any).env?.FIREBASE_APP_ID ||
      (import.meta as any).env?.FIREBASE_APP_ID,
  });

  constructor() {
    const auth = getAuth(this.app);
    onAuthStateChanged(auth, (user) => {
      this.uid.set(user?.uid ?? null);
      if (user) this.load(user.uid);
    });
  }

  load(uid: string) {
    const db = getFirestore(this.app);
    const q = query(
      collection(db, `users/${uid}/queries`),
      orderBy("createdAt", "desc")
    );
    onSnapshot(q, (snap) =>
      this.items.set(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
  }
}
