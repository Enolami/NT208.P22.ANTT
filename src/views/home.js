import React from 'react'

import { Helmet } from 'react-helmet'

import Navbar from '../components/navbar'
import Hero from '../components/hero'
import Features1 from '../components/features1'
import CTA from '../components/cta'
import Features2 from '../components/features2'
import Pricing from '../components/pricing'
import Steps2 from '../components/steps2'
import Testimonial from '../components/testimonial'
import Contact from '../components/contact'
import Footer from '../components/footer'
import './home.css'

const Home = (props) => {
  return (
    <div className="home-container">
      <Helmet>
        <title>SmartSchedule</title>
        <meta property="og:title" content="SmartSchedule" />
      </Helmet>

      <Navbar>
        <div className="navbar-action">
          <span>Sign Up</span>
          <span>Learn More</span>
        </div>
        <div className="navbar-pages">
          <div className="navbar-page">
            <span className="page-title">Home</span>
            <a href = "#home" className="page-link">#home</a>
            <span className="page-description">
              Learn more about our smart scheduling system
            </span>
          </div>
          <div className="navbar-page">
            <span className="page-title">Features</span>
            <a href = "#features" className="page-link">#features</a>
            <span className="page-description">
              Explore the powerful features of our scheduling tool
            </span>
          </div>
          <div className="navbar-page">
            <span className="page-title">Integration</span>
            <a href = "#integration" className="page-link">#integration</a>
            <span className="page-description">
              Discover how to sync with Google calendar and Outlook
            </span>
          </div>
          <div className="navbar-page">
            <span className="page-title">Contact</span>
            <a href = "#contact" className="page-link">#contact</a>
            <span className="page-description">
              Get in touch with us for any inquiries or support
            </span>
          </div>
        </div>
      </Navbar>

      <Hero id="home">
        <div className="hero-action">
          <button>Main action</button>
          <button>Secondary action</button>
        </div>
        <h1>Medium length hero headline goes here</h1>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse varius enim in eros elementum tristique. Duis cursus, mi quis viverra ornare, eros dolor interdum nulla, ut commodo diam libero vitae erat.
        </p>
      </Hero>

      <Features1 id="features">
        <div className="feature">
          <h3>Task Integration</h3>
          <p>Easily integrate personal todo lists with the scheduling system.</p>
        </div>

        <div className="feature">
          <h3>Real-time AI Technology</h3>
          <p>Utilize real-time AI technology to optimize your timetable and task management.</p>
        </div>

        <div className="feature">
          <h3>Calendar Sync</h3>
          <p>Sync seamlessly with Google calendar and Outlook for efficient planning.</p>
        </div>
      </Features1>

      <CTA>
        <h2>Boost Your Productivity with Our Smart Scheduling System</h2>
        <p>
          Take control of your time and stay organized with our intelligent timetable system that seamlessly integrates with your daily tasks.
        </p>
        <button>Get Started Today</button>
      </CTA>

      <Features2>
        <div className="feature">
          <span className="feature-title">Task and Event Integration</span>
          <span className="feature-description">
            Easily add tasks and events to your timetable, syncing seamlessly with Google calendar and Outlook.
          </span>
        </div>
        <div className="feature">
          <span className="feature-title">Real-time AI Technology</span>
          <span className="feature-description">
            Utilize real-time AI technology to optimize your schedule and receive intelligent reminders for due tasks.
          </span>
        </div>
        <div className="feature">
          <span className="feature-title">Personal Todo List Integration</span>
          <span className="feature-description">
            Integrate your personal todo lists with the scheduling system for a comprehensive overview of your commitments.
          </span>
        </div>
      </Features2>
      
      <Pricing id="price">
        <div className="plan">
          <h2>Basic Plan</h2>
          <p>$9.99/month</p>
          <ul>
            <li>Sync with Google Calendar</li>
            <li>Receive Task Reminders</li>
            <li>Feature text goes here</li>
          </ul>
          <button>Sign Up Now</button>
          <p>or $99.99/year</p>
          <button>Get Started</button>
        </div>

        <div className="plan">
          <h2>Business Plan</h2>
          <p>$19.99/month</p>
          <ul>
            <li>All Plan 1 Features</li>
            <li>Real-time AI Technology</li>
            <li>Integration with Outlook</li>
            <li>Feature text goes here</li>
          </ul>
          <button>Get Started</button>
          <p>or $299/yr</p>
          <button>Get Started</button>
        </div>

        <div className="plan">
          <h2>Enterprise Plan</h2>
          <p>$29.99/month</p>
          <ul>
            <li>All Plan 2 Features</li>
            <li>Priority Customer Support</li>
            <li>Customizable Themes</li>
            <li>Feature text goes here</li>
          </ul>
          <button>Upgrade Now</button>
          <p>or $499/yr</p>
          <button>Get Started</button>
        </div>

        <div className="content">
          <h3>Pricing Plan</h3>
          <p>Choose the perfect plan for you</p>
        </div>
      </Pricing>

      <Steps2>
        <div className="step">
          <h3>Step 1: Sign Up</h3>
          <p>Create an account on our platform to start using the smart scheduling system.</p>
        </div>

        <div className="step">
          <h3>Step 2: Add Tasks and Events</h3>
          <p>Input your tasks, events, and to-do lists into the system for easy organization.</p>
        </div>

        <div className="step">
          <h3>Step 3: Sync with Calendars</h3>
          <p>Sync your schedule with Google calendar and Outlook for seamless integration.</p>
        </div>

        <div className="step">
          <h3>Step 4: Receive Reminders</h3>
          <p>Get real-time reminders for upcoming tasks and events to stay on top of your schedule.</p>
        </div>
      </Steps2>

      <Testimonial>
        <div className="testimonial">
          <h3>John Doe</h3>
          <p>CEO, Company ABC</p>
          <p>5 stars - Excellent product with great features!</p>
        </div>

        <div className="testimonial">
          <h3>Jane Smith</h3>
          <p>Marketing Manager, XYZ Inc.</p>
          <p>Highly recommend this scheduling system! It has increased our productivity and efficiency tenfold.</p>
        </div>

        <div className="testimonial">
          <h3>David Johnson</h3>
          <p>Freelancer</p>
          <p>This scheduling system has revolutionized the way our team manages tasks and events. The integration with personal todo lists and real-time AI technology is truly impressive.</p>
        </div>

        <div className="testimonial">
          <h3>Sarah Lee</h3>
          <p>Student</p>
          <p>As a student juggling multiple responsibilities, this scheduling system has been a game-changer for me. I can’t imagine my life without it now.</p>
        </div>

        <h2>Testimonials</h2>
      </Testimonial>

      <Contact id="contact">
        <div className="contact-info">
          <h2>Contact Us</h2>
          <p>Have a question or need support? Feel free to reach out to us.</p>
        </div>

        <div className="location">
          <h3>Our Office</h3>
          <p>Visit our office for in-person assistance.</p>
          <p>123 Smart Scheduling Street, City, Country</p>
        </div>

        <div className="email">
          <h3>Email Us</h3>
          <p>Send us an email for any inquiries or assistance.</p>
          <p>support@smartscheduling.com</p>
        </div>
      </Contact>

      <Footer>
        <div className="footer-links">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#contact">Contact Us</a>
        </div>

        <div className="footer-links">
          <a href="#faq">FAQ</a>
          <a href="#terms">Terms of Service</a>
          <a href="#cookies">Cookies Policy</a>
          <a href="#privacy">Privacy Policy</a>
        </div>
      </Footer>

    </div>
  )
}

export default Home
