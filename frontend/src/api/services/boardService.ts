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

  saveYjsState: async (id: string, update: Uint8Array) => {
    const response = await api.put(`/boards/${id}/yjs`, update.buffer.slice(update.byteOffset, update.byteOffset + update.byteLength), {
      headers: { 'Content-Type': 'application/octet-stream' },
      transformRequest: (data) => data, // bypass axios JSON serialization
    });
    return response.data;
  },

  // keepalive: true ensures the request completes even during page reload/close
  saveYjsStateOnUnload: (id: string, update: Uint8Array) => {
    const buffer = update.buffer.slice(update.byteOffset, update.byteOffset + update.byteLength) as ArrayBuffer;
    const baseURL = import.meta.env.VITE_API_BASE_URL || '';
    fetch(`${baseURL}/boards/${id}/yjs`, {
      method: 'PUT',
      body: buffer,
      headers: { 'Content-Type': 'application/octet-stream' },
      keepalive: true,
      credentials: 'include',
    });
  },
};
