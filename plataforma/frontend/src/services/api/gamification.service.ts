import api from '../api';

export interface LeaderboardEntry {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  xp: number;
  role: string;
  rank: number;
}

export interface XpTransaction {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  source: string;
  adminId: string | null;
  referenceId: string | null;
  createdAt: string;
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: PaginationMeta;
}

interface XpAdjustResponse {
  success: boolean;
  data: {
    user: { id: string; name: string; email: string; xp: number; role: string };
    transaction: XpTransaction;
  };
}

interface ApiSuccessResponse {
  success: boolean;
  data: Record<string, unknown>;
}

class GamificationService {
  async getLeaderboard(page = 1, limit = 20): Promise<PaginatedResponse<LeaderboardEntry>> {
    return api.get(`/admin/users/leaderboard?page=${page}&limit=${limit}`) as Promise<
      PaginatedResponse<LeaderboardEntry>
    >;
  }

  async adjustUserXp(userId: string, amount: number, reason: string): Promise<XpAdjustResponse> {
    return api.put(`/admin/users/${userId}/xp`, { amount, reason }) as Promise<XpAdjustResponse>;
  }

  async getUserXpHistory(
    userId: string,
    page = 1,
    limit = 20
  ): Promise<PaginatedResponse<XpTransaction>> {
    return api.get(`/admin/users/${userId}/xp-history?page=${page}&limit=${limit}`) as Promise<
      PaginatedResponse<XpTransaction>
    >;
  }

  async awardBadgeToUser(badgeId: string, userId: string): Promise<ApiSuccessResponse> {
    return api.post(`/badges/${badgeId}/award/${userId}`) as Promise<ApiSuccessResponse>;
  }
}

export const gamificationService = new GamificationService();
export default gamificationService;
