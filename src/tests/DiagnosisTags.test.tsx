// @vitest-environment jsdom
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { describe, it, expect } from 'vitest';
import DiagnosisTags from '../components/patient/DiagnosisTags';

describe('DiagnosisTags', () => {
  it('não renderiza nada quando tags é vazio', () => {
    const { container } = render(<DiagnosisTags tags={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renderiza as primeiras 2 tags e badge +1 com 3 tags', () => {
    render(<DiagnosisTags tags={['Anemia', 'Parasitose', 'Anorexia']} />);
    expect(screen.getByText('Anemia')).toBeInTheDocument();
    expect(screen.getByText('Parasitose')).toBeInTheDocument();
    expect(screen.queryByText('Anorexia')).not.toBeInTheDocument();
    expect(screen.getByText('+1')).toBeInTheDocument();
  });

  it('renderiza todas as tags sem badge +N quando tags.length <= maxVisible', () => {
    render(<DiagnosisTags tags={['Anemia', 'Parasitose']} />);
    expect(screen.getByText('Anemia')).toBeInTheDocument();
    expect(screen.getByText('Parasitose')).toBeInTheDocument();
    expect(screen.queryByText(/^\+\d/)).not.toBeInTheDocument();
  });

  it('respeita maxVisible=1 personalizado', () => {
    render(<DiagnosisTags tags={['Anemia', 'Parasitose', 'Anorexia']} maxVisible={1} />);
    expect(screen.getByText('Anemia')).toBeInTheDocument();
    expect(screen.queryByText('Parasitose')).not.toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('renderiza tag única sem overflow', () => {
    render(<DiagnosisTags tags={['Anemia']} />);
    expect(screen.getByText('Anemia')).toBeInTheDocument();
    expect(screen.queryByText(/^\+/)).not.toBeInTheDocument();
  });
});
