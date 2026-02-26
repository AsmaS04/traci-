import { ApplicationConfig, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { TranslationService } from './service/translation.service';

function initTranslations(i18n: TranslationService) {
  return () => i18n.loadTranslations('en');
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    {
      provide: APP_INITIALIZER,
      useFactory: initTranslations,
      deps: [TranslationService],
      multi: true,
    },
  ],
};