import React, { useState, useEffect } from 'react';
import './AuthForm.css';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';
import { auth, googleProvider, appleProvider } from '../firebase';
import { boothService } from '../services/boothService';

const AuthForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [showAppleGuide, setShowAppleGuide] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent;
    const isIosDevice = /iPhone|iPad|iPod/i.test(ua);
    setIsIOS(isIosDevice);
  }, []);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    try {
      let userCredential;
      if (isRegister) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // Sync initial profile
        await boothService.syncUserProfile(userCredential.user);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSocialAuth = async (provider) => {
    try {
      const result = await signInWithPopup(auth, provider);
      await boothService.syncUserProfile(result.user);
    } catch (error) {
      alert(error.message);
    }
  };

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible'
      });
    }
  };

  const handlePhoneSignIn = async (e) => {
    e.preventDefault();
    setupRecaptcha();
    const appVerifier = window.recaptchaVerifier;
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, phone, appVerifier);
      setVerificationId(confirmationResult);
      alert('Código OTP enviado a tu teléfono.');
    } catch (error) {
      alert(error.message);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    try {
      const result = await verificationId.confirm(otp);
      await boothService.syncUserProfile(result.user);
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="auth-container fade-in">
      <div className="auth-card glass-panel">
        <div className="auth-header">
          <img src="/app_icon.png" alt="Logo" style={{width: '64px', height: '64px', borderRadius: '50%', marginBottom: '1rem', border: '2px solid var(--color-gold)', objectFit: 'cover'}} />
          <h2 className="premium-title">
            {isRegister ? 'Crea tu Cuenta' : 'Bienvenido al Real'}
          </h2>
          <p className="auth-subtitle">
            {isRegister ? 'Únete a la feria y solicita tu entrada.' : 'Accede para gestionar tu caseta.'}
          </p>
        </div>

        <div className="auth-tabs">
          <button 
            className={`auth-tab ${!isRegister ? 'active' : ''}`}
            onClick={() => setIsRegister(false)}
          >
            Login
          </button>
          <button 
            className={`auth-tab ${isRegister ? 'active' : ''}`}
            onClick={() => setIsRegister(true)}
          >
            Registro
          </button>
        </div>

        <>
          <form className="auth-form" onSubmit={handleEmailAuth}>
            <div className="form-group">
              <label>Correo Electrónico</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="tu@email.com"
                required 
              />
            </div>
            <div className="form-group">
              <label>Contraseña</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••"
                required 
              />
            </div>
            <button type="submit" className="auth-submit shimmer">
              {isRegister ? 'Crear Cuenta' : 'Entrar al Real'}
            </button>
          </form>

          <div className="auth-divider"><span>O continúa con</span></div>

          <div className="social-buttons">
            <button className="social-btn" onClick={() => handleSocialAuth(googleProvider)}>
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="social-btn-icon" />
              <span>Google</span>
            </button>
            <button className="social-btn" onClick={() => handleSocialAuth(appleProvider)}>
              <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" alt="A" className="social-btn-icon filter-white" />
              <span>Apple ID</span>
            </button>
          </div>
          <div className="auth-app-download">
             <div className="auth-divider"><span>Acceso Total</span></div>
             <div className="download-grid">
               <a 
                 href="https://drive.google.com/file/d/1C4zFjgMjmbwEJTxDnmgHSXYcXIyhJOxs/view?usp=sharing" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="app-download-btn android-btn pulse-glow"
               >
                  <span className="btn-icon">🤖</span>
                  <div className="btn-text">
                    <span className="small">Descarga Directa</span>
                    <span className="bold">Android App</span>
                  </div>
               </a>

               <button 
                 className={`app-download-btn apple-btn ${isIOS ? 'highlight' : ''}`}
                 onClick={() => setShowAppleGuide(true)}
               >
                  <svg className="premium-apple-icon-svg" viewBox="0 0 384 512" width="24" height="24">
                    <path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                  </svg>
                  <div className="btn-text">
                    <span className="small">Instalar en Home</span>
                    <span className="bold">PWA for Apple</span>
                  </div>
               </button>
             </div>
          </div>
        </>

        {showAppleGuide && (
          <div className="install-guide-overlay fade-in" onClick={() => setShowAppleGuide(false)}>
            <div className="install-guide-modal glass-panel" onClick={e => e.stopPropagation()}>
              <button className="close-guide" onClick={() => setShowAppleGuide(false)}>×</button>
              <div className="guide-header">
                <svg className="premium-apple-icon-svg lg" viewBox="0 0 384 512" width="64" height="64">
                    <path fill="currentColor" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                </svg>
                <h3>Instalar en tu iPhone</h3>
              </div>
              <div className="guide-steps">
                <div className="step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <p>Pulsa el botón de <strong>Compartir</strong> en Safari.</p>
                    <img src="/ios-share-icon.png" alt="Safari Share" className="safari-icon" />
                  </div>
                </div>
                <div className="step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <p>Busca en el menú la opción <strong>"Añadir a la pantalla de inicio"</strong>.</p>
                    <div className="step-preview">
                       <img src="/app_icon.png" alt="Preview" className="preview-icon" />
                       <span className="preview-text">Añadir a la pantalla de inicio</span>
                    </div>
                  </div>
                </div>
                <div className="step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <p>Pulsa <strong>Añadir</strong> en la esquina superior derecha.</p>
                  </div>
                </div>
              </div>
              <p className="guide-footer text-gold">¡Ya puedes disfrutar de Mi Caseta como una app nativa!</p>
            </div>
          </div>
        )}

        <div className="auth-footer">
          <p>© 2025 Feria App • Gestión Premium de Casetas</p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
