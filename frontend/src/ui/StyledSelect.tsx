import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { ChevronDown } from 'lucide-react';
import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface Props {
  options: SelectOption[];
  value?: string; // make optional
  onChange: (value: string) => void;
  placeholder?: string; // default display
}

export const StyledSelect: React.FC<Props> = ({ options, value, onChange, placeholder }) => {
  const selectedOption =
    options.find((opt) => opt.value === value) || { value: '', label: placeholder || 'Select an option' };

  return (
    <Listbox value={selectedOption} onChange={(opt) => onChange(opt.value)}>
      <div className="relative w-full">
        {/* Button */}
        <ListboxButton className="relative w-full cursor-pointer border border-gray-200 bg-white py-2 pl-3 pr-10 text-left shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-400 flex items-center gap-3 transition-all rounded-md">
          {selectedOption.icon && (
            <span className="w-4 h-4 text-gray-500 flex items-center justify-center">
              {selectedOption.icon}
            </span>
          )}
          <span className={`truncate font-medium ${selectedOption.value ? 'text-gray-800' : 'text-gray-400'}`}>
            {selectedOption.label}
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            <ChevronDown className="h-5 w-5 text-gray-400" />
          </span>
        </ListboxButton>

        {/* Options */}
        <ListboxOptions className="absolute mt-2 max-h-60 w-full overflow-auto bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm z-10">
          {options.map((opt) => (
            <ListboxOption
              key={opt.value}
              className={({ active }) =>
                `relative cursor-pointer select-none py-2 px-4 flex items-center gap-3 transition-colors ${
                  active ? 'bg-gray-50 text-gray-800' : 'text-gray-700'
                }`
              }
              value={opt}
            >
              {opt.icon && (
                <span className="w-4 h-4 text-gray-500 flex items-center justify-center">{opt.icon}</span>
              )}
              <span className="truncate">{opt.label}</span>
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
};
