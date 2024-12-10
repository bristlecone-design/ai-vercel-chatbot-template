import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppState } from '@/state/app-state';
import { useDebouncedCallback } from 'use-debounce';

import { formatDate, nFormatter } from '@/lib/datesAndTimes';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button, type ButtonProps } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  IconClose,
  IconEyeOpen,
  IconSearch,
  IconSpinner,
} from '@/components/ui/icons';
import { Input } from '@/components/ui/input';
import { DialogDiscoverSplashScreen } from '@/components/discovery/dialog-discover-splash-screen';

import { useUserProfile } from '../../profile/user-profile-provider';
import {
  createUserProfileExperiencePermalink,
  getUserProfilePermalink,
} from '../utils/experience-utils';

import type { PartialExperienceModel } from '@/types/experiences';

export type ExperienceSearchItems = PartialExperienceModel[];

export function ExperienceSearch({
  profilePermalink,
  searchableItems: searchableItemsProp,
  placeholder,
}: {
  profilePermalink: string;
  searchableItems: ExperienceSearchItems;
  placeholder: string;
}) {
  // const router = useRouter();
  const pathnames = usePathname();

  const [isClicked, setIsClicked] = React.useState(false);
  const [activePathname, setActivePathname] = React.useState('');

  // Search
  const searchInputRef = React.useRef<HTMLInputElement>(null);

  const [items, setItems] =
    React.useState<PartialExperienceModel[]>(searchableItemsProp);

  const [searchValue, setSearchValue] = React.useState('');
  const debounced = useDebouncedCallback(async (value) => {
    // console.log(`**** debounced invoked`, { value });
    // Dynamically load fuse.js
    const Fuse = (await import('fuse.js')).default;
    const fuse = new Fuse(searchableItemsProp, {
      keys: ['prompt', 'title', 'content'],
      // location: 0,
      threshold: 0.5,
      distance: 500,
      includeScore: true,
    });

    const results = fuse.search(value).map((result) => result.item);
    // console.log(`Search results`, { results });
    setItems(results);
  }, 250);

  const handleClearingSearch = () => {
    setSearchValue('');
    setItems(searchableItemsProp);
    searchInputRef.current?.focus();
  };

  React.useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Reset clicked state when activePathname changes and is the same as the current path (aka: user was navigated to the page)
  React.useEffect(() => {
    if (activePathname && isClicked) {
      if (activePathname === pathnames) {
        setIsClicked(false);
        setActivePathname('');
      }
    }
  }, [activePathname, pathnames, isClicked]);

  return (
    <div className="flex flex-col gap-3">
      {/* Search Input */}
      <div className={cn('relative w-full')}>
        <Input
          tabIndex={0}
          ref={searchInputRef}
          name="search"
          placeholder={placeholder}
          className={cn(
            'h-[unset] rounded-xl border-none bg-secondary/50 px-4 py-2 text-lg leading-none placeholder:text-base'
          )}
          // defaultValue={''}
          value={searchValue}
          onChange={(e) => {
            const { value } = e.currentTarget;

            if (value) {
              debounced(value);
            } else {
              setItems(searchableItemsProp);
            }

            setSearchValue(value);
          }}
        />
        <div className="absolute right-4 top-1/2 flex -translate-y-1/2 transform items-center gap-1">
          {items.length > 0 && <Badge variant="outline">{items.length}</Badge>}
          <Button
            size="icon"
            variant="ghost"
            disabled={!searchValue}
            className="size-8 rounded-full"
            onClick={() => {
              handleClearingSearch();
            }}
          >
            <IconClose className="size-4" />
          </Button>
        </div>
      </div>
      {/* Search Items / Results */}

      <Command loop className="relative">
        <CommandList className="max-w-md">
          <CommandEmpty className="text-center text-base">
            No content found.
          </CommandEmpty>
          <CommandGroup tabIndex={0} className="max-w-full">
            {items.map((searchItem) => {
              const searchId = searchItem.id;

              if (!searchId) {
                return null;
              }

              const searchTitle =
                searchItem.title ||
                searchItem.prompt ||
                searchItem.content?.slice(0, 50);

              const searchPermalink = createUserProfileExperiencePermalink(
                searchId,
                profilePermalink
              );

              const searchCreatedAt = searchItem.createdAt || '';

              const searchViewCount = searchItem.views || null;

              return (
                <CommandItem
                  asChild
                  key={searchTitle}
                  value={searchTitle}
                  className=""
                  onSelect={(value) => {
                    setIsClicked(true);
                    setActivePathname(searchPermalink);
                    // router.push(searchPermalink);
                    // setOpen(false)
                  }}
                >
                  <Link
                    href={searchPermalink}
                    className="group max-w-full cursor-pointer flex-col items-start justify-start gap-1 text-base"
                  >
                    <span className="w-full text-base">{searchTitle}</span>
                    <div className="flex w-full items-start justify-start gap-2">
                      {searchCreatedAt && (
                        <Badge
                          variant="outline"
                          className="self-start text-xs font-light group-hover:bg-background/80"
                        >
                          {formatDate(searchCreatedAt, 'month')}
                        </Badge>
                      )}
                      {searchViewCount && (
                        <Badge
                          variant="outline"
                          className="gap-1.5 self-start text-xs font-light group-hover:bg-background/80"
                        >
                          <IconEyeOpen className="inline-block size-3" />
                          {nFormatter(searchViewCount)}
                        </Badge>
                      )}
                    </div>
                  </Link>
                </CommandItem>
              );
            })}
          </CommandGroup>
        </CommandList>
        {isClicked && (
          <div className="absolute flex size-full items-center justify-center bg-muted/60">
            <IconSpinner className="size-5 animate-spin" />
          </div>
        )}
      </Command>
    </div>
  );
}
export interface ExperienceSearchDialogProps {
  open?: boolean;
  title?: string;
  placeholder?: string;
  items: ExperienceSearchItems;
  btnTriggerProps?: ButtonProps;
  onOpenChange?: (open: boolean) => void;
}

