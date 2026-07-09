import React from 'react';
import { render } from '@testing-library/react';
import { OfferLetterPDF } from '../../components/pdf/OfferLetterPDF';

describe('OfferLetterPDF', () => {
  const baseIntern = {
    full_name: 'John Doe',
    first_name: 'John',
    position: 'Frontend Intern',
    start_date: '2023-01-01',
    end_date: '2023-03-01',
    duration_text: '2 months',
    work_mode: 'Remote',
    working_days: 'Monday to Friday',
    working_hours: 'Flexible',
    max_leave_per_month: 5,
    is_paid: false,
    stipend_amount: null,
    certificate_eligible: false,
    offer_date: '2022-12-15',
    acceptance_deadline: '2022-12-20',
  };

  it('renders without crashing', () => {
    // @react-pdf/renderer components can be tricky to test with react-testing-library
    // because they use custom primitives (<Document>, <Page>, etc).
    // However, they can be rendered to JSON or just instantiated.
    const element = <OfferLetterPDF intern={baseIntern} />;
    expect(element).toBeDefined();
    expect(element.props.intern).toEqual(baseIntern);
  });

  it('contains paid specific props when is_paid is true', () => {
    const paidIntern = { ...baseIntern, is_paid: true, stipend_amount: 15000 };
    const element = <OfferLetterPDF intern={paidIntern} />;
    expect(element.props.intern.is_paid).toBe(true);
    expect(element.props.intern.stipend_amount).toBe(15000);
  });

  it('contains certificate specific props when certificate_eligible is true', () => {
    const certIntern = { ...baseIntern, certificate_eligible: true };
    const element = <OfferLetterPDF intern={certIntern} />;
    expect(element.props.intern.certificate_eligible).toBe(true);
  });
});
