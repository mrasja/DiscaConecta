import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId:   'com.discaconecta.app',
  appName: 'DiscaConecta',
  webDir:  'out',
  server: {
    //url:       'http://10.0.2.2:3000/dashboard',
    // /dashboard (no la landing "/") — reparte según sesión: sin cuenta va al
    // buscador público, alumno/profesional van directo a su panel.
    url: 'http://192.168.0.33:3000/dashboard',
    cleartext: true,
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com'],
    },
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#4f46e5',   // indigo-600
      androidSplashResourceName: 'splash',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
  },
};

export default config;