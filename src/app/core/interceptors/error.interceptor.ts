import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { SyncManagerService } from '../services/sync-manager.service';

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  const sync = inject(SyncManagerService);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      let message = 'No fue posible completar la solicitud.';

      if (error.status === 0) {
        sync.setOnline(false);
        message = 'No se pudo conectar con el servidor (sin conexión o backend suspendido). Las operaciones se conservan localmente.';
      } else if (error.status === 502 || error.status === 503 || error.status === 504) {
        message = 'El servidor en Render se está iniciando. Por favor espera 30 segundos y vuelve a intentar.';
      } else if (error.status === 401) {
        message = 'Correo o contraseña incorrectos. Verifica tus credenciales (ej. admin123).';
      } else if (error.error?.detail) {
        const detail = error.error.detail;
        if (typeof detail === 'string') {
          message = detail === 'Incorrect email or password'
            ? 'Correo o contraseña incorrectos. Verifica tus credenciales (ej. admin123).'
            : detail;
        } else if (Array.isArray(detail)) {
          message = detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
        }
      } else if (error.message) {
        message = error.message;
      }

      return throwError(() => new Error(message));
    })
  );
};
