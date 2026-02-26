import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export type Lang = 'en' | 'fr';

@Injectable({ providedIn: 'root' })
export class TranslationService {

  private http = inject(HttpClient);

  lang   = signal<Lang>('en');
  loaded = signal<boolean>(false);

  private translations: Record<string, string> = {};

  // Call once on startup — returns a Promise so it works with APP_INITIALIZER
  async loadTranslations(lang: Lang = 'en'): Promise<void> {
    this.loaded.set(false);
    const data = await firstValueFrom(
      this.http.get<Record<string, string>>(`/assets/i18n/${lang}.json`)
    );
    this.translations = data;
    this.lang.set(lang);
    this.loaded.set(true);
  }

  // Toggle between EN ↔ FR and reload the matching JSON
  async toggle(): Promise<void> {
    const next: Lang = this.lang() === 'en' ? 'fr' : 'en';
    await this.loadTranslations(next);
  }

  t(key: string): string {
    return this.translations[key] ?? key;
  }
}