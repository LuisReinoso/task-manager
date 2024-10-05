import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class OpenAIService {
  private apiKey = environment.OpenAiApiKey;
  private endpoint = 'https://api.openai.com/v1/chat/completions';

  constructor(private http: HttpClient) {}

  public generateSubtasks(prompt: string): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    });

    const body = {
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: `Provide a list of actionable and precise steps in spanish,use the next JSON format { actions: [{ title: "Step description" }] } to complete the task: "${prompt}`,
        },
      ],
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    };

    return this.http.post<any>(this.endpoint, body, { headers });
  }
}
