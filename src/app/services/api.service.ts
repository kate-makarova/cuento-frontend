import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SseEvent { event: string; data: any; }

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly apiUrl = environment.apiUrl;

  private getHeaders(): HttpHeaders {
    let headers = new HttpHeaders();
    const token = this.authService.authToken();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }

  get<T>(endpoint: string, params?: HttpParams): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${endpoint}`, {
      headers: this.getHeaders(),
      params
    });
  }

  getText(endpoint: string): Observable<string> {
    return this.http.get(`${this.apiUrl}/${endpoint}`, {
      headers: this.getHeaders(),
      responseType: 'text'
    });
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, body, {
      headers: this.getHeaders()
    });
  }

  postForm<T>(endpoint: string, formData: FormData): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, formData, {
      headers: this.getHeaders()
    });
  }

  put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${endpoint}`, body, {
      headers: this.getHeaders()
    });
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}/${endpoint}`, {
      headers: this.getHeaders()
    });
  }

  // POST a FormData body and stream the SSE response. EventSource only supports
  // GET, so we use fetch() + ReadableStream here.
  postFormStream(endpoint: string, formData: FormData): Observable<SseEvent> {
    return new Observable(observer => {
      const token = this.authService.authToken();
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      fetch(`${this.apiUrl}/${endpoint}`, { method: 'POST', headers, body: formData })
        .then(async response => {
          if (!response.ok) { observer.error(new Error(`HTTP ${response.status}`)); return; }
          const reader = response.body!.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          while (true) {
            const { done, value } = await reader.read();
            if (done) { observer.complete(); break; }
            buffer += decoder.decode(value, { stream: true });
            const parts = buffer.split('\n\n');
            buffer = parts.pop() ?? '';
            for (const part of parts) {
              if (!part.trim()) continue;
              let event = 'message', dataStr = '';
              for (const line of part.split('\n')) {
                if (line.startsWith('event:')) event = line.slice(6).trim();
                else if (line.startsWith('data:')) dataStr = line.slice(5).trim();
              }
              try { observer.next({ event, data: JSON.parse(dataStr) }); }
              catch { observer.next({ event, data: dataStr }); }
            }
          }
        })
        .catch(err => observer.error(err));
    });
  }
}
