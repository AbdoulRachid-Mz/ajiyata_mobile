import errors from "@/configs/locales/errors.json";

type FirebaseErrorsType = {
  [key: string]: string; // Typage pour chaque code d'erreur
};

type FirebaseErrors = {
  [key: string]: FirebaseErrorsType; // Typage pour chaque méthode Firebase
};

// Ajouter les erreurs et une erreur "inconnue" si elle est définie dans errors.json
const firebaseErrors: FirebaseErrors = {
  ...errors,
  unknown: {
    unknown: errors.unknown
  }
};

/**
 * Récupère le message d'erreur Firebase formaté en fonction de la méthode et du code d'erreur.
 * @param method - Le nom de la méthode Firebase utilisée (ex: 'createUserWithEmailAndPassword').
 * @param errorCode - Le code d'erreur renvoyé par Firebase (ex: 'auth/invalid-email').
 * @returns Le message d'erreur formaté ou un message par défaut si l'erreur n'est pas reconnue.
 */
export function getFirebaseErrorMessage(
  method: string,
  errorCode: string
): string {

  // Message d'erreur par défaut si aucune erreur spécifique n'est trouvée
  const defaultErrorMessage = 
  errors.unknown;

  // Vérifier si la méthode existe dans les erreurs définies
  if (!firebaseErrors[method]) {
    return defaultErrorMessage;
  }

  // Vérifier si le code d'erreur existe pour cette méthode
  if (!firebaseErrors[method][errorCode]) {
    return defaultErrorMessage;
  }

  const errorMessage = firebaseErrors[method][errorCode];
  
  // Retourner le message d'erreur correspondant
  return errorMessage;
}