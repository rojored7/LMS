import React, { useState, useEffect } from 'react';
import { Modal } from '../../common/Modal';
import gamificationService from '../../../services/api/gamification.service';
import type { LeaderboardEntry, XpTransaction } from '../../../services/api/gamification.service';

interface XpHistoryModalProps {
  isOpen: boolean;
  user: LeaderboardEntry | null;
  onClose: () => void;
}

const SOURCE_LABELS: Record<string, string> = {
  manual: 'Ajuste manual',
  course_completion: 'Curso completado',
  badge_award: 'Badge otorgado',
};

const XpHistoryModal: React.FC<XpHistoryModalProps> = ({
  isOpen,
  user,
  onClose,
}) => {
  const [history, setHistory] = useState<XpTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setLoading(true);
      gamificationService
        .getUserXpHistory(user.id, 1, 50)
        .then((res) => setHistory(res.data))
        .catch(() => setHistory([]))
        .finally(() => setLoading(false));
    }
  }, [isOpen, user]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Historial XP - ${user?.name || ''}`}
      size="lg"
    >
      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : history.length === 0 ? (
        <div className="p-8 text-center text-gray-500">Sin transacciones de XP</div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {history.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{tx.reason}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {SOURCE_LABELS[tx.source] || tx.source}
                  {' - '}
                  {new Date(tx.createdAt).toLocaleDateString('es', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <span
                className={`font-bold text-sm ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}
              >
                {tx.amount >= 0 ? '+' : ''}
                {tx.amount} XP
              </span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default XpHistoryModal;
