import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyService } from '../../services/currency.service';
import { CurrencyIncomeType } from '../../models/Currency';

type SaveState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-admin-currency',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-currency.component.html',
  styleUrl: './admin-currency.component.css',
})
export class AdminCurrencyComponent implements OnInit {
  private currencyService = inject(CurrencyService);

  currencyName = '';
  iconUrl = '';
  incomeTypes = this.currencyService.incomeTypes;
  settingsState = signal<SaveState>('idle');
  incomeTypesState = signal<SaveState>('idle');

  constructor() {
    effect(() => {
      const s = this.currencyService.settings();
      this.currencyName = s.currency_name;
      this.iconUrl = s.icon_url;
    });
  }

  ngOnInit(): void {
    this.currencyService.loadSettings();
    this.currencyService.loadIncomeTypes();
  }

  saveSettings(): void {
    this.settingsState.set('loading');
    this.currencyService.updateSettings({ currency_name: this.currencyName, icon_url: this.iconUrl }).subscribe({
      next: () => this.flash(this.settingsState, 'success'),
      error: (err) => {
        console.error('Failed to save currency settings', err);
        this.flash(this.settingsState, 'error');
      }
    });
  }

  saveIncomeTypes(): void {
    this.incomeTypesState.set('loading');
    this.currencyService.updateIncomeTypes(this.incomeTypes()).subscribe({
      next: () => this.flash(this.incomeTypesState, 'success'),
      error: (err) => {
        console.error('Failed to save income types', err);
        this.flash(this.incomeTypesState, 'error');
      }
    });
  }

  updateIncomeType(type: CurrencyIncomeType, patch: Partial<CurrencyIncomeType>): void {
    this.currencyService.patchIncomeType(type.key, patch);
  }

  private flash(state: ReturnType<typeof signal<SaveState>>, value: 'success' | 'error'): void {
    state.set(value);
    setTimeout(() => state.set('idle'), 3000);
  }
}
