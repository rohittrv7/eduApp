import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import * as fc from 'fast-check';

describe('Example test suite', () => {
  it('renders a simple element', () => {
    render(<div data-testid="hello">Hello World</div>);
    expect(screen.getByTestId('hello')).toBeInTheDocument();
  });

  it('property: string concatenation length', () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (a, b) => {
        return (a + b).length === a.length + b.length;
      }),
    );
  });
});
