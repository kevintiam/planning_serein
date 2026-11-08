/** Messages réutilisables, annoncés par les lecteurs d'écran. */
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
