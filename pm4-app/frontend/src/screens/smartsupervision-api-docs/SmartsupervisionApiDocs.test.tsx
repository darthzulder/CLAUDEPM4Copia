import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SmartsupervisionApiDocs from './SmartsupervisionApiDocs';

describe('SmartsupervisionApiDocs', () => {
  it('renderiza un iframe a pantalla completa apuntando al asset estático de docs', () => {
    render(<SmartsupervisionApiDocs />);

    const objIframe = screen.getByTitle('Documentación Web Service Smartsupervisión (SFC)');
    expect(objIframe).toBeInTheDocument();
    expect(objIframe).toHaveAttribute('src', 'docs/smartsupervision-webservice.html');
  });
});
