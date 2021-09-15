import React, { Component } from 'react';
import './index.css';

class InvPlanForm extends Component {
	render() {
		const { index, planData, onRemove, onChange} = this.props;
		return (
			<div className="investment-plan-form">
				<div className="input_field">
					<label className="sub-title">Title</label>
					<div>
						<div className="d-flex align-items-center">
							<input type="text" className="ant-input" value={planData.title} onChange={(e)=> onChange(index, 'title', e.target.value)} />
						</div>
					</div>
				</div>
				<div className="input_field">
					<label className="sub-title">Starting From</label>
					<div>
						<div className="d-flex align-items-center">
							<input type="text" className="ant-input" value={planData.minInvest} onChange={(e)=> onChange(index, 'minInvest', e.target.value)} />
						</div>
					</div>
				</div>
				<div className="input_field">
					<label className="sub-title">Features</label>
					<div>
						<div className="d-flex align-items-center">
							<textarea rows="5" className="ant-input" value={planData.features} onChange={(e)=> onChange(index, 'features', e.target.value)}></textarea>
						</div>
					</div>
				</div>
				<button className="ant-btn ant-btn-primary mr-3" onClick={()=> onRemove(index)} >Remove</button>
			</div>
		);
	}
}

export default InvPlanForm;
