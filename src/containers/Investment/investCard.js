import React, { Component } from 'react';

class InvestCard extends Component {
	render() {
		const { cardData, isActive } = this.props;
		return (
			<div className={isActive ? "invest-card ic-active" : "invest-card"}>
				<div className="ic-header">
					<div className="ic-title">{cardData.title}</div>
					<div className="ic-amount">
						<div>Starting From</div>
						<h3>${cardData.minInvest}</h3>
					</div>
				</div>
				<ul>
					{cardData.features.split("\n").map((cdf, index)=> <li key={`li${index}`}>{cdf}</li> )}
				</ul>
				{isActive ? <div className="ic-active-text">Active Plan</div> : null}
			</div>
		);
	}
}

export default InvestCard;
