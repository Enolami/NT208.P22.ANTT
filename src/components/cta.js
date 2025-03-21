import React from 'react'

import PropTypes from 'prop-types'

import './cta.css'

const CTA = (props) => {
  return (
    <div id={props.id} className="thq-section-padding">
      <div className="thq-section-max-width">
        <div className="cta-accent2-bg">
          <div className="cta-accent1-bg">
            <div className="cta-container2">
              <div className="cta-content">
                <span className="thq-heading-2">
                  {props.heading1 ?? (
                      <span>
                        Boost Your Productivity with Our Smart Scheduling System
                      </span>
                  )}
                </span>
                <p className="thq-body-large">
                  {props.content1 ?? (
                      <span>
                        Take control of your time and stay organized with our
                        intelligent timetable system that seamlessly integrates
                        with your daily tasks.
                      </span>
                  )}
                </p>
              </div>
              <div className="cta-actions">
                <button
                  type="button"
                  className="thq-button-filled cta-button"
                >
                  <span>
                    {props.action1 ?? (
                        <span>Get Started Today</span>

                    )}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

CTA.defaultProps = {
  heading1: undefined,
  content1: undefined,
  action1: undefined,
}

CTA.propTypes = {
  heading1: PropTypes.element,
  content1: PropTypes.element,
  action1: PropTypes.element,
}

export default CTA
