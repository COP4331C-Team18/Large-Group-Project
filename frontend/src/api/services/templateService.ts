import api from '../axios';

export const templateService = {
  getTemplates: async () => {
    const response = await api.get('/templates');
    return response.data;
  }
};
