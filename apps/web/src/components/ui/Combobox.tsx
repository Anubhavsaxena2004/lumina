import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check, X, Plus } from 'lucide-react';

export interface ComboboxOption {
  value: string;
  label: string;
  subLabel?: string;
  badge?: string;
}

export interface ComboboxProps {
  label?: string;
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  onQuickAdd?: () => void;
  quickAddLabel?: string;
  disabled?: boolean;
}

export const Combobox: React.FC<ComboboxProps> = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Search or select...',
  error,
  required,
  onQuickAdd,
  quickAddLabel = '+ Quick Add New',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase()) ||
      (opt.subLabel && opt.subLabel.toLowerCase().includes(search.toLowerCase()))
  );

  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    setSearch('');
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearch('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  return (
    <div className="w-full relative" ref={containerRef}>
      {label && (
        <div className="flex justify-between items-center mb-1.5">
          <label className="block text-xs font-semibold text-[#2B2B2B] uppercase tracking-wider">
            {label}
            {required && <span className="text-[#9B1C31] ml-1">*</span>}
          </label>
          {onQuickAdd && (
            <button
              type="button"
              onClick={onQuickAdd}
              className="text-xs font-semibold text-[#9B1C31] hover:text-[#84192B] flex items-center gap-1 transition"
            >
              <Plus className="h-3 w-3" />
              <span>{quickAddLabel}</span>
            </button>
          )}
        </div>
      )}

      {/* Trigger Button */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={handleOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleOpen();
          }
        }}
        className={`w-full bg-white border text-sm rounded-xl transition duration-150 min-h-[44px] px-3.5 flex items-center justify-between cursor-pointer select-none ${
          disabled ? 'opacity-50 cursor-not-allowed bg-[#FAF6EF]' : ''
        } ${
          error
            ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
            : isOpen
            ? 'border-[#9B1C31] ring-2 ring-[#9B1C31]/20'
            : 'border-[#E8DFD5] hover:border-[#CCA462]'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption ? (
            <div className="flex items-center gap-2 truncate">
              <span className="font-medium text-[#2B2B2B] truncate">{selectedOption.label}</span>
              {selectedOption.subLabel && (
                <span className="text-xs text-[#8C857E] truncate">({selectedOption.subLabel})</span>
              )}
            </div>
          ) : (
            <span className="text-[#AFA190]">{placeholder}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 hover:bg-[#F5EFE6] rounded-full text-[#8C857E] hover:text-[#2B2B2B] transition"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <ChevronDown
            className={`h-4 w-4 text-[#8C857E] transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-[#9B1C31]' : ''
            }`}
          />
        </div>
      </div>

      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-[#E8DFD5] rounded-xl shadow-soft-md overflow-hidden max-h-72 flex flex-col animate-in fade-in zoom-in-95 duration-100">
          <div className="p-2 border-b border-[#F5EFE6] bg-[#FBF7F2] flex items-center gap-2">
            <Search className="h-4 w-4 text-[#8C857E] shrink-0 ml-1" />
            <input
              ref={searchInputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type to filter..."
              className="w-full bg-transparent text-sm focus:outline-none placeholder:text-[#AFA190]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-xs text-[#8C857E] hover:text-[#2B2B2B] px-1"
              >
                Clear
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-[#8C857E]">
                No matching results found
                {onQuickAdd && (
                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOpen(false);
                        onQuickAdd();
                      }}
                      className="inline-flex items-center gap-1 text-[#9B1C31] font-semibold text-xs hover:underline"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add new party/item
                    </button>
                  </div>
                )}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={`px-3.5 py-2.5 flex items-center justify-between text-sm cursor-pointer select-none transition ${
                      isSelected
                        ? 'bg-[#FDF2F4] text-[#9B1C31] font-semibold'
                        : 'hover:bg-[#F5EFE6]/60 text-[#2B2B2B]'
                    }`}
                  >
                    <div className="truncate pr-2">
                      <div className="truncate">{opt.label}</div>
                      {opt.subLabel && (
                        <div className="text-xs text-[#8C857E] truncate font-normal">
                          {opt.subLabel}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {opt.badge && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#FAF6EF] border border-[#EBD7BA] text-[#B8893B]">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check className="h-4 w-4 text-[#9B1C31]" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
