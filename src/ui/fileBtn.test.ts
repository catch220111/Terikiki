import { describe, expect, it } from 'vitest';
import src from './LayerToggles.tsx?raw';

describe('FileBtn', () => {
  it('renders the visible label once', () => {
    const start = src.indexOf('export function FileBtn');
    const end = src.indexOf('export function InkBtn');
    expect(start).toBeGreaterThan(-1);
    expect(end).toBeGreaterThan(start);
    const body = src.slice(start, end);
    expect(body.match(/\{label\}/g)).toEqual(['{label}']);
  });
});
