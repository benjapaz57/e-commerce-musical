import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GeoService {
  private readonly http = inject(HttpClient);
  readonly provincias$: Observable<string[]> = this.http.get<string[]>('/api/geo/provincias').pipe(shareReplay(1));
}
