import React from 'react'

import PropTypes from 'prop-types'

import './contact.css'

const Contact = (props) => {
  return (
    <div id={props.id} className="contact-container1 thq-section-padding">
      <div className="contact-max-width thq-section-max-width">
        <div className="contact-content1 thq-flex-row">
          <div className="contact-content2">
            <h2 className="thq-heading-2">
              {props.heading1 ?? (
                  <span>Contact Us</span>
              )}
            </h2>
            <p className="thq-body-large">
              {props.content1 ?? (
                  <span>
                    Have a question or need support? Feel free to reach out to
                    us.
                  </span>
              )}
            </p>
          </div>
        </div>
        
        <div className="contact-content3 thq-flex-row">
          <div className="contact-container2">
            <img
              alt={props.location1ImageAlt}
              src={props.location1ImageSrc}
              className="contact-image1 thq-img-ratio-16-9"
            />
            <h3 className="contact-text12 thq-heading-3">
              {props.location1 ?? (
                  <span>
                    123 Smart Scheduling Street, City, Country
                  </span>
              )}
            </h3>
            <p className="thq-body-large">
              {props.location1Description ?? (
                  <span>
                    Visit our office for in-person assistance.
                  </span>
              )}
            </p>
            <div className="contact-container3">
              <a
                href="https://example.com"
                target="_blank"
                rel="noreferrer noopener"
                className="thq-button-flat thq-body-small"
              >
                Get directions
              </a>
            </div>
          </div>
          <div className="contact-container4">
            <img
              alt={props.location2ImageAlt}
              src={props.location2ImageSrc}
              className="contact-image2 thq-img-ratio-16-9"
            />
            <h3 className="contact-text14 thq-heading-3">
              {props.location2 ?? (
                  <span>
                    support@smartscheduling.com
                  </span>
              )}
            </h3>
            <p className="thq-body-large">
              {props.location2Description ?? (
                  <span>
                    Send us an email for any inquiries or assistance.
                  </span>
              )}
            </p>
            <div className="contact-container5">
              <a
                href="https://example.com"
                target="_blank"
                rel="noreferrer noopener"
                className="thq-button-flat thq-body-small"
              >
                Get directions
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

Contact.defaultProps = {
  content1: undefined,
  location2ImageSrc:
    'https://images.unsplash.com/photo-1650735310415-392ab5378954?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTc0MjQwNTc0Nnw&ixlib=rb-4.0.3&q=80&w=1080',
  location1ImageSrc:
    'https://images.unsplash.com/photo-1584428177364-f5a2a0a3a9c6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w5MTMyMXwwfDF8cmFuZG9tfHx8fHx8fHx8MTc0MjQwNTc0N3w&ixlib=rb-4.0.3&q=80&w=1080',
  location1Description: undefined,
  location2ImageAlt: 'Email Support',
  heading1: undefined,
  location2Description: undefined,
  location1ImageAlt: 'Office Location',
  location1: undefined,
  location2: undefined,
}

Contact.propTypes = {
  content1: PropTypes.element,
  location2ImageSrc: PropTypes.string,
  location1ImageSrc: PropTypes.string,
  location1Description: PropTypes.element,
  location2ImageAlt: PropTypes.string,
  heading1: PropTypes.element,
  location2Description: PropTypes.element,
  location1ImageAlt: PropTypes.string,
  location1: PropTypes.element,
  location2: PropTypes.element,
}

export default Contact
