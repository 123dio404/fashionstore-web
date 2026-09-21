export const environment = {
  production: true,
  // ⚠️ API desplegada en Render. Para apuntar a otro backend, cambia apiUrl o
  // sobreescríbelo al compilar: docker build --build-arg API_URL=https://.../api/v1
  apiUrl: 'https://fashionstore-backend-ph17.onrender.com/api/v1',
  appVersion: '3.2.1'
};
