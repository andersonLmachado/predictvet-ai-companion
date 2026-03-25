// src/components/ultrasound/MeasurementField.tsx
import React from 'react';
import { checkReference } from '@/lib/ultrasoundReferences';

interface MeasurementFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  refMin?: number | null;
  refMax?: number | null;
  placeholder?: string;
  disabled?: boolean;
}

const MeasurementField: React.FC<MeasurementFieldProps> = ({
  label,
  value,
  onChange,
  refMin,
  refMax,
  placeholder,
  disabled = false,
}) => {
  const numericValue = parseFloat(value);
  const hasRef = refMin !== undefined && refMin !== null || refMax !== undefined && refMax !== null;
  const status =
    hasRef && !isNaN(numericValue)
      ? checkReference(numericValue, refMin ?? null, refMax ?? null)
      : 'normal';
  const isAbnormal = hasRef && !isNaN(numericValue) && status !== 'normal';

  const refPlaceholder =
    !placeholder && hasRef
      ? refMin != null && refMax != null
        ? `${refMin}–${refMax} cm`
        : refMax != null
          ? `≤ ${refMax} cm`
          : refMin != null
            ? `≥ ${refMin} cm`
            : ''
      : placeholder ?? '';

  return (
    <div className="space-y-1">
      <label
        className="text-xs font-medium"
        style={{ color: 'hsl(222,30%,45%)', fontFamily: 'Nunito Sans, sans-serif' }}
      >
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          type="number"
          step="0.01"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={refPlaceholder}
          disabled={disabled}
          className="w-full rounded-lg border px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 transition-colors"
          style={{
            borderColor: isAbnormal ? 'hsl(38,80%,55%)' : 'hsl(217,50%,85%)',
            background: disabled ? 'hsl(217,50%,97%)' : isAbnormal ? 'hsl(38,88%,97%)' : 'hsl(213,100%,99%)',
            boxShadow: isAbnormal ? '0 0 0 2px hsla(38,80%,55%,0.20)' : 'none',
            fontFamily: 'Nunito Sans, sans-serif',
          }}
        />
        <span
          className="absolute right-3 text-xs select-none"
          style={{ color: 'hsl(222,30%,55%)' }}
        >
          cm
        </span>
      </div>
      {isAbnormal && (
        <p className="text-xs" style={{ color: 'hsl(38,70%,38%)' }}>
          {status === 'alto' ? '↑ Acima do valor de referência' : '↓ Abaixo do valor de referência'}
        </p>
      )}
    </div>
  );
};

export default MeasurementField;
