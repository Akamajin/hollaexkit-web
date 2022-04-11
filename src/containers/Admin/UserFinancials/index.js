import React, { Component } from 'react';
import { Spin, Table, Button, Modal } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import Moment from 'react-moment';
import { newFinanacialAction, getUserFinancials, deleteFinanacialById, calcualteInterests, updateBalanceRow } from './actions';
import { Filters } from './Filters';
import moment from 'moment';
import './index.css';
class UserFinancials extends Component {
	state = {
		loading: true,
		tableData: [],
		formData: {
			action: 'Capital Investment (Fixed)'
		},
		financialData: [],
		isOpen: false,
		activeGroup: null,
		groups: {},
		buttonsForGroups: []
	};

	componentDidMount () {
		this.fetchData()
	}

	getBalanceColumn = () => {
		return [
			{
				title: 'Id',
				dataIndex: 'id',
				key: 'id'
			},
			{
				title: 'Action',
				dataIndex: 'action',
				key: 'action',
				render: (id,rowData) => (
					<div>{rowData.action} {rowData.meta ? <span onClick={() => this.showBankData(rowData)} style={{cursor: "pointer"}}>[more info...]</span> : null}</div>
				)
			},
			{ 
				title: 'Amount',
				dataIndex: 'amount',
				key: 'amount'
			},
			{ 
				title: 'Interest Rate',
				dataIndex: 'interest_rate',
				key: 'interest_rate'
			},
			{ 
				title: 'Deduction Rate',
				dataIndex: 'deduction_rate',
				key: 'deduction_rate'
			},
			{
				title: 'Date added',
				dataIndex: 'created_at',
				key: 'created_at',
				render: (created) => <Moment format="YYYY/MM/DD">{created}</Moment>
			},
			{
				title: 'End Date',
				dataIndex: 'end_date',
				key: 'end_date',
				render: (endDate) => endDate ? <Moment format="YYYY/MM/DD">{endDate}</Moment> : ''
			},
			{
				title: '',
				dataIndex: 'id',
				key: 'data',
				render: (id,rowData) => (
					<div>
						<Button type="primary" onClick={() => this.requestDelete(id)} className="mr-1" style={{backgroundColor: "#ff0000"}} >Delete</Button>
						{rowData.action === "Withdraw (Pending)" || rowData.action === "Withdraw Investment (Pending)" ? <Button type="primary" onClick={() => this.acceptWithdraw(id,rowData.action)} style={{backgroundColor: "#008e00"}} >Accept Withdraw</Button> : null }
					</div>
				)
			}
		];
	};

	onChangeParams = (key) => (value) => {
		const formData = {...this.state.formData};
		if (value) {
			if (key === 'created_at' || key === 'end_date') {
				formData[key] = moment(value).format();
			} else {
				formData[key] = value;
				if (key === 'action' && value !== 'Capital Investment (Fixed)' && value !== 'Capital Investment (Decreasing)') {
					delete formData.interest_rate;
					delete formData.deduction_rate;
				}
			}
		} else {
			delete formData[key];
		}
		this.setState({ formData });
	};

	findLastGroup () {
		const {buttonsForGroups} = this.state
		return buttonsForGroups.length > 0 ? Math.max(...buttonsForGroups.map(bfg => bfg.groupId)) : -1
	}

	addRow = () => {
		let { formData, activeGroup } = this.state
		for (const key in formData)
			if (key !== 'action' && key !== 'created_at' && key !== 'end_date')
				formData[key] = Number(formData[key])
		if (formData.action === "Capital Investment (Fixed)" || formData.action === "Capital Investment (Decreasing)")
			activeGroup = this.findLastGroup() + 1
		if (formData.deduction_rate === "") formData.deduction_rate = formData.interest_rate
		this.setState({activeGroup})
		const data = { user_id: this.props.userData.id, group: activeGroup, ...formData }
		newFinanacialAction(data).then(res=>{
			this.fetchData()
		}).catch((err) => {
			console.log(err.response)
		})
	};

	onOpenModal = () => {
		this.setState({ isOpen: true })
	}

	onCancelModal = () => {
		this.setState({ isOpen: false})
	}

