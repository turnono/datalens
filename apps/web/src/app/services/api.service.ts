import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import type { QueryRequest, QueryResult } from "@datalens/shared";

@Injectable({ providedIn: "root" })
export class ApiService {
  constructor(private http: HttpClient) {}

  query(body: QueryRequest) {
    return this.http.post<QueryResult>("/api/query", body);
  }
}
