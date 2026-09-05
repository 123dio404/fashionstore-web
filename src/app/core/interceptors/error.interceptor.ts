import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (request, next) =>
  next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const detail = error.error?.detail ?? 'No fue posible completar la solicitud.';
      return throwError(() => new Error(typeof detail === 'string' ? detail : 'Error de validación.'));
    })
  );
