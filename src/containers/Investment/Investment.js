import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getBalances, createBalanceRowByUser, cancelWithdraw } from '../../actions/userAction';
import { IconTitle } from 'components';
import { Spin } from 'antd';
import withConfig from 'components/ConfigProvider/withConfig';
import moment from 'moment';
import InvestCard from './investCard';
import axios from 'axios';

class Investment extends Component {
	constructor(props) {
		super(props);
		this.state = {
			baseDeposit: 0,
			interest: 0,
			pendingWithdraws: 0,
			tableData: [],
			withdrawAmount: '',
			loading: true,
			confirmMode: -1,
			plans: []
		};
	}

	componentDidMount() {
		this.updateData()
		axios.get(`/admin/meta?key=investmnet_plans`)
		.then(res => {
			this.setState({plans: JSON.parse(res.data.value)}) 
		})
		.catch(err => err.data);
	}

	cancelWithdrawReq (id) {
		this.setState({loading: true})
		cancelWithdraw({id}).then(()=>{
			this.updateData()
		})
	}

	reqWithdraw () {
		const amount = Number(this.state.withdrawAmount)
		if (amount > 0 && amount < this.state.interest) {
			this.setState({loading: true})
			createBalanceRowByUser({action: 'Withdraw Request', amount }).then(()=>{
				this.updateData()
			})
		}
	}

	handleInputChange (e) {
		const re = /^[0-9]*\.?[0-9]?$/;
		let val = e.target.value;
		if (re.test(val) && Number(val) <= this.state.interest - this.state.pendingWithdraws) this.setState({withdrawAmount: val})
	}

	updateData () {
		this.setState({loading: true})
		getBalances().then(result => {
			let baseDeposit = 0
			let interest = 0
			let pendingWithdraws = 0
			let tableData = []
			result.data.data.map(dt=>{
				const dtAmount = dt.amount * 100
				if (dt.action === "Initial Deposit") {
					baseDeposit = dtAmount
				} else if (dt.action === "Interest") {
					interest += dtAmount
				} else if (dt.action === "Withdraw") {
					interest -= dtAmount
				} else if (dt.action === "Withdraw Request") {
					pendingWithdraws += dtAmount
				}
				if (dt.action !== "Initial Deposit") tableData.push(dt)
			})
			this.setState({
				baseDeposit: baseDeposit/100,
				interest: interest/100,
				tableData,
				pendingWithdraws: pendingWithdraws/100,
				loading: false
			})
		})
	}

	render() {
		const { baseDeposit, interest, tableData, withdrawAmount, pendingWithdraws, loading, confirmMode, plans } = this.state;
		const { icons: ICONS } = this.props;
		if (loading) {
			return (
				<div className="app_container-content invstmnt-spinner">
					<Spin size="large" />
				</div>
			);
		}
		let activeCard = 0
		plans.map(card=>{
			if (baseDeposit>=card.minInvest) activeCard = card.minInvest
		})
		return (
			<div className="apply_rtl">
				<div className="presentation_container apply_rtl wallet-wrapper">
					<IconTitle
						stringId="WALLET_TITLE"
						text="Investment"
						iconPath={ICONS['QUICK_TRADE_SUCCESSFUL']}
						textType="title"
					/>
					{baseDeposit ? <div className="investment-container">
						<div className="inv-overview">
							<div>
								<div>Base Deposit: ${baseDeposit}</div>
								<div>Interests: ${interest}</div>
								<div>Total: ${baseDeposit + interest}</div>
							</div>
							{interest-pendingWithdraws > 0 ? <div className="withdraw-box">
								<div className="mb-1">Request Withdraw (${interest-pendingWithdraws} max)</div>
								<div className="d-flex">
									<input placeholder="Amount..." value={withdrawAmount} onChange={(e) => this.handleInputChange(e)} />
									<button className="holla-button button-success mdc-button mdc-button--unelevated holla-button-font" onClick={()=>{this.reqWithdraw()}}>Submit</button>
								</div>
							</div> : null }
						</div>
						<table className="table table-striped">
							<thead>
								<tr>
									<th>Date</th>
									<th>Type</th>
									<th>Amount</th>
									<th>Status</th>
								</tr>
							</thead>
							<tbody>
								{tableData.map(td=>(
								<tr key={td.created_at}>
									<td>{moment(td.created_at).format("YYYY-MM-DD")}</td>
									<td>{td.action}</td>
									<td>{td.action === "Withdraw" ? "-" : null}{td.amount}</td>
									<td>{td.action === "Withdraw Request" ? <div className="invstmnt-table-actions">
											{confirmMode !== td.id ? <div>Pending <span className="text-button" onClick={()=>{this.setState({confirmMode: td.id})}}>(Click to cancel)</span></div> : null}
											{confirmMode === td.id ? <button className="holla-button button-fail mdc-button mdc-button--unelevated holla-button-font" onClick={()=>{this.cancelWithdrawReq(td.id)}}>I'm sure</button> : null}
											{confirmMode === td.id ? <button className="holla-button mdc-button mdc-button--unelevated holla-button-font" onClick={()=>{this.setState({confirmMode: -1})}}>No</button> : null}
										</div>
									: "Ok"}</td>
								</tr>
								))}
							</tbody>
						</table>
					</div> : <div className="investment-container text-center">No Data</div> }
					<hr />
					{plans.length ? <h2 className="investment-plans-title">VIP Plans</h2> : null}
					<div className="investment-plans">
					{plans.map((cardData, indx)=> <InvestCard cardData={cardData} key={`card${indx}`} isActive={cardData.minInvest === activeCard} />)}
					</div>
				</div>
			</div>
		);
	}
}

const mapStateToProps = (store) => ({
});

const mapDispatchToProps = (dispatch) => ({
	
});

export default connect(mapStateToProps, mapDispatchToProps)(withConfig(Investment));
