import React, { Component } from 'react';
import { Spin, Checkbox } from 'antd';
import { ReactSVG } from 'react-svg';
import { getAdminMeta, createAdminMeta, updateAdminMeta, getUsersInvestment } from './actions';
import { STATIC_ICONS } from 'config/icons';
import InvPlanForm from './invPlanForm';
import axios from 'axios';

const INITIAL_STATE = {
	investmentPlans:[],
	checkboxes: [],	
	emailSubject: '',
	emailText: '',
	emailReceivers: [],
	users: [],
	loading: true,
	sending: false
};

class AdminInvestment extends Component {
	state = INITIAL_STATE;

	componentDidMount () {
		this.initialize()
	}

	initialize() {
		getAdminMeta('investment_plans').then(res => {
			if (res) {
				const investmentPlans = JSON.parse(res.value)
				let checkboxes = []
				investmentPlans.map(ip=>checkboxes.push({ label: ip.title, value: ip.minInvest}))
				getUsersInvestment().then(res => {
					const users = this.groupUsers(res.data, checkboxes)
					this.setState({investmentPlans, checkboxes, users, loading: false})
				}).catch((err) => {console.log(err)});
			} else {
				createAdminMeta({key: 'investment_plans', value: '[]'}).then(()=>{
					this.setState({loading: false})
				})
			}
		})
	}

	groupUsers(data, checkboxes) {
		let groupedUsers = {}
		let plans = checkboxes.map(gp=>gp.value).sort((a, b) => a-b)
		data.map(investments=>{
			if (groupedUsers[investments.user.email] === undefined) groupedUsers[investments.user.email] = []
			groupedUsers[investments.user.email].push({action: investments.action, amount: investments.amount})
			return null
		})
		let groupedAndSummed = []
		for (const key in groupedUsers) {
			let investment = 0
			groupedUsers[key].map(usrInvst=>{
				if (usrInvst.action === 'Capital Investment (Fixed)' ||	usrInvst.action === 'Capital Investment (Decreasing)' || usrInvst.action === 'Capital Increase') {
					investment += usrInvst.amount
				} else if (usrInvst.action === 'Withdraw Investment'){
					investment -= usrInvst.amount
				}
				return null
			})
			groupedAndSummed.push({email: key, investment, plan: ''})
		}
		plans.map(pl=> {
			groupedAndSummed = groupedAndSummed.map(gs=> {
				if (gs.investment >= pl) gs.plan = pl
				return gs
			})
			return null
		})
		return groupedAndSummed
	}

	savePlans() {
		this.setState({loading: true})
		updateAdminMeta({key: 'investment_plans', value: JSON.stringify(this.state.investmentPlans)}).then(res => {
			this.initialize()
		})
	}

	addPlan() {
		let {investmentPlans} = this.state;
		investmentPlans.push({
			title: "",
			minInvest: "",
			features: ""
		})
		this.setState({investmentPlans})
	}

	sendEmail() {
		this.setState({sending: true})
		const {emailReceivers, emailSubject, emailText} = this.state
		axios.post('/admin/send-email', {receivers: emailReceivers, subject: emailSubject, html: emailText}).then((res) => {
			setTimeout(()=>{
				this.setState({sending: false})
			},5000)
			console.log(res)
		})
		.catch((err) => {
			console.log(err)
		});
	}

	removePlan(indx) {
		let {investmentPlans} = this.state;
		investmentPlans.splice(indx,1)
		this.setState({investmentPlans})
	}

	changePlanDetails (index, key, value) {
		let {investmentPlans} = this.state;
		const updatedPlans = investmentPlans.map((row,indx)=>{
			if (index === indx) {
				row[key] = key === 'minInvest' ? Number(value) : value
				return row;
			} else {
				return row;
			}
		})
		this.setState({investmentPlans: updatedPlans})
	}
	onCheckboxChange(checkedValues) {
		const {users} = this.state;
		let emailReceivers = []
		checkedValues.map(cv=>{
			users.map(usr=>{
				if (usr.plan === cv) emailReceivers.push(usr.email)
				return null
			})
			return null
		})
		this.setState({emailReceivers});
	}

	render() {
		const { investmentPlans, emailSubject, emailText, checkboxes, emailReceivers, loading, sending } = this.state;
		if (loading) {
			return (
				<div className="app_container-content">
					<Spin size="large" />
				</div>
			);
		}
		return (
			<div className="f-1 admin-user-container">
				<div className="d-flex align-items-center">
					<div>
						<ReactSVG src={STATIC_ICONS['ADMIN_TIERS']}	className="admin-wallet-icon" />
					</div>
					<div>
						<h3 className="mb-0">Investment Plans</h3>
					</div>
				</div>
				<div className="divider mt-0" style={{width: '100%'}}></div>
				<button className="ant-btn ant-btn-secondary mr-2" onClick={()=>this.addPlan()} >Add Plan</button>
				<button className="ant-btn ant-btn-primary" onClick={()=>this.savePlans()} >Save</button>
				<div className="investment-plans-forms">
					{investmentPlans.map((ip,index)=>
						<InvPlanForm key={`ip${index}`} planData={ip} index={index} onRemove={(indx)=>this.removePlan(indx)} onChange={(indx, key, value)=>this.changePlanDetails(indx, key, value)} />
					)}
				</div>
				<div className="divider" style={{width: '100%'}}></div>
				<h3>Send Email</h3>
				<div className="investment-email-form">
					<div className="input_field">
						<label className="sub-title">Groups</label>
						{checkboxes.length ?
							<div>
								<Checkbox.Group options={checkboxes} onChange={(vals)=>{this.onCheckboxChange(vals)}} />
								<span className="description">Receivers Count: {emailReceivers.length}</span>
							</div> :
							<div><span className="description">No group available</span></div>
						}
					</div>
					
					<div className="input_field">
						<label className="sub-title">Subject</label>
						<div>
							<div className="d-flex align-items-center">
								<input type="text" className="ant-input" value={emailSubject} onChange={(e)=> this.setState({emailSubject: e.target.value})} />
							</div>
						</div>
					</div>
					<div className="input_field">
						<label className="sub-title">Features</label>
						<div>
							<div className="d-flex align-items-center">
								<textarea rows="5" className="ant-input" value={emailText} onChange={(e)=> this.setState({emailText: e.target.value})}></textarea>
							</div>
						</div>
					</div>
				</div>
				{sending ? <p className="description mb-5">Sending emails in progress.</p> : <button className="ant-btn ant-btn-primary mb-5" onClick={()=>this.sendEmail()} >Send</button>}
			</div>
		);
	}
}

export default AdminInvestment;
