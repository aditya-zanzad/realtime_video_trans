import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCode } from 'react-qrcode-logo';
import './Homepage.css';

const Homepage = () => {
  const [input, setInput] = useState('');
  const [meetingId, setMeetingId] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);
  const [directLink, setDirectLink] = useState('');
  const navigate = useNavigate();

  const generateRandomId = () => {
    return Math.random().toString(36).substr(2, 9);
  };

  const createMeeting = () => {
    if (!input.trim()) {
      alert('Please enter your name to create a meeting');
      return;
    }
    const randomId = generateRandomId();
    setMeetingId(randomId);
    setShowQRCode(true);
  };

  const joinDirectMeeting = () => {
    if (directLink.trim()) {
      navigate(`/room/${directLink}`);
    } else {
      alert('Please enter a valid meeting link');
    }
  };

  const joinMeeting = () => {
    if (input.trim()) {
      navigate(`/room/${meetingId}`);
    } else {
      alert('Please enter a valid name');
    }
  };

  return (
    <div className="homepage-container">
      <div className="columns-container">
        {/* Create Meeting Section */}
        <div className="meeting-column create-column">
          <div className="card">
            <div className="card-header">
              <h2>Host a Meeting</h2>
              <div className="decorative-line"></div>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label htmlFor="name">Your Name</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="input-field"
                />
              </div>
              <button onClick={createMeeting} className="primary-button">
                Create New Meeting
              </button>

              {showQRCode && (
                <div className="qr-section">
                  <div className="success-message">
                    <svg className="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Meeting created successfully!
                  </div>
                  <div className="qr-code-container">
                    <QRCode
                      value={`https://realtime-video-trans.vercel.app/room/${meetingId}`}
                      size={200}
                      fgColor="#ffffff"
                      eyeRadius={5}
                      qrStyle="dots"
                      ecLevel="H"
                      bgColor="transparent"
                    />
                  </div>
                  <div className="meeting-info">
                    <p>
                      Meeting ID: <span className="meeting-id">{meetingId}</span>
                    </p>
                    <button onClick={joinMeeting} className="secondary-button">
                      Join Now
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Join Meeting Section */}
        <div className="meeting-column join-column">
          <div className="card">
            <div className="card-header">
              <h2>Join a Meeting</h2>
              <div className="decorative-line"></div>
            </div>
            <div className="card-body">
              <div className="form-group">
                <label htmlFor="link">Meeting Link or ID</label>
                <input
                  id="link"
                  type="text"
                  placeholder="Paste meeting link or enter ID"
                  value={directLink}
                  onChange={(e) => setDirectLink(e.target.value)}
                  className="input-field"
                />
              </div>
              <button onClick={joinDirectMeeting} className="primary-button">
                Join Meeting
              </button>
              <div className="divider">
                <span>OR</span>
              </div>
              <button className="google-button">
                Continue with Google
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="features-section">
        <div className="feature">
          <h3>Secure</h3>
          <p>End-to-end encryption for all your meetings</p>
        </div>
        <div className="feature">
          <h3>High Quality</h3>
          <p>4K video and studio-quality audio</p>
        </div>
        <div className="feature">
          <h3>Global</h3>
          <p>Connect with anyone around the world</p>
        </div>
      </div>
    </div>
  );
};

export default Homepage;
