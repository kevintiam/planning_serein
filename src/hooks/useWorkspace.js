'use client';
/** Composition des hooks ; la vue reçoit uniquement des données et actions. */
import { useState } from 'react';
import { usePlanning } from './usePlanning.js';
import { useDeclaration } from './useDeclaration.js';
/**
 * Assemble tout l'état de l'espace (planning, déclaration, onglets, fenêtres).
 * Workspace.jsx ne fait qu'afficher ce que ce hook renvoie.
 */
export function useWorkspace(user) {
  const planning = usePlanning();
  const declaration = useDeclaration(user, planning.month, planning.data, planning.reload);
  // Onglet par défaut : le planning pour l'admin, les disponibilités pour un participant.
  const [tab, setTab] = useState(user.role === 'admin' ? 'planning' : 'disponibilites');
  // Date de la fenêtre « Attribuer une tâche » ('' = fenêtre fermée).
  const [taskDay, setTaskDay] = useState('');
  // true = la fenêtre de confirmation du code d'invitation est ouverte.
  const [inviteAsked, setInviteAsked] = useState(false);
  // Demande confirmation avant de perdre des changements non enregistrés.
  const allowLeave = () =>
    !declaration.dirty || window.confirm('Les modifications non enregistrées seront perdues. Continuer ?');
  return {
    ...planning,
    declaration,
    tab,
    setTab,
    taskDay,
    setTaskDay,
    changeMonth: (amount) => {
      if (allowLeave()) planning.moveMonth(amount);
    },
    signOut: () => {
      if (allowLeave()) planning.logout();
    },
    /** Le code n'est régénéré qu'après confirmation dans la petite fenêtre. */
    inviteAsked,
    askInvite: () => setInviteAsked(true),
    cancelInvite: () => setInviteAsked(false),
    confirmInvite: async () => {
      await planning.invite();
      setInviteAsked(false);
    },
    // Après la création d'une tâche : recharger le mois et fermer la fenêtre.
    taskSaved: async () => {
      await planning.reload();
      setTaskDay('');
    },
  };
}
