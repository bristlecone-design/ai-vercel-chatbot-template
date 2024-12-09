'use client';

import * as React from 'react';
import { useCommandState } from 'cmdk';
import { ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

import { Badge } from './ui/badge';
import { Input } from './ui/input';

type Item = {
  value: string;
  label: string;
  custom?: boolean;
  selected?: boolean;
};

export const interests: Item[] = [
  {
    value: 'camping',
    label: 'Camping',
  },
  {
    value: 'community',
    label: 'Community',
  },
  {
    value: 'cooking',
    label: 'Cooking',
  },
  {
    value: 'gardening',
    label: 'Gardening',
  },
  {
    value: 'hiking',
    label: 'Hiking',
  },
  {
    value: 'kayaking',
    label: 'Kayaking',
  },
  {
    value: 'movies',
    label: 'Movies',
  },
  {
    value: 'music',
    label: 'Music',
  },
  {
    value: 'painting',
    label: 'Painting',
  },
  {
    value: 'photography',
    label: 'Photography',
  },
  {
    value: 'partnerships',
    label: 'Partnerships',
  },
  {
    value: 'reading',
    label: 'Reading',
  },
  {
    value: 'running',
    label: 'Running',
  },
  {
    value: 'sports',
    label: 'Sports',
  },
  {
    value: 'stargazing',
    label: 'Stargazing',
  },
  {
    value: 'traveling',
    label: 'Traveling',
  },
  {
    value: 'volunteering',
    label: 'Volunteering',
  },
  {
    value: 'writing',
    label: 'Writing',
  },
  {
    value: 'other',
    label: 'Other',
  },
];

export const professions: Item[] = [
  {
    value: 'artist',
    label: 'Artist',
  },
  {
    value: 'designer',
    label: 'Designer',
  },
  {
    value: 'developer',
    label: 'Developer',
  },
  {
    value: 'educator',
    label: 'Educator/Teacher',
  },
  {
    value: 'entrepreneur',
    label: 'Entrepreneur',
  },
  {
    value: 'engineer',
    label: 'Engineer',
  },
  {
    value: 'investor',
    label: 'Investor',
  },
  {
    value: 'marketer',
    label: 'Marketer',
  },
  {
    value: 'photographer',
    label: 'Photographer',
  },
  {
    value: 'public-servant',
    label: 'Public Servant',
  },
  {
    value: 'real-estate',
    label: 'Real Estate',
  },
  {
    value: 'restaurateur',
    label: 'Restaurateur',
  },
  {
    value: 'scientist',
    label: 'Scientist',
  },
  {
    value: 'student',
    label: 'Student',
  },
  {
    value: 'partnerships',
    label: 'Strategy/Partnerships',
  },
  {
    value: 'technologist',
    label: 'Technologist',
  },
  {
    value: 'writer',
    label: 'Writer',
  },
  {
    value: 'other',
    label: 'Other',
  },
];

export function EmptySearchCommandMessage() {
  const search = useCommandState((state) => state.search);
  return <CommandEmpty>{search}</CommandEmpty>;
}

export function SearchCommandItem({
  query,
  currentValues = [],
  currentOptions = [],
  items = [],
  setValue,
  setOpen,
}: {
  query?: string;
  currentOptions?: Item[];
  currentValues?: string[];
  setValue: (value: string) => void;
  setOpen: (value: boolean) => void;
  items?: Item[];
}) {
  const search = useCommandState((state) => state.search);
  const isSearchEqual = items.length
    ? items.some((p) => p.value.toLowerCase() === search?.toLowerCase())
    : false;
  const isSearchSelected = currentValues.length
    ? currentValues.some((v) => v.toLowerCase() === search?.toLowerCase())
    : false;
  const isSearchExistingOption = currentOptions.length
    ? currentOptions.some(
        (p) => p.value.toLowerCase() === search?.toLowerCase()
      )
    : false;

  if (!search || isSearchEqual || isSearchSelected || isSearchExistingOption) {
    return null;
  }

  return (
    <CommandItem
      key={search}
      value={search}
      onSelect={(currentValue) => {
        setValue(currentValue);
        setOpen(false);
      }}
      className="flex items-center justify-between gap-1.5"
    >
      {search}
      <Badge variant="outline" className="">
        {!isSearchEqual && 'Custom'}
        {isSearchEqual && 'Selected'}
      </Badge>
    </CommandItem>
  );
}

export function MultiSelectCombobox({
  disabled,
  modal = true,
  fullWidth = false,
  maxSelections = 5,
  inputName,
  options = [],
  className,
  placeholder = 'Search...',
  btnPlaceholder = 'Search...',
  defaultValue: defaultValueProp = [],
  onValuesChange,
}: {
  modal?: boolean;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  btnPlaceholder?: string;
  inputName?: string;
  fullWidth?: boolean;
  maxSelections?: number;
  options?: Item[];
  defaultValue?: string[];
  onValuesChange?: (values: string) => void;
}) {
  const [values, setValues] = React.useState<Array<string>>(defaultValueProp);
  const [prevOptions, setPrevOptions] = React.useState(options);

  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');

  const customValueItems = values.filter(
    (v) =>
      !options.some((p) => p.value === v) && !options.some((p) => p.label === v)
  );

  const searchList: Item[] = (
    customValueItems
      ? [
          ...values
            .map((value) => ({
              value,
              label: value,
              custom: Boolean(
                !options.find((i) => i.value === value) &&
                  !options.find((i) => i.label === value)
              ),
              selected: true,
            }))
            .filter((v) => v.custom),
          ...options,
        ]
      : options
  )
    .map((v) => ({
      ...v,
      selected: v.selected || values.includes(v.value),
    }))
    .sort((a, b) => {
      // Sort selected items first
      if (a.selected && !b.selected) return -1;
      if (!a.selected && b.selected) return 1;
      return 0;
    })
    .sort((a, b) => {
      // Sort custom items first
      if (a.custom && !b.custom) return -1;
      if (!a.custom && b.custom) return 1;
      return 0;
    });

  const handleSetValue = (itemValue: string) => {
    let nextState = [] as string[];
    setValues((prev) => {
      if (prev.includes(itemValue)) {
        nextState = prev.filter((v) => v !== itemValue);
      } else {
        nextState = [...prev, itemValue];
      }
      return nextState;
    });

    if (nextState && typeof onValuesChange === 'function') {
      // Map value to label
      const selectedValues = nextState.map((value) => {
        const item = options.find((p) => p.value === value);
        return item?.label ?? value;
      });
      onValuesChange(selectedValues.join(','));
    }
    // setOpen(false);
  };

  const selectedValues = values.map((value) => {
    const item = options.find((p) => p.value === value);
    return item?.label ?? value;
  });

  const numSelected = values.length;

  return (
    <>
      {inputName && (
        <Input
          id={inputName}
          name={inputName}
          type="hidden"
          value={values.join(',')}
        />
      )}
      <Popover modal={modal} open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn('flex max-w-full justify-between', className, {
              'w-full': fullWidth,
            })}
          >
            <span className="max-w-[200px] flex-shrink truncate sm:max-w-[initial]">
              {selectedValues.length
                ? selectedValues.join(', ')
                : btnPlaceholder}
            </span>
            <div className="flex items-center gap-1.5">
              {numSelected > 0 && (
                <Badge variant="outline" className="ml-2">
                  {numSelected}/{maxSelections}
                </Badge>
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className={cn('w-[200px] p-0', {
            'w-full': fullWidth,
          })}
        >
          <Command
            className=""
            filter={(value, search) => {
              return value.toLowerCase().includes(search.toLowerCase().trim())
                ? 1
                : 0;
            }}
          >
            <CommandInput
              value={query}
              disabled={disabled}
              placeholder={selectedValues.length ? '' : placeholder}
              onValueChange={setQuery}
              className=""
            />
            <CommandList className="">
              {/* <EmptySearchCommandMessage /> */}
              <CommandGroup>
                {searchList.map((item) => {
                  // const isCustom = Boolean(profession.custom);
                  const isSelected =
                    item.selected ||
                    values.includes(item.value) ||
                    values.includes(item.label);
                  const isDisabled =
                    values.length >= maxSelections && !isSelected;
                  return (
                    <CommandItem
                      key={item.value}
                      value={item.label}
                      onSelect={handleSetValue}
                      disabled={isDisabled}
                      className={cn(
                        'flex items-center justify-between gap-1.5',
                        'hover:bg-white focus:bg-accent focus:text-accent',
                        {
                          'text-foreground/50': isDisabled,
                        }
                      )}
                    >
                      {item.label}
                      {isSelected && (
                        <Badge variant="outline" className="">
                          Selected
                        </Badge>
                      )}
                    </CommandItem>
                  );
                })}
                <SearchCommandItem
                  query={query}
                  currentValues={values}
                  currentOptions={searchList}
                  setValue={handleSetValue}
                  setOpen={setOpen}
                />
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}
