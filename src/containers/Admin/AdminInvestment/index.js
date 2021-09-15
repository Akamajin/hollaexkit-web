import React, { Component } from 'react';
import { Spin } from 'antd';
import { ReactSVG } from 'react-svg';
import { getAdminMeta, createAdminMeta, updateAdminMeta } from './actions';
import { STATIC_ICONS } from 'config/icons';
import InvPlanForm from './invPlanForm';

const INITIAL_STATE = {
	investmentPlans:[],
	loading: true
};

class AdminInvestment extends Component {
	state = INITIAL_STATE;

	componentDidMount () {
		getAdminMeta('investmnet_plans').then(res => {
			if (res) {
				this.setState({investmentPlans: JSON.parse(res.value), loading: false})
			} else {
				createAdminMeta({key: 'investmnet_plans', value: '[]'}).then(()=>{
					this.setState({loading: false})
				})
			}
		})
	}
	savePlans() {
		this.setState({loading: true})
		updateAdminMeta({key: 'investmnet_plans', value: JSON.stringify(this.state.investmentPlans)}).then(res => {
			this.setState({loading: false})
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

	render() {
		const { investmentPlans, loading } = this.state;
		if (loading) {
			return (
				<div className="app_container-content">
					<Spin size="large" />
				</div>
			);
		}
		return (
			<div className="f-1 admin-user-container">
				<div className="d-flex align-items-center mb-4">
					<div>
						<ReactSVG
							src={STATIC_ICONS['ADMIN_TIERS']}
							className="admin-wallet-icon"
						/>
					</div>
					<div>
						<h3>Investment Plans</h3>
					</div>
				</div>
				<button className="ant-btn ant-btn-secondary mr-2" onClick={()=>this.addPlan()} >Add Plan</button>
				<button className="ant-btn ant-btn-primary" onClick={()=>this.savePlans()} >Save</button>
				<div className="investment-plans-forms">
					{investmentPlans.map((ip,index)=>
						<InvPlanForm key={`ip${index}`} planData={ip} index={index} onRemove={(indx)=>this.removePlan(indx)} onChange={(indx, key, value)=>this.changePlanDetails(indx, key, value)} />
					)}
				</div>
			</div>
		);
	}
}

export default AdminInvestment;
