import { bootstrapApplication } from "@angular/platform-browser";
import { provideHttpClient, withFetch } from "@angular/common/http";
import { provideRouter, Routes } from "@angular/router";
import { AppComponent } from "./app/app.component";
import { importProvidersFrom } from "@angular/core";
import { provideAnimations } from "@angular/platform-browser/animations";
import { AuthService } from "./app/services/auth.service";

const authGuard = () => {
  const svc = new AuthService();
  return !!svc.user();
};

const routes: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./app/pages/query-page.component").then(
        (m) => m.QueryPageComponent
      ),
  },
  {
    path: "login",
    loadComponent: () =>
      import("./app/pages/login-page.component").then(
        (m) => m.LoginPageComponent
      ),
  },
  {
    path: "saved",
    loadComponent: () =>
      import("./app/pages/saved-page.component").then(
        (m) => m.SavedPageComponent
      ),
    canActivate: [authGuard],
  },
  { path: "**", redirectTo: "" },
];

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withFetch()),
    provideRouter(routes),
    provideAnimations(),
  ],
}).catch((err) => console.error(err));
