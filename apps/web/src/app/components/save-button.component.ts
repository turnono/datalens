import { Component, Input, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HistoryService } from "../services/history.service";
import type { QueryResult } from "@datalens/shared";

@Component({
  standalone: true,
  selector: "dl-save-button",
  imports: [CommonModule],
  template: `
    <button class="btn" (click)="save()" [disabled]="busy()">Save</button>
    <span class="muted" *ngIf="msg()" style="margin-left:8px;">{{
      msg()
    }}</span>
  `,
})
export class SaveButtonComponent {
  @Input() q: string = "";
  @Input() result!: QueryResult;
  busy = signal(false);
  msg = signal<string | null>(null);

  constructor(private history: HistoryService) {}

  async save() {
    if (!this.result) return;
    this.busy.set(true);
    this.msg.set(null);
    try {
      await this.history.save(this.q, this.result);
      this.msg.set("Saved");
    } catch (e: any) {
      this.msg.set(e?.message || "Failed");
    } finally {
      this.busy.set(false);
    }
  }
}
