import React from 'react';

const ICON_MAP = {
  // Educativo / Aula
  school: '🏫',
  task: '📝',
  grade: '📊',
  assignment_ind: '📋',
  people: '👥',
  badge: '👨‍🏫',
  menu_book: '📖',
  meeting_room: '🚪',
  co_present: '👨‍🏫',
  how_to_reg: '✍️',
  folder_shared: '📂',
  // Sistema / Seguridad
  settings: '⚙️',
  manage_accounts: '👤',
  security: '🔐',
  history: '📜',
  dashboard: '📊'
};

export default function SubmoduleIcon({ icon, name, fallback = '📄', style = {}, size }) {
  const iconKey = icon || name;
  const emoji = ICON_MAP[iconKey] || fallback;
  return <span style={{ fontSize: size ? `${size}px` : '1.2rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}>{emoji}</span>;
}