	requestDelete = (id) => {
		const {financialData, activeGroup, buttonsForGroups} = this.state
		const currentGroup = financialData.filter(fd => fd.group === activeGroup)
		const targetRow = currentGroup.filter(fd => fd.id === id)[0]
		if ((targetRow.action === 'Capital Investment (Fixed)' || targetRow.action === 'Capital Investment (Decreasing)') && currentGroup.length > 1) {
			Modal.info({
				content: <div>This is a core record and cannot be removed. please remove normal records first.</div>,
			});	
		} else {
			const $this = this
			Modal.confirm({
				icon: <ExclamationCircleFilled />,
				content: <div>Are you sure?</div>,
				onOk() {
					deleteFinanacialById(id).then((res)=>{
						if(currentGroup.length === 1 && buttonsForGroups.length > 0) {
							$this.setState({activeGroup: buttonsForGroups[0].groupId}, ()=>{
								$this.fetchData()
							})
						} else {
							$this.fetchData()
						}
					}).catch((err)=>{
						console.log(err.response)
					})
				},
			});
		}
	}

	showBankData = (rowData) => {
		const parsedMeta = JSON.parse(rowData.meta)
		Modal.info({content: <div>
			<h4 className="mb-4" style={{color: "#ffffff"}}>Bank and Wallet Info</h4>
			<div><b>IBAN:</b> {parsedMeta.ei_iban}</div>
			<div><b>Bank Name:</b> {parsedMeta.ei_bank_name}</div>
			<div><b>Holder Full Name:</b> {parsedMeta.ei_holder_name}</div>
			<div><b>Account Number:</b> {parsedMeta.ei_acc_no}</div>
			<div><b>USDT TRC Address:</b> {parsedMeta.ei_trc_address}</div>
		</div>});
	}

	acceptWithdraw = (id, action) => {
		updateBalanceRow({id, action: action.replace(' (Pending)', '')}).then(res=>{
			this.fetchData()
		}).catch((err) => {
			console.log(err.response)
		})
	};

	requestCalc = () => {
		this.setState({loading: true})
		calcualteInterests({user_id: this.props.userData.id, group: this.state.activeGroup }).then(res=>{
			this.fetchData()
		}).catch((err) => {
			console.log(err.response)
		})
	}

	fetchData = () => {
		this.setState({loading: true})
		getUserFinancials(this.props.userData.id).then(res=>{
			this.setState({loading: false, financialData: res.data}, this.updateTableData)
		})
	}

	updateTableData = () => {
		let {activeGroup, financialData} = this.state
		let groups = {}
		let buttonsForGroups = []
		financialData.map(dr => {
			const gid = dr.group.toString()
			if (groups[gid] === undefined) groups[gid] = {}
			Array.isArray(groups[gid]) ? groups[gid].push(dr) : groups[gid] = [dr]
			return null
		})
		for (const groupId in groups){
			const baseAction = groups[groupId].filter(gp=> gp.action === 'Capital Investment (Fixed)' || gp.action === 'Capital Investment (Decreasing)')[0]
			buttonsForGroups.push({groupId: Number(groupId), title: `${groupId} - ${baseAction.action.split(' ')[2].replace('(','').replace(')','')} ($${baseAction.amount}@${baseAction.interest_rate}%${baseAction.deduction_rate && baseAction.interest_rate !== baseAction.deduction_rate ? ',' + baseAction.deduction_rate + '%' : ''})` })
		}
		activeGroup = Number(!activeGroup && buttonsForGroups[0] ? buttonsForGroups[0].groupId : activeGroup)

		/* Calculate grand total values*/
		let grandTotalCapital = 0
		let grandDeduction = 0
		let grandInterest = 0
		let grandWithdrawedInterest = 0
		
		financialData.map(dr => {
			const drAmount = dr.amount * 100
			if (dr.action === "Capital Investment (Fixed)") {
				grandTotalCapital += drAmount
			} else if (dr.action === "Capital Investment (Decreasing)") {
				grandTotalCapital += drAmount
			} else if (dr.action === "Capital Increase") {
				grandTotalCapital += drAmount
			} else if (dr.action === "Capital Deduction") {
				grandDeduction += drAmount
			} else if (dr.action === "Withdraw Investment")  {
				grandTotalCapital -= drAmount
			} else if (dr.action === "Interest")  {
				grandInterest += drAmount
			} else if (dr.action === "Withdraw")  {
				grandWithdrawedInterest += drAmount
			}
			return dr
		})
		/* End calculate grand total values*/

		let currentGroupData = financialData.filter(d=>d.group===activeGroup)

		let mode = ''
		let totalCapital = 0
		let interest = 0
		let withdrawedInterest = 0
		let deduction = 0
		const tableData = currentGroupData.map(dr => {
			const drAmount = dr.amount * 100
			if (dr.action === "Capital Investment (Fixed)") {
				totalCapital += drAmount
				mode = "fixed"
			} else if (dr.action === "Capital Investment (Decreasing)") {
				totalCapital += drAmount
				mode = "decreasing"
			} else if (dr.action === "Capital Increase") {
				totalCapital += drAmount
			} else if (dr.action === "Capital Deduction") {
				deduction += drAmount
			} else if (dr.action === "Withdraw Investment")  {
				totalCapital -= drAmount
				dr.amount = drAmount/100
			} else if (dr.action === "Interest")  {
				interest += drAmount
			} else if (dr.action === "Withdraw")  {
				withdrawedInterest += drAmount
				dr.amount = drAmount/100
			}
			return dr
		})
		this.setState({
			tableData,
			totalCapital: totalCapital/100,
			interest: interest/100,
			withdrawedInterest: withdrawedInterest/100,
			deduction: deduction/100,

			grandTotalCapital: grandTotalCapital/100,
			grandDeduction: grandDeduction/100,
			grandInterest: grandInterest/100,
			grandWithdrawedInterest: grandWithdrawedInterest/100,

			loading: false,
			mode,
			groups,
			buttonsForGroups,
			activeGroup
		})
	}
	setActiveGroup(id) {
		this.setState({activeGroup: id},this.updateTableData)
	}

