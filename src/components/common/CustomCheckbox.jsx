import React from 'react';

const CustomCheckbox = ({ id, checked, onChange, label, disabled }) => {
  return (
    <div className="checkbox-wrapper-premium">
      <div className="checkbox-outer">
        <input 
          type="checkbox" 
          id={id} 
          checked={checked} 
          onChange={onChange} 
          disabled={disabled}
        />
        <svg className="cb-svg" fill="none" viewBox="0 0 16 16">
          <path d="M4 8.5L7 11.5L12 4.5" />
        </svg>
      </div>
      {label && <label htmlFor={id} style={{fontSize: '0.9rem', color: 'var(--text-primary)', cursor: 'pointer'}}>{label}</label>}
      
      {/* Visual filter for the 'splash' effect - only needs to render once in the DOM really, but safe here */}
      <svg style={{position: 'absolute', width: 0, height: 0}}>
        <defs>
          <filter id="goo-premium">
            <feGaussianBlur result="blur" stdDeviation={4} in="SourceGraphic" />
            <feColorMatrix result="goo-premium" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -7" mode="matrix" in="blur" />
            <feBlend in2="goo-premium" in="SourceGraphic" />
          </filter>
        </defs>
      </svg>
    </div>
  );
};

export default CustomCheckbox;
