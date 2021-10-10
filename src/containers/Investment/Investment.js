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
			totalCapital: 0,
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
		const { activeWithdrawForm, interest, withdrawAmount, totalCapital, pendingWithdraws, pendingCIWithdraws } = this.state
		const amount = Number(withdrawAmount)
		
		if (activeWithdrawForm === 'Interest') {
			if (amount > 0 && amount <= interest - pendingWithdraws) {
				this.setState({loading: true})
				createBalanceRowByUser({action: 'Withdraw (Pending)', amount }).then(()=>{this.updateData()})
			}
		} else {
			if (amount > 0 && amount <= totalCapital - pendingCIWithdraws) {
				this.setState({loading: true})
				createBalanceRowByUser({action: 'Withdraw Investment (Pending)', amount }).then(()=>{this.updateData()})
			}
		}
	}

	handleInputChange (e, target) {
		const {interest, pendingWithdraws, totalCapital, pendingCIWithdraws} = this.state
		const diff = target === 'Interest' ? interest - pendingWithdraws : totalCapital - pendingCIWithdraws
		const re = /^[0-9]*\.?[0-9]?$/;
		let val = e.target.value;
		if (re.test(val) && Number(val) <= diff) this.setState({withdrawAmount: val})
	}

	updateData () {
		this.setState({loading: true})
		getBalances().then(res => {
			let mode = ''
			let totalCapital = 0
			let interest = 0
			let withdrawedInterest = 0
			let deduction = 0
			let pendingWithdraws = 0
			let pendingCIWithdraws = 0
			const tableData = res.data.data.map(dt=>{
				const dtAmount = dt.amount * 100
				if (dt.action === "Capital Investment (Fixed)") {
					totalCapital += dtAmount
					mode = "fixed"
				} else if (dt.action === "Capital Investment (Decreasing)") {
					totalCapital += dtAmount
					mode = "decreasing"
				} else if (dt.action === "Capital Increase") {
					totalCapital += dtAmount
				} else if (dt.action === "Capital Deduction") {
					deduction += dtAmount
				} else if (dt.action === "Withdraw Investment") {
					totalCapital -= dtAmount
					dt.amount = -dtAmount/100
				} else if (dt.action === "Withdraw Investment (Pending)") {
					pendingCIWithdraws += dtAmount
				} else if (dt.action === "Interest") {
					interest += dtAmount
				} else if (dt.action === "Withdraw") {
					withdrawedInterest += dtAmount
					dt.amount = -dtAmount/100
				} else if (dt.action === "Withdraw (Pending)") {
					pendingWithdraws += dtAmount
				}
				return dt
			})
			this.setState({
				tableData,
				totalCapital: totalCapital/100,
				interest: interest/100,
				withdrawedInterest: withdrawedInterest/100,
				deduction: deduction/100,
				pendingWithdraws: pendingWithdraws/100,
				pendingCIWithdraws: pendingCIWithdraws/100,
				mode,
				loading: false
			})
		})
	}

	getActionIcon (action) {
		let icon = null
		switch (action) {
			case "Withdraw Investment":
			case "Capital Deduction":
				icon = <svg viewBox="0 0 1024 1024" focusable="false" data-icon="caret-down" width="1em" height="1em" fill="#ed1c24" aria-hidden="true"><path d="M840.4 300H183.6c-19.7 0-30.7 20.8-18.5 35l328.4 380.8c9.4 10.9 27.5 10.9 37 0L858.9 335c12.2-14.2 1.2-35-18.5-35z"></path></svg>
				break;
			case "Interest":
				icon = <div className="small-icon" style={{color: "#2ccd2c"}} >$</div>
				break;
			case "Capital Increase":
				icon = <svg viewBox="0 0 1024 1024" focusable="false" data-icon="caret-up" width="1em" height="1em" fill="#2ccd2c" aria-hidden="true"><path d="M858.9 689L530.5 308.2c-9.4-10.9-27.5-10.9-37 0L165.1 689c-12.2 14.2-1.2 35 18.5 35h656.8c19.7 0 30.7-20.8 18.5-35z"></path></svg>
				break;
			case "Capital Investment (Fixed)":
			case "Capital Investment (Decreasing)":
				icon = <div className="small-icon" style={{color: "#027fff"}} >$</div>
				break;
			case "Withdraw (Pending)":
				icon = <div className="small-icon" style={{color: "#f9b800"}} >⊙</div>
				break;
			case "Withdraw Investment (Pending)":
				icon = <div className="small-icon" style={{color: "#f9b800"}} >⊛</div>
				break;
			case "Withdraw":
				icon = <div className="small-icon" style={{color: "#ed1c24"}} >$</div>
				break;
			default:
				icon = ''
		}
		return icon
	}

	render() {
		const { tableData, mode, totalCapital, interest, withdrawedInterest, deduction, pendingWithdraws, pendingCIWithdraws, withdrawAmount, loading, confirmMode, plans, activeWithdrawForm } = this.state;
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
			if (totalCapital>=card.minInvest) activeCard = card.minInvest
			return null
		})
		const availableWithdrawAmount = activeWithdrawForm === "Interest" ? interest-withdrawedInterest-pendingWithdraws : totalCapital-deduction-pendingCIWithdraws
		return (
			<div className="apply_rtl">
				<div className="presentation_container apply_rtl wallet-wrapper">
					<IconTitle
						stringId="WALLET_TITLE"
						text="Investment"
						iconPath={ICONS['QUICK_TRADE_SUCCESSFUL']}
						textType="title"
					/>
					{totalCapital ? <div className="investment-container">
						<div className="inv-overview">
							<div>
								<div>Total Capital: ${totalCapital}</div>
								{mode === "decreasing" ? <div>Remained Capital: ${totalCapital - deduction}</div> : null}
								<div>Withdrawable Amount: ${interest - withdrawedInterest}</div>
								<div>Total Interests (Till Now): ${interest}</div>
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
								{tableData.map((td, index)=>(
								<tr key={`tr${index}`}>
									<td>{moment(td.created_at).format("YYYY-MM-DD")}</td>
									<td>{this.getActionIcon(td.action)}{td.action}</td>
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
