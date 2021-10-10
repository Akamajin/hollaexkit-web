import axios from 'axios';
import { requestAuthenticated } from '../../../utils';

export const getUserFinancials = (id) =>
	requestAuthenticated(`/admin/user-balance?user_id=${id}`)
		.then((data) => {
			return data;
		})
		.catch((err) => err.data);

export const newFinanacialAction = (data) => axios.post('/admin/user-balance', data);

export const deleteFinanacialById = (id) => axios.post('/admin/delete-user-balance', {id});

export const updateBalanceRow = (data) => axios.put('/admin/user-balance', data);

export const calcualteInterests = ({user_id, group}) => axios.post('/admin/calcualte-interests', {user_id, group, calc_all: true});