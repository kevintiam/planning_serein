/** Erreur métier affichable au client ; les erreurs techniques restent masquées. */
export class AppError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
