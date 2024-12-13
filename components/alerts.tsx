// biome-ignore lint/style/useImportType: <explanation>
import React from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

import { IconInfo } from './ui/icons';

export type CommonAlertProps = {
  title?: string;
  description: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

export function CommonAlert({
  icon,
  title,
  description,
  className,
  titleClassName,
  descriptionClassName,
}: CommonAlertProps) {
  return (
    <Alert className={className}>
      {icon}
      {title && <AlertTitle className={titleClassName}>{title}</AlertTitle>}
      <AlertDescription className={descriptionClassName}>
        {description}
      </AlertDescription>
    </Alert>
  );
}

export function InfoAlert({ title, description, ...rest }: CommonAlertProps) {
  return (
    <CommonAlert
      {...rest}
      title={title}
      description={description}
      icon={<IconInfo />}
    />
  );
}
