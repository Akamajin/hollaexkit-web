import React, { Component } from 'react';
import { Spin, Table, Button, Modal } from 'antd';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { ReactSVG } from 'react-svg';
import Moment from 'react-moment';
import { newFinanacialAction, getUserFinancials, deleteFinanacialById, calcualteInterests, updateBalanceRow } from './actions';
import { STATIC_ICONS } from 'config/icons';
import { Filters } from './Filters';
import moment from 'moment';
import './index.css';
class UserFinancials extends Component {
	state = {
		loading: true,
		tableData: [],
		formData: {
			action: 'Capital Investment'
		},
		isOpen: false
	};

	componentDidMount () {
		this.updateTableData()
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
				key: 'action'
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
				title: 'Date added',
				dataIndex: 'created_at',
				key: 'created_at',
				render: (created) => (
					<Moment format="YYYY/MM/DD">{created}</Moment>
				),
			},
			{
				title: 'Delete',
				dataIndex: 'id',
				key: 'data',
				render: (id,rowData) => (
					<div>
						<Button type="primary" onClick={() => this.requestDelete(id,this)} className="mr-1" style={{backgroundColor: "#ff0000"}} >Delete</Button>
						{rowData.action === "Withdraw (Pending)" || rowData.action === "Withdraw Investment (Pending)" ? <Button type="primary" onClick={() => this.acceptWithdraw(id,rowData.action)} style={{backgroundColor: "#008e00"}} >Accept Withdraw</Button> : null }
					</div>
				)
			},
		];
	};

	onChangeParams = (key) => (value) => {
		const formData = {...this.state.formData};
		if (value) {
			if (key === 'created_at') {
				formData[key] = moment(value).format();
			} else {
				formData[key] = value;
				if (key === 'action' && value !== 'Capital Investment') delete formData.interest_rate;
			}
		} else {
			delete formData[key];
		}
		this.setState({ formData });
	};

	addRow = () => {
		let { formData } = this.state
		for (const key in formData)
			if (key !== 'action' && key !== 'created_at')
				formData[key] = Number(formData[key])
		const data = { user_id: this.props.userData.id, ...formData }
		newFinanacialAction(data).then(res=>{
			this.updateTableData()
			this.setState({formData:{action: 'Capital Investment'}})
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

	requestDelete (id,dis) {
		Modal.confirm({
			icon: <ExclamationCircleFilled />,
			content: <div>Are you sure?</div>,
			onOk() {
				deleteFinanacialById(id).then((res)=>{
					dis.updateTableData()
				}).catch((err)=>{
					console.log(err.response)
					
				})
			},
		});
	}

	acceptWithdraw = (id, action) => {
		updateBalanceRow({id, action: action.replace(' (Pending)', '')}).then(res=>{
			this.updateTableData()
			this.setState({formData:{action: 'Capital Investment'}})
		}).catch((err) => {
			console.log(err.response)
		})
	};

	requestCalc (dis) {
		dis.setState({loading: true})
		
		calcualteInterests(this.props.userData.id).then(res=>{
			dis.updateTableData()
			dis.setState({loading: false})
		}).catch((err) => {
			console.log(err.response)
		})
	}

	updateTableData = () => {
		this.setState({loading: true})
		getUserFinancials(this.props.userData.id).then(res=>{
			let baseDeposit = 0
			let interest = 0
			const tableData = res.data.map(dr => {
				const drAmount = dr.amount * 100
				if (dr.action === "Capital Investment") {
					baseDeposit += drAmount
				} else if (dr.action === "Withdraw Investment")  {
					baseDeposit -= drAmount
					dr.amount = -drAmount/100
				} else if (dr.action === "Interest")  {
					interest += drAmount
				} else if (dr.action === "Withdraw")  {
					interest -= drAmount
					dr.amount = -drAmount/100
				}
				return dr
			})
			this.setState({
				tableData,
				baseDeposit: baseDeposit/100,
				interest: interest/100,
				loading: false
			})
		})
	}

	render() {
		const { loading, tableData, isOpen, formData, baseDeposit, interest } = this.state;
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
				<div className="d-flex align-items-center mb-4">
					<div>
						<ReactSVG
							src={STATIC_ICONS['USER_SECTION_WALLET']}
							className="admin-wallet-icon"
						/>
					</div>
					<div>
						<h3>Investment</h3>
						<div>Base Deposit: <b>${baseDeposit}</b></div>
						<div>Interest: <b>${interest}</b></div>
					</div>
				</div>
				<button className="ant-btn ant-btn-primary mr-3" onClick={()=>this.requestCalc(this)} >Calcualte interests</button>
				<button className="ant-btn ant-btn-secondary" onClick={()=>this.updateTableData()} >Refresh</button>
				<hr />
				<Filters
					formData={formData}
					onChange={this.onChangeParams}
					onClick={this.addRow}
					loading={false}
					fetched={true}
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