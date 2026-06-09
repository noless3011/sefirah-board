import axios from 'axios';

// Định nghĩa cấu trúc dữ liệu một Board được chia sẻ
export interface SharedBoard  {
  id: string;
  title: string;
  updatedAt: string;
  owner: {
    name: string;
    email: string;
  };
}

// Gọi về đúng endpoint API của backend quản lý board shared
const API_URL = 'http://localhost:4000/api/v1/boards/shared';

export const sharedService = {
  // Hàm lấy danh sách các board được người khác chia sẻ với ông
  getSharedBoards: async (): Promise<SharedBoard[]> => {
    const response = await axios.get(API_URL, { withCredentials: true });
    return response.data;
  }
};