export function ExperienceSearchDialog({
  items: searchableItemsProp = [],
  open: openProp = false,
  title = 'Search Experiences and Contributions',
  placeholder = '...',
  btnTriggerProps,
  onOpenChange: onOpenChangeProp,
}: ExperienceSearchDialogProps) {
  const {
    variant: btnTriggerVariant = 'outline',
    className: btnTriggerClassName = '',
    size: btnTriggerSize = 'custom',
    ...btnTriggerRest
  } = btnTriggerProps || {};

  const [open, setOpen] = React.useState(openProp);

  // App state
  const { isAuthenticated } = useAppState();

  // Profile state
  const profileData = useUserProfile();
  const { userProfile } = profileData;
  const { username: profileUsername } = userProfile;

  const profilePermalink = profileUsername
    ? getUserProfilePermalink(profileUsername)
    : '';

  const handleOnOpenChange = (open: boolean) => {
    setOpen(open);

    if (typeof onOpenChangeProp === 'function') {
      onOpenChangeProp(open);
    }
  };

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  return (
    <Dialog open={open} onOpenChange={handleOnOpenChange}>
      <DialogTrigger asChild>
        <Button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            handleOnOpenChange(true);
          }}
          variant={btnTriggerVariant}
          size={btnTriggerSize}
          className={cn('gap-2 rounded-full px-2.5 py-1', btnTriggerClassName)}
          {...btnTriggerRest}
        >
          <IconSearch className="size-3" />
          <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded-full border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-background sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {/* <DialogDescription>
            Some description here to help users understand what they can do with
          </DialogDescription> */}
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {isAuthenticated && (
            <ExperienceSearch
              searchableItems={searchableItemsProp}
              profilePermalink={profilePermalink}
              placeholder={placeholder}
            />
          )}
          {!isAuthenticated && (
            <DialogDiscoverSplashScreen
              noCloseBtn={false}
              cb={handleOnOpenChange}
            />
          )}
        </div>
        {/* <DialogFooter>
          
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
}
