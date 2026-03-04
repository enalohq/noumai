"use client";

import React from "react";

// Field Props Interface (Interface Segregation)
export interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string | null;
  helpText?: string;
  className?: string;
  type?: string;
}

// Required Field Component (Single Responsibility)
export const RequiredField: React.FC<FieldProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  helpText,
  className = "",
  type = "text"
}) => {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-th-text">
        {label} <span className="text-th-danger">*</span>
        <span className="ml-1 text-xs font-normal text-th-text-muted">(required)</span>
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`bd-input w-full rounded-lg p-2.5 text-sm ${error ? "border-th-danger focus:ring-th-danger" : ""} ${className}`}
        placeholder={placeholder}
        required
      />
      {error && (
        <p className="mt-1 text-xs text-th-danger">{error}</p>
      )}
      {helpText && !error && (
        <p className="mt-1 text-xs text-th-text-muted">{helpText}</p>
      )}
    </div>
  );
};

// Optional Field Component (Single Responsibility)
export const OptionalField: React.FC<FieldProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  helpText,
  className = "",
  type = "text"
}) => {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-th-text">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`bd-input w-full rounded-lg p-2.5 text-sm ${className}`}
        placeholder={placeholder}
      />
      {helpText && (
        <p className="mt-1 text-xs text-th-text-muted">{helpText}</p>
      )}
    </div>
  );
};

// Twitter Handle Field with @ prefix
export const TwitterField: React.FC<Omit<FieldProps, 'type'>> = ({
  id,
  label,
  value,
  onChange,
  placeholder = "username",
  helpText,
  error
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Remove @ symbol if user types it, we'll add it visually
    const newValue = e.target.value.replace(/^@/, '');
    onChange(newValue);
  };

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-th-text">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-th-text">@</span>
        <input
          id={id}
          type="text"
          value={value}
          onChange={handleChange}
          className="bd-input w-full rounded-lg py-2.5 pl-7 pr-2.5 text-sm"
          placeholder={placeholder}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-th-danger">{error}</p>
      )}
      {helpText && !error && (
        <p className="mt-1 text-xs text-th-text-muted">{helpText}</p>
      )}
      {value && !/^[a-z0-9_]{1,15}$/.test(value) && (
        <p className="mt-1 text-xs text-amber-600">
          Twitter handles can only contain letters, numbers, and underscores (1-15 characters)
        </p>
      )}
    </div>
  );
};

// Help Text with Tooltip Component
export const HelpTextWithTooltip: React.FC<{
  text: string;
  tooltip: string;
}> = ({ text, tooltip }) => {
  const [showTooltip, setShowTooltip] = React.useState(false);

  return (
    <div className="relative inline-block">
      <span className="text-xs text-th-text-muted">{text}</span>
      <button
        type="button"
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-th-border text-xs text-th-text-muted hover:bg-th-border-dark"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        aria-label="More information"
      >
        ?
      </button>
      {showTooltip && (
        <div className="absolute left-0 top-full z-10 mt-1 w-64 rounded-lg border border-th-border bg-th-card p-3 text-xs text-th-text shadow-lg">
          {tooltip}
        </div>
      )}
    </div>
  );
};

// Loading State Component
export const LoadingState: React.FC<{
  isLoading: boolean;
  message?: string;
}> = ({ isLoading, message = "Fetching website data..." }) => {
  if (!isLoading) return null;
  
  return (
    <div className="flex items-center gap-2 text-sm text-th-accent">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-th-accent border-t-transparent" />
      <span>{message}</span>
    </div>
  );
};

// Success State Component
export const SuccessState: React.FC<{
  show: boolean;
  message: string;
}> = ({ show, message }) => {
  if (!show) return null;
  
  return (
    <div className="flex items-center gap-2 text-sm text-green-600 animate-fadeIn">
      <svg 
        className="h-4 w-4 animate-checkmark" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      <span>{message}</span>
    </div>
  );
};

// Collapsible Section Component
export const CollapsibleSection: React.FC<{
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}> = ({ title, defaultOpen = false, children }) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  return (
    <details 
      className="mt-4 rounded-lg border border-th-border bg-th-card/50"
      open={isOpen}
      onToggle={(e) => setIsOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-th-text hover:bg-th-card">
        {title}
        <span className="float-right transform transition-transform">
          {isOpen ? "▲" : "▼"}
        </span>
      </summary>
      <div className="px-4 pb-4 pt-2">
        {children}
      </div>
    </details>
  );
};
// Error Message Component
export const ErrorMessage: React.FC<{
  message: string;
}> = ({ message }) => {
  return (
    <div className="flex items-center gap-2 text-sm text-th-danger animate-fadeIn">
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{message}</span>
    </div>
  );
};