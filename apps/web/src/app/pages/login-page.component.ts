import { Component, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";

@Component({
  standalone: true,
  selector: "dl-login-page",
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <h3>Login</h3>
      <div class="muted" style="margin-bottom:8px;">
        Use email/password. No verification in this stub.
      </div>
      <form
        (ngSubmit)="login()"
        class="row"
        style="flex-direction: column; gap: 8px;"
      >
        <input
          class="input"
          [(ngModel)]="email"
          name="email"
          placeholder="Email"
        />
        <input
          class="input"
          [(ngModel)]="password"
          name="password"
          type="password"
          placeholder="Password"
        />
        <div class="row" style="gap:8px;">
          <button class="btn" type="submit">Login</button>
          <button class="btn" type="button" (click)="signup()">
            Create account
          </button>
        </div>
      </form>
      <div *ngIf="message()" class="muted" style="margin-top:8px;">
        {{ message() }}
      </div>
    </div>
  `,
})
export class LoginPageComponent {
  email = "";
  password = "";
  message = signal<string | null>(null);

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

  async login() {
    try {
      const auth = getAuth(this.app);
      await signInWithEmailAndPassword(auth, this.email, this.password);
      this.message.set("Logged in.");
    } catch (e: any) {
      this.message.set(e?.message || "Login failed");
    }
  }

  async signup() {
    try {
      const auth = getAuth(this.app);
      await createUserWithEmailAndPassword(auth, this.email, this.password);
      this.message.set("Account created. You are logged in.");
    } catch (e: any) {
      this.message.set(e?.message || "Signup failed");
    }
  }
}
