import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  en: {
    translation: {
      "welcome": "Welcome to ARES Portal",
      "login": "Login",
      "logout": "Logout",
      "dashboard": "Dashboard",
      "profile": "Profile",
      "settings": "Settings",
      "search": "Search",
      "notifications": "Notifications"
    }
  },
  es: {
    translation: {
      "welcome": "Bienvenido al Portal ARES",
      "login": "Iniciar sesión",
      "logout": "Cerrar sesión",
      "dashboard": "Panel de control",
      "profile": "Perfil",
      "settings": "Configuración",
      "search": "Buscar",
      "notifications": "Notificaciones"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
