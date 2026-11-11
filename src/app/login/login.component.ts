import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user.service';

type ResetStep = 'enter_pin' | 'enter_new_password' | 'show_codes';

@Component({
  selector: 'app-login',
  host: { class: 'pun-page' },
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private userService = inject(UserService);

  isLoading = signal(false);
  archivedReason = signal<string | null>(null);
  resetStep = signal<ResetStep | null>(null);
  resetUsername = signal('');
  resetSecurityCode = signal('');
  resetError = signal<string | null>(null);
  resetCodes = signal<string[]>([]);

  private pendingAuthResponse: any = null;
  private pendingHashedPassword = '';

  loginForm = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  pinForm = this.fb.group({
    pin: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
  });

  newPasswordForm = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  isFieldInvalid(field: string) {
    const control = this.loginForm.get(field);
    return control ? control.invalid && control.touched : false;
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      const credentials = this.loginForm.value;
      const password = credentials.password || '';

      this.authService.login(credentials as any).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.authService.hashPassword(password).then(hashedPassword => {
            this.userService.loadAndDecryptPrivateKey(hashedPassword).subscribe();
          });
        },
        error: (err) => {
          this.isLoading.set(false);
          if (err.status === 401 && err.error?.error === 'password_reset_required') {
            this.resetUsername.set(credentials.username || '');
            this.resetStep.set('enter_pin');
          } else if (err.status === 403) {
            this.archivedReason.set(err.error?.reason ?? null);
          }
        }
      });
    }
  }

  onSubmitPin() {
    if (this.pinForm.invalid) return;
    this.isLoading.set(true);
    this.resetError.set(null);
    const pin = this.pinForm.value.pin!;

    this.authService.verifyAdminResetCode(this.resetUsername(), pin).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.resetSecurityCode.set(res.security_code);
        this.resetStep.set('enter_new_password');
      },
      error: () => {
        this.isLoading.set(false);
        this.resetError.set($localize`:@@login.invalidPin:Invalid or expired PIN`);
      }
    });
  }

  onCodesAcknowledged() {
    this.authService.handleAuthResponse(this.pendingAuthResponse);
    this.userService.loadAndDecryptPrivateKey(this.pendingHashedPassword).subscribe();
  }

  onSubmitNewPassword() {
    if (this.newPasswordForm.invalid) return;
    this.isLoading.set(true);
    this.resetError.set(null);
    const password = this.newPasswordForm.value.password!;
    const codes = this.userService.generateRecoveryCodes(8);

    this.authService.hashPassword(password).then(hashedPassword => {
      this.userService.completePasswordReset(this.resetSecurityCode(), password, hashedPassword, codes).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          this.pendingAuthResponse = res;
          this.pendingHashedPassword = hashedPassword;
          this.resetCodes.set(codes);
          this.resetStep.set('show_codes');
        },
        error: () => {
          this.isLoading.set(false);
          this.resetError.set($localize`:@@login.resetFailed:Password reset failed. Please try again.`);
        }
      });
    });
  }
}
