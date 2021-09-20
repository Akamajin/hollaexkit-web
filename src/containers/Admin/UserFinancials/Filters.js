import React from 'react';
import { PlusCircleFilled } from '@ant-design/icons';
import { Button, Alert } from 'antd';
import { SelectValue } from './SelectValues';
import { FilterInput, FilterDate } from './FilterInput';

export const Filters = ({
	onChange,
	onClick,
	loading,
	formData
}) => {
	const allowSubmit = !loading && formData.amount && ((formData.action === 'Capital Investment' && formData.interest_rate) || (formData.action !== 'Capital Investment'));
	return (
		<div>
			{/*<Alert
				message="Select some filters to perform a query on the deposits"
				type="info"
				showIcon
				className="filter-alert"
			/>

			<Alert
				message="You have to select at least one filter to perform a query"
				type="warning"
				showIcon
				className="filter-alert"
			/>*/}
			<div className="filters-wrapper">
				<div className="filters-wrapper-filters d-flex flex-direction-row">
					<SelectValue
						defaultValue={'Capital Investment'}
						onSelect={onChange('action')}
						className={'adjacent-fields pl-2'}
						label='Action'
						placeholder='Action'
						options={[
							{ value: 'Capital Investment', text: 'Capital Investment' },
							{ value: 'Interest', text: 'Interest' },
							{ value: 'Withdraw', text: 'Withdraw' },
						]}
					/>
					<FilterInput
						onChange={onChange('amount')}
						label={'Amount'}
						className={'adjacent-fields pl-2'}
						placeholder="Amount"
					/>
					{formData.action === 'Capital Investment' ? <FilterInput
						onChange={onChange('interest_rate')}
						label={'Interest Rate'}
						className={'adjacent-fields pl-2'}
						placeholder="Interest Rate"
					/> : null}
					<FilterDate
						onChange={onChange('created_at')}
						label={'Date'}
						className={'adjacent-fields pl-2'}
						placeholder="Date"
					/>
				</div>
				<div className="filters-wrapper-buttons pl-2">
					<Button
						onClick={onClick}
						type="primary"
						icon={<PlusCircleFilled />}
						className="filter-button green-btn"
						disabled={!allowSubmit}
					>
						Add
					</Button>
				</div>
			</div>
		</div>
	);
};
