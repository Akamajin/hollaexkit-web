import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getBalances, createBalanceRowByUser, cancelWithdraw } from '../../actions/userAction';
import { IconTitle } from 'components';
import { Spin, Radio } from 'antd';
import withConfig from 'components/ConfigProvider/withConfig';
import moment from 'moment';
import InvestCard from './investCard';
import axios from 'axios';

const RadioGroup = Radio.Group;

class Investment extends Component {
	constructor(props) {
		super(props);
		this.state = {
			capitalInvestment: 0,
			interest: 0,
			pendingWithdraws: 0,
			pendingCIWithdraws: 0,
			tableData: [],
			withdrawAmount: '',
			loading: true,
			confirmMode: -1,
			plans: [],
			activeWithdrawForm: "Interest"
		};
	}

	componentDidMount() {
		this.updateData()
		axios.get(`/admin/meta?key=investment_plans`)
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
		const { activeWithdrawForm, interest, withdrawAmount, capitalInvestment, pendingWithdraws, pendingCIWithdraws } = this.state
		const amount = Number(withdrawAmount)
		
		if (activeWithdrawForm === 'Interest') {
			if (amount > 0 && amount <= interest - pendingWithdraws) {
				this.setState({loading: true})
				createBalanceRowByUser({action: 'Withdraw (Pending)', amount }).then(()=>{this.updateData()})
			}
		} else {
			if (amount > 0 && amount <= capitalInvestment - pendingCIWithdraws) {
				this.setState({loading: true})
				createBalanceRowByUser({action: 'Withdraw Investment (Pending)', amount }).then(()=>{this.updateData()})
			}
		}
	}

	handleInputChange (e, target) {
		const {interest, pendingWithdraws, capitalInvestment, pendingCIWithdraws} = this.state
		const diff = target === 'Interest' ? interest - pendingWithdraws : capitalInvestment - pendingCIWithdraws
		const re = /^[0-9]*\.?[0-9]?$/;
		let val = e.target.value;
		if (re.test(val) && Number(val) <= diff) this.setState({withdrawAmount: val})
	}

	updateData () {
		this.setState({loading: true})
		getBalances().then(result => {
			let capitalInvestment = 0
			let interest = 0
			let pendingWithdraws = 0
			let pendingCIWithdraws = 0
			let tableData = []
			result.data.data.map(dt=>{
				const dtAmount = dt.amount * 100
				if (dt.action === "Capital Investment") {
					capitalInvestment += dtAmount
				} else if (dt.action === "Withdraw Investment") {
					capitalInvestment -= dtAmount
				} else if (dt.action === "Withdraw Investment (Pending)") {
					pendingCIWithdraws += dtAmount
				} else if (dt.action === "Interest") {
					interest += dtAmount
				} else if (dt.action === "Withdraw") {
					interest -= dtAmount
				} else if (dt.action === "Withdraw (Pending)") {
					pendingWithdraws += dtAmount
				}
				tableData.push(dt)
			})
			this.setState({
				capitalInvestment: capitalInvestment/100,
				interest: interest/100,
				tableData,
				pendingWithdraws: pendingWithdraws/100,
				pendingCIWithdraws: pendingCIWithdraws/100,
				loading: false
			})
		})
	}

	render() {
		const { capitalInvestment, interest, tableData, withdrawAmount, pendingWithdraws, pendingCIWithdraws, loading, confirmMode, plans, activeWithdrawForm } = this.state;
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
			if (capitalInvestment>=card.minInvest) activeCard = card.minInvest
		})
		const availableWithdrawAmount = activeWithdrawForm === "Interest" ? interest-pendingWithdraws : capitalInvestment-pendingCIWithdraws
		return (
			<div className="apply_rtl">
				<div className="presentation_container apply_rtl wallet-wrapper">
					<IconTitle
						stringId="WALLET_TITLE"
						text="Investment"
						iconPath={ICONS['QUICK_TRADE_SUCCESSFUL']}
						textType="title"
					/>
					{capitalInvestment ? <div className="investment-container">
						<div className="inv-overview">
							<div>
								<div>Base Deposit: ${capitalInvestment}</div>
								<div>Interests: ${interest}</div>
								<div>Total: ${capitalInvestment + interest}</div>
							</div>
							<div className="withdraw-box">
								<div className="mb-1">Request Withdraw (${availableWithdrawAmount} max)</div>
								<RadioGroup onChange={(e)=> {this.setState({activeWithdrawForm: e.target.value, withdrawAmount: '' })}} value={activeWithdrawForm}>
      							  <Radio value="Interest">Withdraw Interest</Radio>
      							  <Radio value="Capital">Withdraw Investment</Radio>
      							</RadioGroup>
								{ availableWithdrawAmount > 0 ? <div className="d-flex">
									<input placeholder="Amount..." value={withdrawAmount} onChange={(e) => this.handleInputChange(e,activeWithdrawForm)} className="amount-input"/>
									<button className="holla-button button-success mdc-button mdc-button--unelevated holla-button-font" onClick={()=>{this.reqWithdraw()}}>Submit</button>
								</div> : null }
							</div>
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
									<td>{td.action === "Withdraw" || td.action === "Withdraw Investment" ? "-" : null}{td.amount}</td>
									<td>{td.action === "Withdraw (Pending)" || td.action === "Withdraw Investment (Pending)" ? <div className="invstmnt-table-actions">
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
