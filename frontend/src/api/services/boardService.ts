import api from '../axios';

export const boardService = {
  getBoards: async () => {
    const response = await api.get('/boards');
    return response.data;
  },

  createBoard: async (boardData: { name: string; description: string }) => {
    const response = await api.post('/boards', boardData);
    return response.data;
  },

  getBoardById: async (id: string) => {
    const response = await api.get(`/boards/${id}`);
    return response.data;
  },

  updateBoard: async (id: string, boardData: any) => {
    const response = await api.patch(`/boards/${id}`, boardData);
    return response.data;
  },

  deleteBoard: async (id: string) => {
    const response = await api.delete(`/boards/${id}`);
    return response.data;
  }
};
