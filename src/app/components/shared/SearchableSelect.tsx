'use client';

import { Autocomplete, SxProps, TextField, Theme } from '@mui/material';
import { useMemo } from 'react';

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  label: string;
  value: string;
  options: SearchableSelectOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Value used when the field is cleared. Defaults to `''` (All). */
  allValue?: string;
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  /** When false, the clear button is hidden. */
  clearable?: boolean;
  sx?: SxProps<Theme>;
}

export function withAllOption(
  allLabel: string,
  values: readonly (string | undefined | null)[] | undefined,
): SearchableSelectOption[] {
  return [
    { value: '', label: allLabel },
    ...(values ?? [])
      .filter((value): value is string => Boolean(value))
      .map((value) => ({ value, label: value })),
  ];
}

const SearchableSelect = ({
  label,
  value,
  options,
  onChange,
  disabled = false,
  allValue = '',
  size = 'small',
  fullWidth = true,
  clearable = true,
  sx,
}: SearchableSelectProps) => {
  const selected = useMemo(
    () =>
      options.find((option) => option.value === value)
      ?? options.find((option) => option.value === allValue)
      ?? options[0]
      ?? { value: allValue, label: 'All' },
    [options, value, allValue],
  );

  return (
    <Autocomplete
      size={size}
      fullWidth={fullWidth}
      disabled={disabled}
      options={options}
      value={selected}
      onChange={(_, option) => onChange(option?.value ?? allValue)}
      getOptionLabel={(option) => option.label}
      isOptionEqualToValue={(a, b) => a.value === b.value}
      autoHighlight
      clearOnEscape
      disableClearable={!clearable}
      sx={sx}
      renderInput={(params) => <TextField {...params} label={label} />}
      slotProps={{
        listbox: { style: { maxHeight: 280 } },
      }}
    />
  );
};

export default SearchableSelect;
