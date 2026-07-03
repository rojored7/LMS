import React, { useState, useEffect } from 'react';
import { Modal } from '../../common/Modal';
import type { BadgeItem } from './BadgesTab';

interface AwardBadgeModalProps {
  isOpen: boolean;
  badge: BadgeItem | null;
  onClose: () => void;
  onAward: (userId: string) => Promise<void>;
}

const AwardBadgeModal: React.FC<AwardBadgeModalProps> = ({
  isOpen,
  badge,
  onClose,
  onAward,
}) => {
  const [userId, setUserId] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setUserId('');
      setSaving(false);
    }
  }, [isOpen]);

  const handleAward = async () => {
    if (!userId.trim()) return;
    setSaving(true);
    try {
      await onAward(userId.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Otorgar Badge: ${badge?.name || ''}`}
      size="sm"
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            ID del usuario
          </label>
          <input
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
            placeholder="Pega el ID del usuario aqui"
          />
          <p className="text-xs text-gray-500 mt-1">
            Puedes obtener el ID desde la tabla de Leaderboard o Usuarios
          </p>
        </div>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={handleAward}
            disabled={saving || !userId.trim()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Otorgando...' : 'Otorgar'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default AwardBadgeModal;
