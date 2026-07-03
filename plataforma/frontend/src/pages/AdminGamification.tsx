import React, { useState, useEffect, useCallback } from 'react';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useUiStore } from '../store/uiStore';
import gamificationService, {
  LeaderboardEntry,
} from '../services/api/gamification.service';
import badgeService from '../services/api/badge.service';
import LeaderboardTab from '../components/admin/gamification/LeaderboardTab';
import BadgesTab, { BadgeItem } from '../components/admin/gamification/BadgesTab';
import XpAdjustModal from '../components/admin/gamification/XpAdjustModal';
import XpHistoryModal from '../components/admin/gamification/XpHistoryModal';
import BadgeFormModal from '../components/admin/gamification/BadgeFormModal';
import AwardBadgeModal from '../components/admin/gamification/AwardBadgeModal';

const AdminGamification: React.FC = () => {
  const { addToast } = useUiStore();
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'badges' | 'config'>('leaderboard');

  // Leaderboard state
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lbPage, setLbPage] = useState(1);
  const [lbTotal, setLbTotal] = useState(0);
  const [lbLoading, setLbLoading] = useState(false);

  // Badges state
  const [badges, setBadges] = useState<BadgeItem[]>([]);
  const [badgesLoading, setBadgesLoading] = useState(false);

  // Modal targets
  const [xpTarget, setXpTarget] = useState<LeaderboardEntry | null>(null);
  const [showXpModal, setShowXpModal] = useState(false);
  const [historyUser, setHistoryUser] = useState<LeaderboardEntry | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingBadge, setEditingBadge] = useState<BadgeItem | null>(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [awardBadge, setAwardBadge] = useState<BadgeItem | null>(null);
  const [showAwardModal, setShowAwardModal] = useState(false);
  const [deleteBadgeTarget, setDeleteBadgeTarget] = useState<BadgeItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadLeaderboard = useCallback(async () => {
    setLbLoading(true);
    try {
      const res = await gamificationService.getLeaderboard(lbPage, 20);
      setLeaderboard(res.data);
      setLbTotal(res.meta.total);
    } catch {
      addToast({ message: 'Error al cargar leaderboard', type: 'error', duration: 5000 });
    } finally {
      setLbLoading(false);
    }
  }, [lbPage]);

  const loadBadges = useCallback(async () => {
    setBadgesLoading(true);
    try {
      const res = await badgeService.getAllBadges();
      setBadges((res as any).data || res || []);
    } catch {
      addToast({ message: 'Error al cargar badges', type: 'error', duration: 5000 });
    } finally {
      setBadgesLoading(false);
    }
  }, []);

  useEffect(() => { loadLeaderboard(); }, [loadLeaderboard]);
  useEffect(() => { if (activeTab === 'badges') loadBadges(); }, [activeTab, loadBadges]);

  // XP adjust
  const handleAdjustXp = async (amount: number, reason: string) => {
    if (!xpTarget) return;
    await gamificationService.adjustUserXp(xpTarget.id, amount, reason);
    addToast({ message: `XP ajustado para ${xpTarget.name}`, type: 'success', duration: 3000 });
    setShowXpModal(false);
    await loadLeaderboard();
  };

  // Badge save
  const handleSaveBadge = async (data: any) => {
    if (!data.name.trim() || !data.slug.trim()) {
      addToast({ message: 'Nombre y slug son requeridos', type: 'error', duration: 3000 });
      return;
    }
    if (editingBadge) {
      await badgeService.updateBadge(editingBadge.id, data);
    } else {
      await badgeService.createBadge(data as any);
    }
    addToast({
      message: editingBadge ? 'Badge actualizado' : 'Badge creado',
      type: 'success',
      duration: 3000,
    });
    setShowBadgeModal(false);
    await loadBadges();
  };

  // Badge delete
  const handleDeleteBadge = async () => {
    if (!deleteBadgeTarget) return;
    setDeleting(true);
    try {
      await badgeService.deleteBadge(deleteBadgeTarget.id);
      addToast({ message: 'Badge eliminado', type: 'success', duration: 3000 });
      setShowDeleteConfirm(false);
      setDeleteBadgeTarget(null);
      await loadBadges();
    } catch {
      addToast({ message: 'Error al eliminar badge', type: 'error', duration: 5000 });
    } finally {
      setDeleting(false);
    }
  };

  // Award badge
  const handleAwardBadge = async (userId: string) => {
    if (!awardBadge) return;
    await gamificationService.awardBadgeToUser(awardBadge.id, userId);
    addToast({ message: `Badge "${awardBadge.name}" otorgado`, type: 'success', duration: 3000 });
    setShowAwardModal(false);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gamificacion</h1>
        <p className="text-gray-600 dark:text-gray-400">Gestion de XP, badges y recompensas</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex space-x-8">
          {[
            { key: 'leaderboard' as const, label: 'Leaderboard' },
            { key: 'badges' as const, label: 'Badges' },
            { key: 'config' as const, label: 'Configuracion' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.key ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'leaderboard' && (
        <LeaderboardTab
          leaderboard={leaderboard}
          loading={lbLoading}
          page={lbPage}
          total={lbTotal}
          onPageChange={setLbPage}
          onAdjustXp={(user) => { setXpTarget(user); setShowXpModal(true); }}
          onViewHistory={(user) => { setHistoryUser(user); setShowHistoryModal(true); }}
        />
      )}

      {activeTab === 'badges' && (
        <BadgesTab
          badges={badges}
          loading={badgesLoading}
          onCreate={() => { setEditingBadge(null); setShowBadgeModal(true); }}
          onEdit={(badge) => { setEditingBadge(badge); setShowBadgeModal(true); }}
          onDelete={(badge) => { setDeleteBadgeTarget(badge); setShowDeleteConfirm(true); }}
          onAward={(badge) => { setAwardBadge(badge); setShowAwardModal(true); }}
        />
      )}

      {activeTab === 'config' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Reglas de XP</h2>
          <div className="space-y-4">
            {[
              { title: 'Completar curso', desc: 'Score calculado segun nivel (60%) + duracion (40%)', xp: '1-10 XP' },
              { title: 'Importar badge externo', desc: 'XP calculado segun nivel y duracion del certificado', xp: '1-10 XP' },
              { title: 'Badge otorgado por admin', desc: 'XP definido en el badge (xp_reward)', xp: 'Variable' },
              { title: 'Ajuste manual (admin)', desc: 'El admin puede sumar o restar XP con razon obligatoria', xp: 'Ilimitado' },
            ].map((rule) => (
              <div key={rule.title} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{rule.title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{rule.desc}</p>
                </div>
                <span className="text-yellow-600 font-bold">{rule.xp}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <XpAdjustModal
        isOpen={showXpModal}
        target={xpTarget}
        onClose={() => setShowXpModal(false)}
        onSave={handleAdjustXp}
      />
      <XpHistoryModal
        isOpen={showHistoryModal}
        user={historyUser}
        onClose={() => setShowHistoryModal(false)}
      />
      <BadgeFormModal
        isOpen={showBadgeModal}
        badge={editingBadge}
        onClose={() => setShowBadgeModal(false)}
        onSave={handleSaveBadge}
      />
      <AwardBadgeModal
        isOpen={showAwardModal}
        badge={awardBadge}
        onClose={() => setShowAwardModal(false)}
        onAward={handleAwardBadge}
      />
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => { setShowDeleteConfirm(false); setDeleteBadgeTarget(null); }}
        onConfirm={handleDeleteBadge}
        title="Eliminar Badge"
        message={`Eliminar "${deleteBadgeTarget?.name || ''}"? Los usuarios que lo tengan lo perderan.`}
        variant="danger"
        confirmText="Eliminar"
        isLoading={deleting}
      />
    </div>
  );
};

export default AdminGamification;
