import React from 'react'

import PropTypes from 'prop-types'

import './footer.css'

const Footer = (props) => {
  return (
    <footer className="footer-footer7 thq-section-padding">
      <div className="footer-max-width thq-section-max-width">
        <div className="footer-content">
          <div className="footer-logo1">
            <img
              alt={props.logoAlt}
              src={props.logoSrc}
              className="footer-logo2"
            />
          </div>
          <div className="footer-links">
            <a
              href="#home"
              rel="noreferrer noopener"
              className="thq-body-small"
            >
              {props.link1 ?? (
                  <span>Home</span>
              )}
            </a>
            <a
              href="#features"
              rel="noreferrer noopener"
              className="thq-body-small"
            >
              {props.link2 ?? (
                  <span>Features</span>
              )}
            </a>
            <a
              href="#price"
              rel="noreferrer noopener"
              className="thq-body-small"
            >
              {props.link3 ?? (
                  <span>Pricing</span>
              )}
            </a>
            <a
              href="#contact"
              rel="noreferrer noopener"
              className="thq-body-small"
            >
              {props.link4 ?? (
                  <span>Contact Us</span>
              )}
            </a>
            <a
              href="https://example.com"
              target="_blank"
              rel="noreferrer noopener"
              className="thq-body-small"
            >
              {props.link5 ?? (
                  <span>FAQ</span>
              )}
            </a>
          </div>
        </div>
        <div className="footer-credits">
          <div className="thq-divider-horizontal"></div>
          <div className="footer-row">
            <div className="footer-container">
              <span className="thq-body-small">Nhom 8</span>
            </div>
            <div className="footer-footer-links">
              <span className="footer-text11 thq-body-small">
                {props.privacyLink ?? (
                    <span>Privacy Policy</span>

                )}
              </span>
              <span className="thq-body-small">
                {props.termsLink ?? (
                    <span>Terms of Service</span>

                )}
              </span>
              <span className="thq-body-small">
                {props.cookiesLink ?? (
                    <span>Cookies Policy</span>

                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

Footer.defaultProps = {
  link5: undefined,
  link3: undefined,
  link1: undefined,
  termsLink: undefined,
  link2: undefined,
  link4: undefined,
  logoAlt: 'Temp Logo',
  cookiesLink: undefined,
  logoSrc: 'https://icons8.com/icon/111279/schedule',
  privacyLink: undefined,
}

Footer.propTypes = {
  link5: PropTypes.element,
  link3: PropTypes.element,
  link1: PropTypes.element,
  termsLink: PropTypes.element,
  link2: PropTypes.element,
  link4: PropTypes.element,
  logoAlt: PropTypes.string,
  cookiesLink: PropTypes.element,
  logoSrc: PropTypes.string,
  privacyLink: PropTypes.element,
}

export default Footer
