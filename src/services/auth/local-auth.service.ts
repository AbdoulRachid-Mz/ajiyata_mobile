import * as LocalAuthentication from 'expo-local-authentication';

export class LocalAuthService {
  private static instance: LocalAuthService;

  private constructor() {}

  static getInstance(): LocalAuthService {
    if (!LocalAuthService.instance) {
      LocalAuthService.instance = new LocalAuthService();
    }
    return LocalAuthService.instance;
  }

  /**
   * Vérifie si l'appareil a le matériel biométrique nécessaire
   */
  async hasHardware(): Promise<boolean> {
    return await LocalAuthentication.hasHardwareAsync();
  }

  /**
   * Vérifie si l'utilisateur a enregistré des données biométriques (empreinte, FaceID, etc.)
   */
  async isEnrolled(): Promise<boolean> {
    return await LocalAuthentication.isEnrolledAsync();
  }

  /**
   * Vérifie si l'authentification biométrique est complètement disponible
   */
  async isAvailable(): Promise<boolean> {
    const hasHardware = await this.hasHardware();
    const isEnrolled = await this.isEnrolled();
    return hasHardware && isEnrolled;
  }

  /**
   * Obtient les types de biométrie supportés par l'appareil
   */
  async getSupportedTypes(): Promise<LocalAuthentication.AuthenticationType[]> {
    return await LocalAuthentication.supportedAuthenticationTypesAsync();
  }

  /**
   * Demande l'authentification à l'utilisateur (Biométrie ou PIN de l'appareil)
   * Cette méthode sert uniquement à vérifier l'identité de l'utilisateur pour déverrouiller l'app,
   * elle ne retourne aucun token de session réseau.
   */
  async authenticate(promptMessage: string = 'Déverrouiller Ajiya Ta'): Promise<boolean> {
    try {
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        return false;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage,
        fallbackLabel: 'Utiliser le code PIN',
        disableDeviceFallback: false, // Permet d'utiliser le PIN du tel si la biométrie échoue
        cancelLabel: 'Annuler',
      });

      return result.success;
    } catch (error) {
      console.error('Erreur lors de l\'authentification biométrique:', error);
      return false;
    }
  }
}

export const localAuthService = LocalAuthService.getInstance();
