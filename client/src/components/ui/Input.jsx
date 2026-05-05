/**
 * Sharp Input — 1px border, accent on focus
 */
import { forwardRef } from 'react';
import './ui.css';

const Input = forwardRef(function Input(
  { label, error, icon: Icon, suffix, type = 'text', id, className = '', ...props },
  ref
) {
  return (
    <div className={`input-group ${error ? 'input-group--error' : ''} ${className}`}>
      {label && (
        <label htmlFor={id} className="input-label">
          {label}
        </label>
      )}
      <div className="input-wrapper">
        {Icon && (
          <span className="input-icon">
            <Icon size={18} />
          </span>
        )}
        <input
          ref={ref}
          id={id}
          type={type}
          className={`input ${Icon ? 'input--with-icon' : ''} ${suffix ? 'input--with-suffix' : ''}`}
          {...props}
        />
        {suffix && (
          <span className="input-suffix">
            {suffix}
          </span>
        )}
      </div>
      {error && <span className="input-error">{error}</span>}
    </div>
  );
});

export default Input;
