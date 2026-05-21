export interface GeoPosition {
  lat: number;
  lng: number;
}

// Capacitor Geolocation en Android/iOS, navigator.geolocation en web
export async function getCurrentPosition(): Promise<GeoPosition> {
  try {
    const { Geolocation } = await import('@capacitor/geolocation');

    // Pedir permiso explícitamente en nativo
    const perm = await Geolocation.requestPermissions();
    if (perm.location !== 'granted') {
      throw new Error('Permiso de ubicación denegado');
    }

    const pos = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 10000,
    });

    return {
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
    };
  } catch (capacitorError) {
    // Fallback a Web API (funciona en browser desktop/PWA)
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocalización no disponible'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        err => reject(err),
        { enableHighAccuracy: true, timeout: 10000 },
      );
    });
  }
}