	render() {
		const { loading, financialData, buttonsForGroups, activeGroup, tableData, isOpen, formData, totalCapital, interest, mode, deduction, withdrawedInterest, grandTotalCapital, grandDeduction, grandInterest, grandWithdrawedInterest} = this.state;
		const BALANCE_COLUMN = this.getBalanceColumn();

		if (loading) {
			return (
				<div className="app_container-content">
					<Spin size="large" />
				</div>
			);
		}

		return (
			<div className="f-1 admin-user-container admin-financials-wrapper">
				<div className="mb-4">
					<h3>Investment</h3>
					<table className="investment-table">
						<thead>
							<tr>
								<td></td>
								<td>Current</td>
								<td>Grand Total</td>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>Total Capital</td>
								<th>${totalCapital}</th>
								<th>${grandTotalCapital}</th>
							</tr>
							<tr>
								<td>Remained Capital</td>
								<th>{mode === "decreasing" ? '$' + (totalCapital - deduction) : '-'}</th>
								<th>{'$' + (grandTotalCapital - grandDeduction)}</th>
							</tr>
							<tr>
								<td>Withdrawable Amount</td>
								<th>${interest - withdrawedInterest}</th>
								<th>${grandInterest - grandWithdrawedInterest}</th>
							</tr>
							<tr>
								<td>Total Interests (Till Now)</td>
								<th>${interest}</th>
								<th>${grandInterest}</th>
							</tr>
						</tbody>
					</table>
				</div>
				<div className="investment-buttons">
					<div>
						{buttonsForGroups.map(grp =><button className={`ant-btn ant-btn-secondary ${activeGroup === grp.groupId ? 'ant-btn-warning' : ''} mr-3`} key={grp.groupId} onClick={()=>this.setActiveGroup(grp.groupId)}>{grp.title}</button>)}
					</div>
					<div>
						<button className="ant-btn ant-btn-primary mr-3" onClick={()=>this.requestCalc()} >Calcualte interests</button>
						<button className="ant-btn ant-btn-secondary" onClick={()=>this.fetchData()} >Refresh</button>
					</div>
				</div>
				
				<hr />
				<Filters
					formData={formData}
					onChange={this.onChangeParams}
					onClick={this.addRow}
					loading={false}
					fetched={true}
					invested={financialData.length > 0}
				/>
				<Table
					columns={BALANCE_COLUMN}
					rowKey={(data) => {
						return data.id;
					}}
					dataSource={tableData}
				/>
				<Modal visible={isOpen} footer={null} onCancel={this.onCancelModal} width="37rem"></Modal>
			</div>
		);
	}
}

export default UserFinancials;