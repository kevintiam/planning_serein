/** Erreur métier affichable au client ; les erreurs techniques restent masquées. */
export class AppError extends Error {
  /**
   * @param message texte montré à l’utilisateur
   * @param status code HTTP renvoyé (400 par défaut)
   */
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
