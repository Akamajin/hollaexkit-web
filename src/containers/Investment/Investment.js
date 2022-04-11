import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
	getBalances,
	createBalanceRowByUser,
	cancelWithdraw,
} from '../../actions/userAction';
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
			withdrawalTableData: [],
			withdrawAmount: '',
			loading: true,
			confirmMode: -1,
			plans: [],
			activeWithdrawForm: 'Interest',
			financialData: [],
			activeGroup: null,
			groups: {},
			buttonsForGroups: [],
			ei_iban: '',
			ei_bank_name: '',
			ei_holder_name: '',
			ei_acc_no: '',
			ei_trc_address: '',
		};
	}

	componentDidMount() {
		this.updateData();
		axios
			.get(`/admin/meta?key=investment_plans`)
			.then((res) => {
				this.setState({ plans: JSON.parse(res.data.value) });
			})
			.catch((err) => err.data);
	}

	cancelWithdrawReq(id) {
		this.setState({ loading: true });
		cancelWithdraw({ id }).then(() => {
			this.updateData();
		});
	}

	reqWithdraw() {
		const {
			activeWithdrawForm,
			interest,
			withdrawAmount,
			totalCapital,
			pendingWithdraws,
			pendingCIWithdraws,
			activeGroup,
			ei_iban,
			ei_bank_name,
			ei_holder_name,
			ei_acc_no,
			ei_trc_address,
		} = this.state;
		const amount = Number(withdrawAmount);
		const meta = JSON.stringify({
			ei_iban,
			ei_bank_name,
			ei_holder_name,
			ei_acc_no,
			ei_trc_address,
		});
		if (activeWithdrawForm === 'Interest') {
			if (amount > 0 && amount <= interest - pendingWithdraws) {
				this.setState({ loading: true });
				createBalanceRowByUser({
					action: 'Withdraw (Pending)',
					amount,
					group: activeGroup,
					meta,
				}).then(() => {
					this.updateData();
				});
			}
		} else {
			if (amount > 0 && amount <= totalCapital - pendingCIWithdraws) {
				this.setState({ loading: true });
				createBalanceRowByUser({
					action: 'Withdraw Investment (Pending)',
					amount,
					group: activeGroup,
					meta,
				}).then(() => {
					this.updateData();
				});
			}
		}
	}

	handleAmountChange(e, target) {
		const {
			interest,
			pendingWithdraws,
			totalCapital,
			pendingCIWithdraws,
			deduction,
		} = this.state;
		const diff =
			target === 'Interest'
				? interest - pendingWithdraws + deduction
				: totalCapital - pendingCIWithdraws;
		const re = /^[0-9]*\.?[0-9]?$/;
		let val = e.target.value;
		if (re.test(val) && Number(val) <= diff)
			this.setState({ withdrawAmount: val });
	}

	handleBankInfoChange = (e) => {
		this.setState({ [e.target.name]: e.target.value });
	};

	updateData() {
		this.setState({ loading: true });
		getBalances().then((res) => {
			this.setState(
				{
					loading: false,
					financialData: res.data.data,
					withdrawAmount: '',
					ei_iban: '',
					ei_bank_name: '',
					ei_holder_name: '',
					ei_acc_no: '',
					ei_trc_address: '',
				},
				this.updateTableData
			);
		});
	}

	getActionIcon(action) {
		let icon = null;
		switch (action) {
			case 'Withdraw Investment':
			case 'Capital Deduction':
				icon = (
					<svg
						viewBox="0 0 1024 1024"
						focusable="false"
						data-icon="caret-down"
						width="1em"
						height="1em"
						fill="#ed1c24"
						aria-hidden="true"
					>
						<path d="M840.4 300H183.6c-19.7 0-30.7 20.8-18.5 35l328.4 380.8c9.4 10.9 27.5 10.9 37 0L858.9 335c12.2-14.2 1.2-35-18.5-35z"></path>
					</svg>
				);
				break;
			case 'Interest':
				icon = (
					<div className="small-icon" style={{ color: '#2ccd2c' }}>
						$
					</div>
				);
				break;
			case 'Capital Increase':
				icon = (
					<svg
						viewBox="0 0 1024 1024"
						focusable="false"
						data-icon="caret-up"
						width="1em"
						height="1em"
						fill="#2ccd2c"
						aria-hidden="true"
					>
						<path d="M858.9 689L530.5 308.2c-9.4-10.9-27.5-10.9-37 0L165.1 689c-12.2 14.2-1.2 35 18.5 35h656.8c19.7 0 30.7-20.8 18.5-35z"></path>
					</svg>
				);
				break;
			case 'Capital Investment (Fixed)':
			case 'Capital Investment (Decreasing)':
				icon = (
					<div className="small-icon" style={{ color: '#027fff' }}>
						$
					</div>
				);
				break;
			case 'Withdraw (Pending)':
				icon = (
					<div className="small-icon" style={{ color: '#f9b800' }}>
						⊙
					</div>
				);
				break;
			case 'Withdraw Investment (Pending)':
				icon = (
					<div className="small-icon" style={{ color: '#f9b800' }}>
						⊛
					</div>
				);
				break;
			case 'Withdraw':
				icon = (
					<div className="small-icon" style={{ color: '#ed1c24' }}>
						$
					</div>
				);
				break;
			default:
				icon = '';
		}
		return icon;
	}

	setActiveGroup(id) {
		this.setState({ activeGroup: id }, this.updateTableData);
	}

	updateTableData = () => {
		let { activeGroup, financialData } = this.state;
		let groups = {};
		let buttonsForGroups = [];
		financialData.map((dr) => {
			const gid = dr.group.toString();
			if (groups[gid] === undefined) groups[gid] = {};
			Array.isArray(groups[gid]) ? groups[gid].push(dr) : (groups[gid] = [dr]);
			return null;
		});
		for (const groupId in groups) {
			const baseAction = groups[groupId].filter(
				(gp) =>
					gp.action === 'Capital Investment (Fixed)' ||
					gp.action === 'Capital Investment (Decreasing)'
			)[0];
			buttonsForGroups.push({
				groupId: Number(groupId),
				title: `${baseAction.action
					.split(' ')[2]
					.replace('(', '')
					.replace(')', '')} ($${baseAction.amount}@${
					baseAction.interest_rate
				}%)`,
			});
		}
		activeGroup = Number(
			!activeGroup && buttonsForGroups[0]
				? buttonsForGroups[0].groupId
				: activeGroup
		);

		/* Calculate grand total values*/
		let grandCapital = 0;
		let grandDeduction = 0;
		let grandInterest = 0;
		let grandWithdrawedInterest = 0;
		let grandPendingWithdrawals = 0;
		let grandPendingCIWithdrawals = 0;

		financialData.map((dr) => {
			const drAmount = dr.amount * 100;
			if (dr.action === 'Capital Investment (Fixed)') {
				grandCapital += drAmount;
			} else if (dr.action === 'Capital Investment (Decreasing)') {
				grandCapital += drAmount;
			} else if (dr.action === 'Capital Increase') {
				grandCapital += drAmount;
			} else if (dr.action === 'Capital Deduction') {
				grandDeduction += drAmount;
			} else if (dr.action === 'Withdraw Investment') {
				grandCapital -= drAmount;
			} else if (dr.action === 'Interest') {
				grandInterest += drAmount;
			} else if (dr.action === 'Withdraw') {
				grandWithdrawedInterest += drAmount;
			} else if (dr.action === 'Withdraw (Pending)') {
				grandPendingWithdrawals += drAmount;
			} else if (dr.action === 'Withdraw Investment (Pending)') {
				grandPendingCIWithdrawals += drAmount;
			}
			return dr;
		});
		/* End calculate grand total values*/

		let currentGroupData = financialData.filter(
			(d) =>
				d.group === activeGroup &&
				d.action !== 'Withdraw' &&
				d.action !== 'Withdraw (Pending)'
		);
		let withdrawalTableData = financialData.filter(
			(d) => d.action === 'Withdraw' || d.action === 'Withdraw (Pending)'
		);

		let mode = '';
		let totalCapital = 0;
		let interest = 0;
		let withdrawedInterest = 0;
		let deduction = 0;
		let pendingWithdraws = 0;
		let pendingCIWithdraws = 0;

		const tableData = currentGroupData.map((dr) => {
			const drAmount = dr.amount * 100;
			if (dr.action === 'Capital Investment (Fixed)') {
				totalCapital += drAmount;
				mode = 'fixed';
			} else if (dr.action === 'Capital Investment (Decreasing)') {
				totalCapital += drAmount;
				mode = 'decreasing';
			} else if (dr.action === 'Capital Increase') {
				totalCapital += drAmount;
			} else if (dr.action === 'Capital Deduction') {
				deduction += drAmount;
			} else if (dr.action === 'Withdraw Investment') {
				totalCapital -= drAmount;
				dr.amount = drAmount / 100;
			} else if (dr.action === 'Interest') {
				interest += drAmount;
			} else if (dr.action === 'Withdraw') {
				withdrawedInterest += drAmount;
				dr.amount = drAmount / 100;
			} else if (dr.action === 'Withdraw Investment (Pending)') {
				pendingCIWithdraws += drAmount;
			} else if (dr.action === 'Withdraw (Pending)') {
				pendingWithdraws += drAmount;
			}
			return dr;
		});
		this.setState({
			tableData,
			withdrawalTableData,
			totalCapital: totalCapital / 100,
			interest: interest / 100,
			withdrawedInterest: withdrawedInterest / 100,
			deduction: deduction / 100,
			pendingWithdraws: pendingWithdraws / 100,
			pendingCIWithdraws: pendingCIWithdraws / 100,

			grandCapital: grandCapital / 100,
			grandDeduction: grandDeduction / 100,
			grandInterest: grandInterest / 100,
			grandWithdrawedInterest: grandWithdrawedInterest / 100,
			grandPendingWithdrawals: grandPendingWithdrawals / 100,
			grandPendingCIWithdrawals: grandPendingCIWithdrawals / 100,

			loading: false,
			mode,
			groups,
			buttonsForGroups,
			activeGroup,
		});
	};

	render() {
		const {
			tableData,
			withdrawalTableData,
			totalCapital,
			interest,
			deduction,
			withdrawedInterest,
			pendingWithdraws,
			pendingCIWithdraws,
			grandCapital,
			grandDeduction,
			grandWithdrawedInterest,
			grandPendingWithdrawals,
			grandInterest,
			grandPendingCIWithdrawals,
			withdrawAmount,
			loading,
			confirmMode,
			plans,
			activeWithdrawForm,
			buttonsForGroups,
			activeGroup,
			ei_iban,
			ei_bank_name,
			ei_holder_name,
			ei_acc_no,
			ei_trc_address,
		} = this.state;
		const { icons: ICONS } = this.props;
		if (loading) {
			return (
				<div className="app_container-content invstmnt-spinner">
					<Spin size="large" />
				</div>
			);
		}
		let activeCard = 0;
		plans.map((card) => {
			if (grandCapital >= card.minInvest) activeCard = card.minInvest;
			return null;
		});
		const availableWithdrawAmount =
			activeWithdrawForm === 'Interest'
				? interest + deduction - withdrawedInterest - pendingWithdraws
				: totalCapital - deduction - pendingCIWithdraws;
		return (
			<div className="apply_rtl">
				<div className="presentation_container apply_rtl wallet-wrapper">
					<IconTitle
						stringId="WALLET_TITLE"
						text="Investment"
						iconPath={ICONS['QUICK_TRADE_SUCCESSFUL']}
						textType="title"
					/>
					{grandCapital ? (
						<div className="investment-container">
							<div className="inv-overview">
								<table className="user-investment-table mb-auto">
									<thead>
										<tr>
											<td></td>
											<td>Current</td>
											<td>Total</td>
										</tr>
									</thead>
									<tbody>
										<tr>
											<td>Total Capital</td>
											<th>${totalCapital}</th>
											<th>${grandCapital}</th>
										</tr>
										<tr>
											<td>Remained Capital</td>
											<th>{'$' + (totalCapital - deduction)}</th>
											<th>{'$' + (grandCapital - grandDeduction)}</th>
										</tr>
										<tr>
											<td>Withdrawable Interest</td>
											<th>
												$
												{interest +
													deduction -
													withdrawedInterest -
													pendingWithdraws}
											</th>
											<th>
												$
												{grandInterest -
													grandWithdrawedInterest -
													grandPendingWithdrawals +
													grandDeduction}
											</th>
										</tr>
										<tr>
											<td>Withdrawable Capital</td>
											<th>${totalCapital - deduction - pendingCIWithdraws}</th>
											<th>
												{grandCapital -
													grandDeduction -
													grandPendingCIWithdrawals}
											</th>
										</tr>
										<tr>
											<td>Total Interests (Till Now)</td>
											<th>${interest}</th>
											<th>${grandInterest}</th>
										</tr>
									</tbody>
								</table>
								<div className="withdraw-box">
									<div className="mb-1">
										Request Withdraw (${availableWithdrawAmount} max)
									</div>
									<RadioGroup
										onChange={(e) => {
											this.setState({
												activeWithdrawForm: e.target.value,
												withdrawAmount: '',
											});
										}}
										value={activeWithdrawForm}
									>
										<Radio value="Interest">Withdraw Interest</Radio>
										<Radio value="Capital">Withdraw Investment</Radio>
									</RadioGroup>
									{availableWithdrawAmount > 0 ? (
										<div className="d-flex">
											<div className="wf-row">
												<label>Amount:</label>
												<input
													value={withdrawAmount}
													onChange={(e) =>
														this.handleAmountChange(e, activeWithdrawForm)
													}
													className="amount-input"
												/>
											</div>
											<div className="wf-separator">
												<span></span>Bank Info (optional)<span></span>
											</div>
											<div className="wf-row">
												<label>IBAN:</label>
												<input
													value={ei_iban}
													onChange={this.handleBankInfoChange}
													name="ei_iban"
													className="amount-input"
												/>
											</div>
											<div className="wf-row">
												<label>Bank Name:</label>
												<input
													value={ei_bank_name}
													onChange={this.handleBankInfoChange}
													name="ei_bank_name"
													className="amount-input"
												/>
											</div>
											<div className="wf-row">
												<label>Holder Full Name:</label>
												<input
													value={ei_holder_name}
													onChange={this.handleBankInfoChange}
													name="ei_holder_name"
													className="amount-input"
												/>
											</div>
											<div className="wf-row">
												<label>Acc No:</label>
												<input
													value={ei_acc_no}
													onChange={this.handleBankInfoChange}
													name="ei_acc_no"
													className="amount-input"
												/>
											</div>
											<div className="wf-separator">
												<span></span>Wallet Info (optional)<span></span>
											</div>
											<div className="wf-row">
												<label>USDT TRC Address:</label>
												<input
													value={ei_trc_address}
													onChange={this.handleBankInfoChange}
													name="ei_trc_address"
													className="amount-input"
												/>
											</div>
											<button
												className="holla-button button-success mdc-button mdc-button--unelevated holla-button-font"
												onClick={() => {
													this.reqWithdraw();
												}}
											>
												Submit
											</button>
										</div>
									) : (
										<div className="insfcnt-balance text-center">
											Insufficient Balance
										</div>
									)}
								</div>
							</div>
							<div className="investment-buttons invb-users mb-1">
								<div>
									{buttonsForGroups.map((grp) => (
										<button
											className={`ant-btn ant-btn-secondary ${
												activeGroup === grp.groupId ? 'ant-btn-warning' : ''
											}`}
											key={grp.groupId}
											onClick={() => {
												this.setActiveGroup(grp.groupId);
												this.setState({ withdrawAmount: '' });
											}}
										>
											{grp.title}
										</button>
									))}
								</div>
							</div>
							<div className="inv-table-wrapper">
								<div className="inv-table-title">Investments and Interests</div>
								<table className="table table-striped">
									<thead>
										<tr>
											<th>Date</th>
											<th>Type</th>
											<th>Amount</th>
											<th>End Date</th>
											<th>Status</th>
										</tr>
									</thead>
									<tbody>
										{tableData.map((td, index) => (
											<tr key={`tr${index}`}>
												<td>{moment(td.created_at).format('YYYY-MM-DD')}</td>
												<td>
													{this.getActionIcon(td.action)}
													{td.action}
												</td>
												<td>{td.amount}</td>
												<td>
													{td.end_date
														? moment(td.end_date).format('YYYY-MM-DD')
														: ''}
												</td>
												<td>
													{td.action === 'Withdraw Investment (Pending)' ? (
														<div className="invstmnt-table-actions">
															{confirmMode !== td.id ? (
																<div>
																	Pending{' '}
																	<span
																		className="text-button"
																		onClick={() => {
																			this.setState({ confirmMode: td.id });
																		}}
																	>
																		(Click to cancel)
																	</span>
																</div>
															) : null}
															{confirmMode === td.id ? (
																<button
																	className="holla-button button-fail mdc-button mdc-button--unelevated holla-button-font"
																	onClick={() => {
																		this.cancelWithdrawReq(td.id);
																	}}
																>
																	I'm sure
																</button>
															) : null}
															{confirmMode === td.id ? (
																<button
																	className="holla-button mdc-button mdc-button--unelevated holla-button-font"
																	onClick={() => {
																		this.setState({ confirmMode: -1 });
																	}}
																>
																	No
																</button>
															) : null}
														</div>
													) : (
														'Ok'
													)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
							<div className="inv-table-wrapper">
								<div className="inv-table-title itt-orange">
									Interest Withdrawals
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
										{withdrawalTableData.map((td, index) => (
											<tr key={`tr${index}`}>
												<td>{moment(td.created_at).format('YYYY-MM-DD')}</td>
												<td>
													{this.getActionIcon(td.action)}
													{td.action}
												</td>
												<td>{td.amount}</td>
												<td>
													{td.action === 'Withdraw (Pending)' ||
													td.action === 'Withdraw Investment (Pending)' ? (
														<div className="invstmnt-table-actions">
															{confirmMode !== td.id ? (
																<div>
																	Pending{' '}
																	<span
																		className="text-button"
																		onClick={() => {
																			this.setState({ confirmMode: td.id });
																		}}
																	>
																		(Click to cancel)
																	</span>
																</div>
															) : null}
															{confirmMode === td.id ? (
																<button
																	className="holla-button button-fail mdc-button mdc-button--unelevated holla-button-font"
																	onClick={() => {
																		this.cancelWithdrawReq(td.id);
																	}}
																>
																	I'm sure
																</button>
															) : null}
															{confirmMode === td.id ? (
																<button
																	className="holla-button mdc-button mdc-button--unelevated holla-button-font"
																	onClick={() => {
																		this.setState({ confirmMode: -1 });
																	}}
																>
																	No
																</button>
															) : null}
														</div>
													) : (
														'Ok'
													)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					) : (
						<div className="investment-container text-center">No Data</div>
					)}
					<hr />
					{plans.length ? (
						<h2 className="investment-plans-title">VIP Plans</h2>
					) : null}
					<div className="investment-plans">
						{plans.map((cardData, indx) => (
							<InvestCard
								cardData={cardData}
								key={`card${indx}`}
								isActive={cardData.minInvest === activeCard}
							/>
						))}
					</div>
				</div>
			</div>
		);
	}
}

const mapStateToProps = (store) => ({});

const mapDispatchToProps = (dispatch) => ({});

export default connect(
	mapStateToProps,
	mapDispatchToProps
)(withConfig(Investment));
