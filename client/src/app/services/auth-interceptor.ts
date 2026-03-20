import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth-service';
import { tap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const accessToken = authService.getAccessToken();
  const refreshToken = authService.getRefreshToken();
  const authReq = req.clone({
    setHeaders: { authorization: accessToken, refreshToken: refreshToken }
  });
  return next(authReq).pipe(
    tap(event => {
      if (event instanceof HttpResponse) {
        const accessToken = event.headers.get('authorization');
        const refreshToken = event.headers.get('refreshToken');
        if (accessToken && accessToken !== null) {
          authService.setAccessToken(accessToken);
        }
        if (refreshToken && refreshToken !== null) {
          authService.setRefreshToken(refreshToken);
        }
      }
    })
  );
};
