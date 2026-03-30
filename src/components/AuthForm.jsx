import React, { useState } from 'react';
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
        </>

        <div className="auth-footer">
          <p>© 2025 Feria App • Gestión Premium de Casetas</p>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
