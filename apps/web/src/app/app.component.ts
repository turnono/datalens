import { Component } from "@angular/core";
import { RouterLink, RouterOutlet } from "@angular/router";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [RouterLink, RouterOutlet],
  template: `
    <div class="container">
      <header
        class="row"
        style="justify-content: space-between; margin-bottom: 16px;"
      >
        <a routerLink="/" style="text-decoration:none; color:inherit"
          ><h2>DataLens</h2></a
        >
        <nav class="row" style="gap:12px;">
          <a routerLink="/saved">Saved</a>
          <a routerLink="/login">Login</a>
        </nav>
      </header>
      <router-outlet />
    </div>
  `,
})
export class AppComponent {}
