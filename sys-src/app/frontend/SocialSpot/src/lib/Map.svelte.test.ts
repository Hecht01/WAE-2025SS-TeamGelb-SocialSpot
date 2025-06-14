import { render } from '@testing-library/svelte';
import Map from './Map.svelte';
import { describe, it, expect, test } from 'vitest';
import { vi } from 'vitest';
vi.mock('graphql-request');

test('renders Map component', () => {
  const { container } = render(Map);
  expect(container).toBeTruthy();
});

describe('Map component', () => {
  it('renders without crashing', () => {
    const { container } = render(Map);
    expect(container).toBeInTheDocument();
  });
});