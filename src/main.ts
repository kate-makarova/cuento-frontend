/// <reference types="@angular/localize" />

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { loadTranslations } from '@angular/localize';

const storedLocale = localStorage.getItem('locale');

if (storedLocale === 'ru-RU') {
  import('./locale/ru').then(module => {
    loadTranslations(module.TRANSLATIONS_RU);
    bootstrapApplication(AppComponent, appConfig)
      .catch((err) => console.error(err));
  });
} else {
  bootstrapApplication(AppComponent, appConfig)
    .catch((err) => console.error(err));
}
