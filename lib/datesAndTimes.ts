import { format } from 'date-fns/format';
import { parse } from 'date-fns/parse';
import { parseISO } from 'date-fns/parseISO';
import ms from 'ms';

// https://date-fns.org/v1.28.5/docs/format
export const YYYY_MM_DD_TIME = 'yyyy-MM-dd HH:mm:ss';
export const MM_DD_YY = 'MM/dd/yy';
export const MMM_DO_YY = 'MMM do yyyy @ h:mm:ss aa';

const DATE_STRING_FORMAT_YEAR = 'yyyy';
const DATE_STRING_FORMAT_MONTH = 'MMM yyyy';
const DATE_STRING_FORMAT_SHORT = 'dd MMM yyyy';
const DATE_STRING_FORMAT_MEDIUM = 'dd MMM yy h:mma';
const DATE_STRING_FORMAT = 'dd MMM yyyy h:mma';
const DATE_STRING_FORMAT_POSTGRES = 'yyyy-MM-dd HH:mm:ss';

type AmbiguousTimestamp = number | string;

type Length = 'short' | 'medium' | 'long' | 'year' | 'month';

export const formatDate = (date: Date, length: Length = 'long') => {
  switch (length) {
    case 'short':
      return format(date, DATE_STRING_FORMAT_SHORT);
    case 'medium':
      return format(date, DATE_STRING_FORMAT_MEDIUM);
    case 'year':
      return format(date, DATE_STRING_FORMAT_YEAR);
    case 'month':
      return format(date, DATE_STRING_FORMAT_MONTH);
    default:
      return format(date, DATE_STRING_FORMAT);
  }
};

export function formatDateLegacy(input: string | number | Date): string {
  if (!input) return '';

  if (input instanceof Date) {
    input = input.getTime();
  } else if (typeof input === 'number') {
    input = input;
  } else if (
    typeof input === 'string' &&
    Number.isNaN(Number.parseInt(input))
  ) {
    input = new Date(input).getTime();
  }

  const date = new Date(input);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export const formatNumber = (
  value: number,
  currency = 'USD',
  currencyStyle: Intl.NumberFormatOptionsStyle = 'currency',
) =>
  new Intl.NumberFormat('en-US', {
    style: currencyStyle,
    currency,
  }).format(value);

export function formatDateCustom(date: string, dateFormat = MMM_DO_YY) {
  return format(new Date(date), dateFormat);
}

export const timeAgo = (timestamp: Date, timeOnly?: boolean): string => {
  if (!timestamp) return 'never';
  return `${ms(Date.now() - new Date(timestamp).getTime())}${
    timeOnly ? '' : ' ago'
  }`;
};

export const formatTimeLapsed = (time: number): string => {
  return ms(time);
};

export function nFormatter(num: number, digits?: number) {
  if (!num) return '0';
  const lookup = [
    // 1: 1
    { value: 1, symbol: '' },
    // 1e+3: 1,000
    { value: 1e3, symbol: 'K' },
    // 1e+6: 1,000,000
    { value: 1e6, symbol: 'M' },
    // 1e+9: 1,000,000,000
    { value: 1e9, symbol: 'G' },
    // 1e+12: 1,000,000,000,000
    { value: 1e12, symbol: 'T' },
    // 1e+15: 1,000,000,000,000,000
    { value: 1e15, symbol: 'P' },
    // 1e+18: 1,000,000,000,000,000,000
    { value: 1e18, symbol: 'E' },
  ];
  const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  const item = lookup
    .slice()
    .reverse()
    .find((item) => num >= item.value);

  return item
    ? (num / item.value).toFixed(digits || 1).replace(rx, '$1') + item.symbol
    : '0';
}

export const formatDateFromPostgresString = (date: string, length?: Length) =>
  formatDate(parse(date, DATE_STRING_FORMAT_POSTGRES, new Date()), length);

export const formatDateForPostgres = (date: Date) =>
  date
    .toISOString()
    .replace(/(\d{4}):(\d{2}):(\d{2}) (\d{2}:\d{2}:\d{2})/, '$1-$2-$3 $4');

const dateFromTimestamp = (timestamp?: AmbiguousTimestamp): Date => {
  const date =
    typeof timestamp === 'number'
      ? new Date(timestamp * 1000)
      : typeof timestamp === 'string'
        ? /.+Z/i.test(timestamp)
          ? new Date(timestamp)
          : new Date(`${timestamp}Z`)
        : undefined;
  return date && !Number.isNaN(date.getTime()) ? date : new Date();
};

export const createNaiveDateWithOffset = (
  timestamp?: AmbiguousTimestamp,
  offset = '+00:00',
) => {
  const date = dateFromTimestamp(timestamp);
  const dateString = `${date.toISOString()}`.replace(/\.[\d]+Z/, offset);
  return parseISO(dateString);
};

// Run on the server, when there are date/timestamp/offset inputs

export const convertTimestampWithOffsetToPostgresString = (
  timestamp?: AmbiguousTimestamp,
  offset?: string,
) => formatDateForPostgres(createNaiveDateWithOffset(timestamp, offset));

export const convertTimestampToNaivePostgresString = (
  timestamp?: AmbiguousTimestamp,
) =>
  dateFromTimestamp(timestamp)
    .toISOString()
    .replace(/(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})(.[\d]+Z)*/, '$1 $2');

// Run in browser to generate local date time strings

export const generateLocalPostgresString = () =>
  formatDateForPostgres(new Date());

export const generateLocalNaivePostgresString = () =>
  format(new Date(), DATE_STRING_FORMAT_POSTGRES);

/**
 * Add hours to a date
 *
 * @note This function modifies the date object in place
 * @example addHours(new Date(), 1) => Date object with 1 hour added
 */
export function addHours(date: Date, hours: number): Date {
  const hoursToAdd = hours * 60 * 60 * 1000;
  date.setTime(date.getTime() + hoursToAdd);
  return date;
}
