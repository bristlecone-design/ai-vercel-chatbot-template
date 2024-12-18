'use client';

import React from 'react';

import { GeneralDrawer } from '../drawer-general';

export function AudioRecorderDrawer({
  children,
  className,
  open: openProp,
  description,
  title = 'Record Audio Chat',
  footerCloseLabel = 'Close',
  handleOnClose: handleOnCloseProp,
}: {
  open?: boolean;
  title?: React.ReactNode;
  description?: string | null;
  footerCloseLabel?: string;
  children: React.ReactNode;
  className?: string;
  handleOnClose?: (text?: string) => void;
  handleOnSubmit?: (text: string) => void;
}) {
  const [isOpen, setIsOpen] = React.useState(openProp);

  const handleOnClose = () => {
    // console.log('**** handleOnClose in AudioRecorderDrawer');
    setIsOpen(false);

    if (typeof handleOnCloseProp === 'function') {
      // console.log('**** handleOnCloseProp in AudioRecorderDrawer');
      handleOnCloseProp();
    }
  };

  const handleOnToggle = () => {
    setIsOpen((current) => !current);
  };

  React.useEffect(() => {
    if (openProp !== isOpen) {
      setIsOpen(openProp);
    }
  }, [isOpen, openProp]);

  return (
    <GeneralDrawer
      noFooter
      modal
      dismissible={true}
      open={isOpen}
      title={title}
      description={description}
      titleClassName="justify-center text-4xl"
      //   contentClassName="aspect-video-landscape-wide"
      footerCtaLabel={footerCloseLabel}
      handleOnClose={handleOnClose}
      className={className}
    >
      {children}
    </GeneralDrawer>
  );
}
