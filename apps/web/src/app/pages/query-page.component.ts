import { Component, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { HttpClient } from "@angular/common/http";
import { CommonModule } from "@angular/common";
import type { QueryRequest, QueryResult } from "@datalens/shared";
import { Chart, registerables } from "chart.js";
import { SaveButtonComponent } from "../components/save-button.component";

Chart.register(...registerables);

@Component({
  standalone: true,
  selector: "dl-query-page",
  imports: [CommonModule, FormsModule, SaveButtonComponent],
  template: `
    <div class="card" style="margin-bottom:16px;">
      <div class="row">
        <input
          class="input"
          [(ngModel)]="q"
          placeholder="Ask about public data… e.g., ‘South Africa population 2000–2024’"
        />
        <select [(ngModel)]="mode" class="input" style="max-width:220px;">
          <option value="exploratory">exploratory</option>
          <option value="analytical">analytical</option>
          <option value="generative">generative</option>
        </select>
        <button class="btn" (click)="run()" [disabled]="loading()">Ask</button>
      </div>
      <div class="muted" style="margin-top:8px;" *ngIf="hint">{{ hint }}</div>
    </div>

    <div *ngIf="error()" class="card">{{ error() }}</div>

    <div *ngIf="result() as r">
      <div *ngIf="r.answer" class="card" style="margin-bottom:16px;">
        <h3 style="margin:0 0 8px 0">{{ r.answer.title }}</h3>
        <div>{{ r.answer.note }}</div>
        <div *ngIf="r.answer.value !== undefined" class="muted">
          Value: {{ r.answer.value }} {{ r.answer.unit || "" }}
        </div>
      </div>
      <div *ngIf="hasChart(r)" class="card" style="margin-bottom:16px;">
        <canvas id="chart-canvas" height="160"></canvas>
        <div style="margin-top:8px;">
          <button class="btn" (click)="exportPng()">Export PNG</button>
          <button class="btn" disabled title="Pro only (stub)">
            Export CSV
          </button>
        </div>
      </div>
      <div class="row" style="justify-content:flex-end; margin-bottom:16px;">
        <dl-save-button [q]="q" [result]="r"></dl-save-button>
      </div>
      <div class="card">
        <h4 style="margin:0 0 8px 0">Sources</h4>
        <div *ngIf="!r.sources?.length" class="muted">No sources listed.</div>
        <ul>
          <li *ngFor="let s of r.sources">
            <a [href]="s.url" target="_blank" rel="noopener">{{ s.label }}</a>
          </li>
        </ul>
      </div>
    </div>
  `,
})
export class QueryPageComponent {
  q = "";
  mode: QueryRequest["mode"] = "exploratory";
  loading = signal(false);
  error = signal<string | null>(null);
  result = signal<QueryResult | null>(null);
  chart?: Chart;
  hint =
    "Free tier: 10 queries/month (unauthenticated users share an IP bucket).";

  constructor(private http: HttpClient) {}

  hasChart(r: QueryResult) {
    return (
      !!r.chart && Array.isArray(r.chart.series) && r.chart.series.length > 0
    );
  }

  async run() {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await this.http
        .post<QueryResult>("/api/query", { q: this.q, mode: this.mode })
        .toPromise();
      if (!res) throw new Error("No response");
      this.result.set(res);
      this.renderChart(res);
    } catch (e: any) {
      this.error.set(e?.error?.error || e?.message || "Unknown error");
    } finally {
      this.loading.set(false);
    }
  }

  renderChart(r: QueryResult) {
    const canvas = document.getElementById(
      "chart-canvas"
    ) as HTMLCanvasElement | null;
    if (!canvas || !r.chart) return;
    const datasets = r.chart.series.map((s, idx) => ({
      label: s.label,
      data: s.points.map((p) => ({ x: p.x, y: p.y })),
      borderColor: ["#2563eb", "#16a34a", "#dc2626", "#d97706", "#7c3aed"][
        idx % 5
      ],
      backgroundColor: "transparent",
    }));
    this.chart?.destroy();
    this.chart = new Chart(canvas.getContext("2d")!, {
      type: r.chart.type,
      data: { datasets },
      options: { responsive: true, parsing: false },
    });
  }

  exportPng() {
    const canvas = document.getElementById(
      "chart-canvas"
    ) as HTMLCanvasElement | null;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "chart.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  }
}
