import api from '../axios';

export const boardService = {
  getBoards: async () => {
    const response = await api.get('/boards');
    return response.data;
  },

  createBoard: async (boardData: { title: string; category?: string; description?: string }) => {
    const response = await api.post('/boards', boardData);
    return response.data;
  },

  getBoardById: async (id: string) => {
    const response = await api.get(`/boards/${id}`);
    return response.data;
  },

  joinBoardByCode: async (code: string) => {
    const response = await api.get(`/boards/join/${code}`);
    return response.data;
  },

  setJoinCode: async (id: string, code: string) => {
    const response = await api.post(`/boards/${id}/joinCode`, { joinCode: code });
    return response.data;
  },

  updateBoard: async (id: string, boardData: any) => {
    const response = await api.put(`/boards/${id}`, boardData);
    return response.data;
  },

  deleteBoard: async (id: string) => {
    const response = await api.delete(`/boards/${id}`);
    return response.data;
  },

  // Wipes all stroke data (Stroke docs + yjsUpdate blob) for a board.
  clearBoardStrokes: async (id: string) => {
    const response = await api.delete(`/boards/${id}/strokes`);
    return response.data;
  },

  // Replaces the stored Yjs binary state with a compact snapshot so erasures persist.
  saveCompactYjsState: async (id: string, data: ArrayBuffer) => {
    const response = await api.put(`/boards/${id}/yjs`, data, {
      headers: { 'Content-Type': 'application/octet-stream' },
    });
    return response.data;
  },
};
