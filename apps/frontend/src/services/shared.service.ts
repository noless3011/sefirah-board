import axiosClient from '../api/axiosClient';
import type { Board, GetBoardsResponse } from '@sefirah/shared';

export const sharedService = {
  // Hàm lấy danh sách các board được người khác chia sẻ với ông
  getSharedBoards: async (): Promise<Board[]> => {
    const response = await axiosClient.get<GetBoardsResponse>('/boards', {
      params: { type: 'shared' }
    });
    return response.data.data;
  }
};