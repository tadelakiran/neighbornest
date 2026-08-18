import { describe, expect, it } from 'vitest';
import { isRetryableNoResponse } from '@/services/api';

/**
 * Tests for the API client's one-shot retry rule (cold-start / first-call
 * failures). The rule must stay conservative: GETs may be retried on any
 * no-response failure, but a POST must only be retried when the connection
 * was refused outright (so a request the server actually processed is never
 * double-submitted).
 */
describe('isRetryableNoResponse', () => {
  it('retries GET/HEAD on any no-response failure (timeout or network)', () => {
    expect(isRetryableNoResponse('get', 'ECONNABORTED')).toBe(true);
    expect(isRetryableNoResponse('GET', 'ERR_NETWORK')).toBe(true);
    expect(isRetryableNoResponse('head', 'ECONNABORTED')).toBe(true);
    expect(isRetryableNoResponse(undefined, undefined)).toBe(true); // default GET
  });

  it('retries non-GET only on a connection-level refusal (ERR_NETWORK)', () => {
    expect(isRetryableNoResponse('post', 'ERR_NETWORK')).toBe(true);
    expect(isRetryableNoResponse('PUT', 'ERR_NETWORK')).toBe(true);
  });

  it('never retries non-GET on a client timeout (server may have processed it)', () => {
    expect(isRetryableNoResponse('post', 'ECONNABORTED')).toBe(false);
    expect(isRetryableNoResponse('POST', undefined)).toBe(false);
    expect(isRetryableNoResponse('delete', 'ECONNABORTED')).toBe(false);
  });
});
