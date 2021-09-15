import React from 'react';
import { SubmissionError } from 'redux-form';
import { createUserAsAdmin } from './actions';
import { AdminHocForm } from '../../../components';

const Form = AdminHocForm('USER_DATA', 'user_data');

const Fields = {
	email: {
		type: 'text',
		label: 'Email',
	},
	password: {
		type: 'text',
		label: 'Password',
	},
	full_name: {
		type: 'text',
		label: 'Full Name',
	},
};

const onSubmit = (onChangeSuccess, handleClose) => ({email,password,full_name}) => {
	return createUserAsAdmin({email, password, full_name})
		.then((data) => {
			if (onChangeSuccess) {
				onChangeSuccess({email, password, full_name, ...data});
			}
			handleClose();
		})
		.catch((err) => {
			throw new SubmissionError({ _error: err.data.message });
		});
};

const NewUserForm = ({onChangeSuccess,handleClose}) => (
	<Form
		onSubmit={onSubmit(onChangeSuccess, handleClose)}
		buttonText="SAVE"
		fields={Fields}
		initialValues={{}}
		buttonClass="green-btn"
	/>
);

export default NewUserForm;
