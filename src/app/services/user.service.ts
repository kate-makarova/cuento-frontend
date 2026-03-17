import { Injectable, signal, inject } from '@angular/core';
import { ApiService } from './api.service';
import { UserShort } from '../models/UserShort';
import { UserProfileResponse, UpdateSettingsRequest, User, UpdateSettingsResponse, UserListItem } from '../models/User';
import { Observable, from } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class UserService {
  private apiService = inject(ApiService);

  private usersOnPageSignal = signal<UserShort[]>([]);
  readonly usersOnPage = this.usersOnPageSignal.asReadonly();

  private userProfileSignal = signal<UserProfileResponse | null>(null);
  readonly userProfile = this.userProfileSignal.asReadonly();

  private userListSignal = signal<UserListItem[]>([]);
  readonly userList = this.userListSignal.asReadonly();

  loadUsersOnPage(pageType: string, pageId: number): void {
    this.apiService.get<UserShort[]>(`users/page/${pageType}/${pageId}`).subscribe({
      next: (data) => {
        this.usersOnPageSignal.set(data);
      },
      error: (err) => {
        console.error('Failed to load users on page', err);
        this.usersOnPageSignal.set([]);
      }
    });
  }

  loadUserProfile(userId: number): void {
    this.apiService.get<UserProfileResponse>(`user/profile/${userId}`).subscribe({
      next: (data) => {
        this.userProfileSignal.set(data);
      },
      error: (err) => {
        console.error('Failed to load user profile', err);
        this.userProfileSignal.set(null);
      }
    });
  }

  loadUserList(): void {
    this.apiService.get<UserListItem[]>('user/list').subscribe({
      next: (data) => {
        this.userListSignal.set(data);
      },
      error: (err) => {
        console.error('Failed to load user list', err);
        this.userListSignal.set([]);
      }
    });
  }

  updateUserSettings(settings: UpdateSettingsRequest): Observable<User> {
    return this.apiService.post<UpdateSettingsResponse>('user/settings/update', settings).pipe(
      map(response => response.user)
    );
  }

  generateAndSaveKeys(hashedPassword: string, recoveryCodes: string[]): Observable<any> {
    return from(this.buildKeysPayload(hashedPassword, recoveryCodes)).pipe(
      switchMap(payload => this.apiService.post('user/save-keys', payload))
    );
  }

  private async buildKeysPayload(hashedPassword: string, recoveryCodes: string[]): Promise<any> {
    const keyPair = await crypto.subtle.generateKey(
      { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
      true,
      ['encrypt', 'decrypt']
    );

    const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);

    const passphrases = [hashedPassword, ...recoveryCodes];
    const encryptedKeys = await Promise.all(passphrases.map(p => this.encryptPrivateKey(keyPair.privateKey, p)));

    return {
      private_keys: encryptedKeys,
      public_key: { key: this.bufferToBase64(publicKeyBuffer) }
    };
  }

  private async encryptPrivateKey(privateKey: CryptoKey, passphrase: string): Promise<{ encrypted_key: string; salt: string; iv: string }> {
    const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', privateKey);

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(passphrase),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    const aesKey = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    const encryptedBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, privateKeyBuffer);

    return {
      encrypted_key: this.bufferToBase64(encryptedBuffer),
      salt: this.bufferToBase64(salt),
      iv: this.bufferToBase64(iv)
    };
  }

  private bufferToBase64(buffer: ArrayBuffer): string {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)));
  }
}
