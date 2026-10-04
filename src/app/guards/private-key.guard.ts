import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map, take } from 'rxjs/operators';

export const privateKeyGuard: CanActivateFn = () => {
  const userService = inject(UserService);
  const router = inject(Router);

  if (userService.privateKeyResolved()) {
    return userService.privateKey() ? true : router.createUrlTree(['/403']);
  }

  return toObservable(userService.privateKeyResolved).pipe(
    filter(resolved => resolved),
    take(1),
    map(() => userService.privateKey() ? true : router.createUrlTree(['/403']))
  );
};
