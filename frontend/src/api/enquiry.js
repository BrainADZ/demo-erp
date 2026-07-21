import api from '@/utils/api';

export const EnquiryAPI = {
  // listAll returns { success, result: [ ... ] }
  list: () =>
    api.get('/api/enquiry/listAll').then((r) => {
      const { result = [] } = r.data || {};
      return { result };
    }),

  read: (id) => api.get(`/api/enquiry/read/${id}`).then((r) => r.data),

  create: (payload) => api.post('/api/enquiry/create', payload).then((r) => r.data),

  update: (id, payload) => api.patch(`/api/enquiry/update/${id}`, payload).then((r) => r.data),

  addRemark: (id, payload) => api.post(`/api/enquiry/remark/${id}`, payload).then((r) => r.data),
};
