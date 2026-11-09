'use client';
/** Petite fenêtre de confirmation native : focus confiné, Échap pour annuler. */
import { useEffect, useRef } from 'react';
/**
 * Fenêtre de confirmation réutilisable.
 * @param title question posée
 * @param children texte explicatif
 * @param confirmLabel libellé du bouton de validation
 * @param onConfirm / onCancel actions des deux boutons
 * @param busy désactive les boutons pendant l'action
 */
export default function ConfirmDialog({ title, children, confirmLabel, onConfirm, onCancel, busy }) {
  const dialog = useRef(null);
  // Ouvre le <dialog> natif en mode modal dès son affichage.
  useEffect(() => {
    dialog.current.showModal();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="confirm"
      aria-labelledby="confirm-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onCancel();
      }}
    >
      <h2 id="confirm-title">{title}</h2>
      <div className="confirm-body">{children}</div>
      <div className="confirm-actions">
        {/* Le focus démarre sur « Annuler » : Entrée ne confirme pas par accident. */}
        <button type="button" onClick={onCancel} disabled={busy} autoFocus>
          Annuler
        </button>
        <button type="button" className="primary" onClick={onConfirm} disabled={busy}>
          {busy ? 'Veuillez patienter…' : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
