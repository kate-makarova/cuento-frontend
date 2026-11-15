import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-recovery-codes',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './recovery-codes.component.html',
})
export class RecoveryCodesComponent implements OnInit {
  codes: string[] = [];

  constructor(private router: Router) {}

  ngOnInit() {
    const state = history.state;
    if (!state?.codes?.length) {
      this.router.navigate(['/']);
      return;
    }
    this.codes = state.codes;
  }
}
