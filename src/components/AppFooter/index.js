import React from 'react';
import classnames from 'classnames';
// import { PUBLIC_URL } from '../../config/constants';
import withConfig from 'components/ConfigProvider/withConfig';
import withEdit from 'components/EditProvider/withEdit';
import STRINGS from 'config/localizedStrings';

const AppFooter = ({
	className,
	theme,
	constants = { description: '' },
	constants: { links = {} },
	icons: ICONS,
	isEditMode,
	router
}) => {
	return (
		<div className={classnames('app_footer-container','d-flex','flex-column','apply_rtl',{'deep-footer': isEditMode },className)}>
			{/*<div className={classnames('d-flex','justify-content-around','footer-row-content','mx-auto')}>
				<div className={classnames('d-flex','justify-content-center','align-items-start','footer-links-section')}>
					<div className={classnames('d-flex', 'flex-1', {'flex-column': isMobile,})}>
						<div className={classnames('d-flex', 'flex-wrap', {'flex-column': isMobile,})}>
							{generateSectionsText(constants.links, ICONS)
								.filter(({ LINKS }) => LINKS.length)
								.map(({ TITLE, LINKS }, index) => (
									<div key={index} className={classnames('d-flex','flex-column','footer-links-group')}>
										<div className="footer-links-section--title">{TITLE}</div>
										<div className={classnames('d-flex','flex-column','footer-links-section--list')} >
											{LINKS.map(({ link, text, icon }, indexLink) => (
												<div key={indexLink} className="link-section d-flex">
													<a href={link || '#'} target="_blank" rel="noopener noreferrer"	>
														<div className={classnames('d-flex', 'f-1', 'flex-row')}>
															<div>
																{icon ? (<img src={icon} className="social_icon" alt="social_icons" />) : null}
															</div>
															<span>{text}</span>
														</div>
													</a>
												</div>
											))}
										</div>
									</div>
								))}
						</div>
						<div className="footer_separter">
							<div className="footer-content">
								<div className="d-flex">
									<Image iconId="EXCHANGE_LOGO" icon={ICONS['EXCHANGE_LOGO']} wrapperClassName="footer-logo" />
								</div>
								<div className="footer-txt">
									{constants.description || ''}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>*/}
			<div
				className={classnames(
					'footer-row-bottom',
					'd-flex',
					'justify-content-between',
					'align-center'
				)}
			>
				<div className="d-flex pt-2">
					<div className="pr-2">
						<span style={{cursor: 'pointer'}} onClick={()=>router.push('/tos')}>{STRINGS['FOOTER.TERMS_OF_SERVICE']}</span>
					</div>
					<span>|</span>
					<div className="pl-2">
						<span style={{cursor: 'pointer'}} onClick={()=>router.push('/faq')}>{STRINGS['FOOTER.SECTIONS.SECTION_5_LINK_4']}</span>
					</div>
				</div>
				<div className="px-4 mx-4" />
			</div>
		</div>
	);
};

AppFooter.defaultProps = {
	className: '',
	onChangeLanguage: () => () => {},
	activeLanguage: '',
};

export default withEdit(withConfig(AppFooter));
