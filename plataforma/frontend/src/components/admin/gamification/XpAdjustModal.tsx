import React, { useState, useEffect } from 'react';
import { Modal } from '../../common/Modal';
import type { LeaderboardEntry } from '../../../services/api/gamification.service';

interface XpAdjustModalProps {
  isOpen: boolean;
  target: LeaderboardEntry | null;
  onClose: () => void;
  onSave: (amount: number, reason: string) => Promise<void>;
}

const XpAdjustModal: React.FC<XpAdjustModalProps> = ({
  isOpen,
  target,
  onClose,
  onSave,
}) => {
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount(0);
      setReason('');
      setSaving(false);
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (amount === 0 || !reason.trim()) return;
    setSaving(true);
    try {
      await onSave(amount, reason.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Ajustar XP - ${target?.name || ''}`}
      size="sm"
    >
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            XP actual: <span className="font-bold text-yellow-600">{target?.xp || 0}</span>
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Cantidad (positivo para sumar, negativo para restar)
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Razon *
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Motivo del ajuste..."
          />
        </div>
        {amount !== 0 && (
          <p className="text-sm">
            Resultado:{' '}
            <span className="font-bold">{Math.max(0, (target?.xp || 0) + amount)} XP</span>
          </p>
        )}
        <div className="flex justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || amount === 0 || !reason.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Ajustar XP'}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default XpAdjustModal;
