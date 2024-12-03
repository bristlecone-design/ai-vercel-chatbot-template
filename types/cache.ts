export type CacheStrategy =
  | {
      ttl: number;
      swr: number;
    }
  | {
      ttl: number;
    }
  | {
      swr: number;
    };

export type CacheStatus = 'ttl' | 'swr' | 'miss' | 'none';

export type AccelerateInfo = {
  cacheStatus: CacheStatus;
  lastModified: Date;
  region: string;
  requestId: string;
  signature: string;
};

export type QuoteCacheType = 'SWR' | 'TTL' | 'No caching' | 'TTL + SWR';
