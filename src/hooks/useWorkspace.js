'use client';
/** Composition des hooks ; la vue reçoit uniquement des données et actions. */
import { useState } from 'react';
import { usePlanning } from './usePlanning.js';
import { useDeclaration } from './useDeclaration.js';
export function useWorkspace(user) {
  const planning = usePlanning();
  const declaration = useDeclaration(user, planning.month, planning.data, planning.reload);
  const [tab, setTab] = useState(user.role === 'admin' ? 'planning' : 'disponibilites');
  const [taskDay, setTaskDay] = useState('');
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
    taskSaved: async () => {
      await planning.reload();
      setTaskDay('');
    },
  };
}
