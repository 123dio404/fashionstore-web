export const environment = {
  production: true,
  // ⚠️ ÚNICA LÍNEA A CAMBIAR AL DESPLEGAR: dominio público de la API (incluye /api/v1 al final).
  // En Docker se puede sobreescribir con el build-arg API_URL (ver DEPLOY.md).
  apiUrl: 'https://api.fashionstore.example.com/api/v1',
  appVersion: '3.2.1'
};
