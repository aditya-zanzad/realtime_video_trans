import React, { useRef, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import { APP_ID, SERVER_SECRET } from '../components/Constant';
import io from 'socket.io-client';
import './Videopage.css';

const socket = io.connect('http://localhost:5000'); // Update if hosted elsewhere

const languageOptions = [
  { code: 'ar', label: 'Arabic', flag: '🇸🇦' },
  { code: 'az', label: 'Azerbaijani', flag: '🇦🇿' },
  { code: 'bn', label: 'Bengali', flag: '🇧🇩' },
  { code: 'cs', label: 'Czech', flag: '🇨🇿' },
  { code: 'da', label: 'Danish', flag: '🇩🇰' },
  { code: 'de', label: 'German', flag: '🇩🇪' },
  { code: 'el', label: 'Greek', flag: '🇬🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Spanish', flag: '🇪🇸' },
  { code: 'fa', label: 'Persian', flag: '🇮🇷' },
  { code: 'fi', label: 'Finnish', flag: '🇫🇮' },
  { code: 'fr', label: 'French', flag: '🇫🇷' },
  { code: 'ga', label: 'Irish', flag: '🇮🇪' },
  { code: 'he', label: 'Hebrew', flag: '🇮🇱' },
  { code: 'hi', label: 'Hindi', flag: '🇮🇳' },
  { code: 'hu', label: 'Hungarian', flag: '🇭🇺' },
  { code: 'id', label: 'Indonesian', flag: '🇮🇩' },
  { code: 'it', label: 'Italian', flag: '🇮🇹' },
  { code: 'ja', label: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', label: 'Korean', flag: '🇰🇷' },
  { code: 'mr', label: 'Marathi', flag: '🇮🇳' },
  { code: 'nl', label: 'Dutch', flag: '🇳🇱' },
  { code: 'no', label: 'Norwegian', flag: '🇳🇴' },
  { code: 'pl', label: 'Polish', flag: '🇵🇱' },
  { code: 'pt', label: 'Portuguese', flag: '🇵🇹' },
  { code: 'ro', label: 'Romanian', flag: '🇷🇴' },
  { code: 'ru', label: 'Russian', flag: '🇷🇺' },
  { code: 'sk', label: 'Slovak', flag: '🇸🇰' },
  { code: 'sv', label: 'Swedish', flag: '🇸🇪' },
  { code: 'ta', label: 'Tamil', flag: '🇮🇳' },
  { code: 'te', label: 'Telugu', flag: '🇮🇳' },
  { code: 'th', label: 'Thai', flag: '🇹🇭' },
  { code: 'tl', label: 'Filipino', flag: '🇵🇭' },
  { code: 'tr', label: 'Turkish', flag: '🇹🇷' },
  { code: 'uk', label: 'Ukrainian', flag: '🇺🇦' },
  { code: 'vi', label: 'Vietnamese', flag: '🇻🇳' },
  { code: 'zh', label: 'Chinese', flag: '🇨🇳' },
];

const Videopage = () => {
  const { id } = useParams();
  const roomID = id;
  const meetingRef = useRef(null);
  const recognitionRef = useRef(null);
  const [transcript, setTranscript] = useState('');
  const [receivedTranscript, setReceivedTranscript] = useState('');
  const [originalReceivedText, setOriginalReceivedText] = useState('');
  const [senderLanguage, setSenderLanguage] = useState('en');
  const [receiverLanguage, setReceiverLanguage] = useState('hi');
  const [translatedText, setTranslatedText] = useState('');
  const [micOn, setMicOn] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isPaused, setIsPaused] = useState(false); // New state for pause/resume
  let isRecognitionRunning = false;

  useEffect(() => {
    let zp = null;

    const initMeeting = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          APP_ID,
          SERVER_SECRET,
          roomID,
          Date.now().toString(),
          'Your Name'
        );

        zp = ZegoUIKitPrebuilt.create(kitToken);

        zp.joinRoom({
          container: meetingRef.current,
          sharedLinks: [
            {
              name: 'Personal link',
              url: `${window.location.protocol}//${window.location.host}${window.location.pathname}?roomID=${roomID}`,
            },
          ],
          scenario: {
            mode: ZegoUIKitPrebuilt.VideoConference,
          },
          onUserJoin: (user) => {
            setParticipants((prev) => [...prev, user]);
          },
          onUserLeave: (user) => {
            setParticipants((prev) => prev.filter((u) => u.userID !== user.userID));
          },
        });
      } catch (error) {
        console.error('Device access or joinRoom error:', error);
        alert('Please ensure a microphone and camera are connected and permissions are granted.');
      }
    };

    initMeeting();
    socket.emit('joinRoom', roomID);

    socket.on('receiveTranscript', async (data) => {
      console.log('Received transcript:', data.transcript, 'in language:', data.senderLanguage);
      setOriginalReceivedText(data.transcript);
      setReceivedTranscript(data.transcript);

      if (data.transcript.trim() && data.senderLanguage !== receiverLanguage) {
        setIsTranslating(true);
        const translated = await translateText(data.transcript, data.senderLanguage, receiverLanguage);
        console.log('Translated to', receiverLanguage, ':', translated);
        setTranslatedText(translated);
        setIsTranslating(false);
      } else {
        setTranslatedText(data.transcript);
      }
    });

    return () => {
      if (zp) {
        zp.destroy();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        isRecognitionRunning = false;
      }
      socket.off('receiveTranscript');
      socket.emit('leaveRoom', roomID);
    };
  }, [roomID, receiverLanguage]);

  const startRecognition = () => {
    if (isRecognitionRunning || isPaused) {
      console.log('Recognition already running or paused, skipping start.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('SpeechRecognition API not supported in this browser.');
      setTranscript('Speech recognition not supported. Please type your message.');
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = senderLanguage.toLowerCase() || 'en';

    recognitionRef.current.onstart = () => {
      isRecognitionRunning = true;
      console.log(`Starting speech recognition with lang: ${recognitionRef.current.lang}`);
    };

    recognitionRef.current.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript.trim()) {
        console.log('Captured transcript:', finalTranscript.trim());
        setTranscript(finalTranscript.trim());
        socket.emit('sendTranscript', {
          roomID,
          transcript: finalTranscript.trim(),
          senderLanguage,
        });
        setIsPaused(false); // Resume if paused
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      isRecognitionRunning = false;

      if (event.error === 'no-speech') {
        console.log('No speech detected, pausing recognition temporarily.');
        setIsPaused(true);
        setTimeout(() => {
          if (micOn && !isPaused) {
            console.log('Resuming recognition after no-speech pause.');
            startRecognition();
          }
        }, 3000); // Wait 3 seconds before resuming
      } else if (['aborted', 'audio-capture'].includes(event.error)) {
        console.warn('Recognition aborted or audio capture issue, retrying if mic is on.');
        if (micOn) {
          setTimeout(() => startRecognition(), 1000);
        }
      } else {
        console.warn('Falling back to English for speech recognition');
        recognitionRef.current.lang = 'en';
        if (micOn) {
          setTimeout(() => startRecognition(), 1000);
        }
      }
    };

    recognitionRef.current.onend = () => {
      console.log('Speech recognition ended');
      isRecognitionRunning = false;
      if (micOn && !isPaused) {
        console.log('Restarting recognition as mic is still on.');
        setTimeout(() => startRecognition(), 1000);
      }
    };

    try {
      recognitionRef.current.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
      isRecognitionRunning = false;
    }
  };

  const handleSenderLanguageChange = (event) => {
    const newLang = event.target.value;
    setSenderLanguage(newLang);

    if (recognitionRef.current && isRecognitionRunning) {
      console.log('Updating recognition language to:', newLang);
      recognitionRef.current.stop();
      isRecognitionRunning = false;
      if (micOn) {
        setTimeout(() => startRecognition(), 500); // Small delay for smooth transition
      }
    }
  };

  const handleReceiverLanguageChange = (event) => {
    setReceiverLanguage(event.target.value);
  };

  const handleMicToggle = () => {
    setMicOn((prev) => {
      const newMicState = !prev;
      if (!newMicState && recognitionRef.current) {
        recognitionRef.current.stop();
        isRecognitionRunning = false;
        setIsPaused(false); // Reset pause state
      } else if (newMicState) {
        setIsPaused(false); // Resume if paused
        startRecognition();
      }
      return newMicState;
    });
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const translateText = async (text, sourceLang, targetLang) => {
    if (!text.trim() || sourceLang === targetLang) {
      console.log('No translation needed:', { text, sourceLang, targetLang });
      return text;
    }

    const endpoints = [
      'https://libretranslate.com/translate',
      'https://translate.fedilab.app/translate',
    ];

    for (const endpoint of endpoints) {
      try {
        console.log('Translating:', { text, sourceLang, targetLang, endpoint });
        const response = await fetch(endpoint, {
          method: 'POST',
          body: JSON.stringify({
            q: text,
            source: sourceLang.toLowerCase(),
            target: targetLang.toLowerCase(),
            format: 'text',
          }),
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        if (data.translatedText) {
          return data.translatedText;
        }
        console.warn('No translatedText in response:', data);
        continue;
      } catch (error) {
        console.error(`Translation error at ${endpoint}:`, error);
        continue;
      }
    }

    console.error('All translation endpoints failed, returning original text');
    return text;
  };

  return (
    <div className="videopage-container">
      <div className="video-controls">
        <button className="control-button" onClick={toggleSidebar} aria-label="Toggle sidebar">
          {isSidebarOpen ? '◀' : '☰'}
        </button>
        <div className="participant-count">👥 {participants.length + 1} participants</div>
      </div>

      <div className="main-content">
        <div ref={meetingRef} className="video-container"></div>

        <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <h3>Meeting Tools</h3>
            <button className="control-button" onClick={toggleSidebar} aria-label="Close sidebar">
              ✕
            </button>
          </div>
          <div className="divider"></div>

          <div className="language-selectors">
            <div className="language-selector">
              <label>Your Speaking Language</label>
              <div className="select-wrapper">
                <select
                  value={senderLanguage}
                  onChange={handleSenderLanguageChange}
                  className="language-dropdown"
                >
                  {languageOptions.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.label}
                    </option>
                  ))}
                </select>
                <div className="select-arrow">▼</div>
              </div>
            </div>

            <div className="language-selector">
              <label>Your Preferred Language</label>
              <div className="select-wrapper">
                <select
                  value={receiverLanguage}
                  onChange={handleReceiverLanguageChange}
                  className="language-dropdown"
                >
                  {languageOptions.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.label}
                    </option>
                  ))}
                </select>
                <div className="select-arrow">▼</div>
              </div>
            </div>
          </div>

          <div className="mic-toggle">
            <label>Microphone</label>
            <div className="toggle-container">
              <label className="switch">
                <input type="checkbox" checked={micOn} onChange={handleMicToggle} />
                <span className="slider"></span>
              </label>
              <span className="toggle-label">{micOn ? 'ON' : 'OFF'}</span>
            </div>
          </div>

          <div className="transcript-section">
            <h4>Your Speech</h4>
            <div className="transcript-box">
              <p className="transcript-text">{transcript || 'Speak to see your transcript here...'}</p>
            </div>
          </div>

          <div className="translation-section">
            <h4>Received Messages</h4>
            <div className="message-box">
              {isTranslating ? (
                <div className="translating-indicator">
                  <div className="spinner"></div>
                  <span>Translating...</span>
                </div>
              ) : (
                <>
                  {originalReceivedText && (
                    <div className="original-message">
                      <p className="message-label">
                        Original (
                        {languageOptions.find((l) => l.code === senderLanguage)?.label || 'Unknown'}
                        ):
                      </p>
                      <p className="message-text">{originalReceivedText}</p>
                    </div>
                  )}
                  {translatedText && (
                    <div className="translated-message">
                      <p className="message-label">
                        Translated to{' '}
                        {languageOptions.find((l) => l.code === receiverLanguage)?.label}:
                      </p>
                      <p className="message-text">{translatedText}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Videopage;