import { Injectable } from "@angular/core";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { AuthService } from "./auth.service";
import type { QueryResult } from "@datalens/shared";

@Injectable({ providedIn: "root" })
export class HistoryService {
  constructor(private auth: AuthService) {}

  async save(q: string, result: QueryResult) {
    const user = this.auth.user();
    if (!user) throw new Error("Not authenticated");
    const db = getFirestore(this.auth.app);
    await addDoc(collection(db, `users/${user.uid}/queries`), {
      q,
      result,
      createdAt: serverTimestamp(),
    });
  }
}
