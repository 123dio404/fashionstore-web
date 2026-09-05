import { HttpInterceptorFn } from '@angular/common/http';

import { environment } from '../../../environments/environment';

export const jwtInterceptor: HttpInterceptorFn = (request, next) => {
  const token = localStorage.getItem('fashionstore_access_token');
  if (!token || !request.url.startsWith(environment.apiUrl)) {
    return next(request);
  }
  return next(request.clone({
    setHeaders: { Authorization: `Bearer ${token}` }
  }));
};
