import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import type { QueryRequest, QueryResult } from "@datalens/shared";

declare const window: any;

@Injectable({ providedIn: "root" })
export class ApiService {
  private apiBaseUrl: string;

  constructor(private http: HttpClient) {
    this.apiBaseUrl = window.env?.API_BASE_URL || "/api";
  }

  query(body: QueryRequest) {
    return this.http.post<QueryResult>(`${this.apiBaseUrl}/query`, body);
  }
}
