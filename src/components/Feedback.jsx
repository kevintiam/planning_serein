/** Messages réutilisables, annoncés par les lecteurs d'écran. */
/**
 * @param error message d'erreur (role=alert : lu immédiatement par les lecteurs d'écran)
 * @param message message de succès (role=status : lu sans interrompre)
 */
export default function Feedback({ error, message }) {
  return (
    <>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="notice success" role="status">
          {message}
        </p>
      )}
    </>
  );
}
