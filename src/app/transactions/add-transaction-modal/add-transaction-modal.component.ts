import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CurrencyService } from '../../services/currency.service';
import { AddTransactionRequest, CurrencyIncomeType } from '../../models/Currency';

export const CUSTOM_KEY = '__custom__';
const KEYS_WITH_POST_LINK = new Set(['currency_income_game_post']);

@Component({
  selector: 'app-add-transaction-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './add-transaction-modal.component.html',
})
export class AddTransactionModalComponent {
  @Input() userId!: number;
  @Input() incomeTypes: CurrencyIncomeType[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<void>();

  private currencyService = inject(CurrencyService);

  readonly customKey = CUSTOM_KEY;

  amount: number | null = null;
  type: 'income' | 'spend' = 'income';
  incomeTypeKey: string = '';
  note = '';
  topicId: number | null = null;
  postId: number | null = null;
  saving = false;
  error = '';

  get isCustom(): boolean {
    return this.incomeTypeKey === CUSTOM_KEY;
  }

  get hasPostLink(): boolean {
    return KEYS_WITH_POST_LINK.has(this.incomeTypeKey);
  }

  onSubmit() {
    if (!this.amount) return;

    const req: AddTransactionRequest = {
      amount: this.amount,
      type: this.type,
      income_type_key: this.isCustom ? null : (this.incomeTypeKey || null),
      metadata: this.isCustom
        ? { note: this.note || null }
        : this.hasPostLink && (this.topicId || this.postId)
          ? { topic_id: this.topicId ?? undefined, post_id: this.postId ?? undefined }
          : null,
    };

    this.saving = true;
    this.error = '';
    this.currencyService.addTransaction(this.userId, req).subscribe({
      next: () => {
        this.saving = false;
        this.created.emit();
        this.close.emit();
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.message ?? $localize`:@@addTransaction.error:Failed to add transaction.`;
      },
    });
  }

  onCancel() {
    this.close.emit();
  }
}
