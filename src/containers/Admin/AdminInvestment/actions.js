import axios from 'axios';

export const getAdminMeta = (key) => axios.get(`/admin/meta?key=${key}`).then(res => res.data).catch(err => err.data);

export const createAdminMeta = (data) => axios.post('/admin/meta', data);

export const deleteAdminMeta = (key) =>	axios.delete(`/admin/meta?key=${key}`).then((data) => data).catch((err) => err.data);

export const updateAdminMeta = (data) => axios.put('/admin/meta', data);