import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import SearchableSelect from '../ui/SearchableSelect';
import Button from '../ui/Button';
import { updateDocument } from '../../supabase/db';
import { uploadFile } from '../../supabase/storage';
import { INDIAN_BANKS } from '../../utils/bankData';
import { toast } from 'react-hot-toast';

const bankOptions = INDIAN_BANKS.map(bank => ({ value: bank, label: bank }));

export default function InternBankDetailsPrompt({ user }) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    bankName: '',
    ifsc: '',
    bankAccount: '',
    upiId: ''
  });
  const [upiQrFile, setUpiQrFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isIfscLoading, setIsIfscLoading] = useState(false);
  const [branchDetails, setBranchDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Check if the user is a paid intern who is missing bank details
    if (user && user.role === 'intern' && user.isPaid) {
      if (!user.bankName || !user.ifsc || !user.bankAccount) {
        setOpen(true);
      }
    }
  }, [user]);

  const handleChange = (field, value) => {
    setErrors(prev => ({ ...prev, [field]: undefined }));
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleBankNameChange = (val) => {
    handleChange('bankName', val);
    handleChange('ifsc', '');
    handleChange('bankAccount', '');
    setBranchDetails('');
  };

  const handleIfscChange = async (val) => {
    const formattedVal = val.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    handleChange('ifsc', formattedVal);
    handleChange('bankAccount', '');
    setBranchDetails('');

    if (/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formattedVal)) {
      setIsIfscLoading(true);
      try {
        const res = await fetch(`https://ifsc.razorpay.com/${formattedVal}`);
        if (res.ok) {
          const data = await res.json();
          // Ensure it roughly matches the selected bank
          if (formData.bankName && !data.BANK.toLowerCase().includes(formData.bankName.split(' ')[0].toLowerCase())) {
            setErrors(prev => ({ ...prev, ifsc: 'IFSC belongs to a different bank' }));
          } else {
            setBranchDetails(`${data.BRANCH}, ${data.CITY}`);
            setErrors(prev => ({ ...prev, ifsc: undefined }));
          }
        } else {
          setErrors(prev => ({ ...prev, ifsc: 'Invalid IFSC Code' }));
        }
      } catch (err) {
        setErrors(prev => ({ ...prev, ifsc: 'Failed to verify IFSC' }));
      } finally {
        setIsIfscLoading(false);
      }
    } else if (formattedVal.length > 0 && formattedVal.length < 11) {
      setErrors(prev => ({ ...prev, ifsc: 'IFSC must be 11 characters' }));
    } else if (formattedVal.length === 11) {
      setErrors(prev => ({ ...prev, ifsc: 'Invalid IFSC format' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate
    const newErrors = {};
    if (!formData.bankName) newErrors.bankName = 'Bank Name is required';
    if (!formData.ifsc) newErrors.ifsc = 'IFSC Code is required';
    else if (errors.ifsc) newErrors.ifsc = errors.ifsc; // Preserve existing validation errors
    if (!formData.bankAccount) newErrors.bankAccount = 'Account Number is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      let qrUrl = '';
      if (upiQrFile) {
        try {
          qrUrl = await uploadFile(`upi_qrs/${user.uid}/${Date.now()}_${upiQrFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`, upiQrFile, { contentType: upiQrFile.type });
        } catch (uploadErr) {
          toast.error("Failed to upload QR Code image.");
          setIsSubmitting(false);
          return;
        }
      }

      // Assuming user.employeeId holds the intern's document ID in the 'interns' table
      await updateDocument('interns', user.employeeId, {
        bank_name: formData.bankName,
        ifsc_code: formData.ifsc,
        bank_account: formData.bankAccount,
        upi_id: formData.upiId || '',
        upi_qr_code_url: qrUrl || ''
      });

      // Update the user's local state properties so the modal doesn't reappear
      // Note: Full state sync might require a page reload or context update, but 
      // setting this local object prevents the prompt from re-triggering this session.
      user.bankName = formData.bankName;
      user.ifsc = formData.ifsc;
      user.bankAccount = formData.bankAccount;
      user.upiId = formData.upiId;
      user.upiQrCodeUrl = qrUrl;

      toast.success('Bank details saved successfully!');
      setOpen(false);
    } catch (error) {
      console.error("Failed to save bank details", error);
      toast.error('Failed to save bank details. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        // Prevent closing by clicking outside or escape key
      }}
      title="Complete Your Profile"
    >
      <div className="p-4 sm:p-6">
        <p className="text-sm text-slate-600 mb-6">
          As a paid intern, you must provide your bank details for stipend processing before accessing the dashboard.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <SearchableSelect
            label="Bank Name *"
            error={errors.bankName}
            options={bankOptions}
            value={formData.bankName}
            onChange={(e) => handleBankNameChange(e.target.value)}
          />

          <div className="flex flex-col relative">
            <Input
              label="IFSC Code *"
              error={errors.ifsc}
              value={formData.ifsc}
              onChange={(e) => handleIfscChange(e.target.value)}
              disabled={!formData.bankName}
              placeholder={formData.bankName ? "e.g. SBIN0001234" : "Select a bank first"}
              className={!formData.bankName ? 'bg-slate-50 cursor-not-allowed opacity-60' : ''}
              maxLength={11}
            />
            {isIfscLoading && (
              <div className="absolute right-3 top-9">
                <svg className="animate-spin h-4 w-4 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            )}
            {branchDetails && !errors.ifsc && (
              <span className="text-xs font-medium text-emerald-600 mt-1">{branchDetails}</span>
            )}
          </div>

          <Input
            label="Account Number *"
            error={errors.bankAccount}
            value={formData.bankAccount}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 18);
              handleChange('bankAccount', val);
            }}
            disabled={!formData.ifsc || errors.ifsc || !branchDetails}
            placeholder={!formData.ifsc || errors.ifsc || !branchDetails ? "Select a valid IFSC first" : "Enter account number"}
            className={!formData.ifsc || errors.ifsc || !branchDetails ? 'bg-slate-50 cursor-not-allowed opacity-60' : ''}
            pattern="[0-9]{9,18}"
          />

          <div className="border-t border-slate-100 pt-4 mt-4">
            <h5 className="text-sm font-semibold text-slate-700 mb-3">UPI Details (Optional)</h5>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="UPI ID"
                error={errors.upiId}
                value={formData.upiId}
                onChange={(e) => handleChange('upiId', e.target.value)}
                placeholder="e.g. user@bank"
              />
              <div className="flex flex-col">
                <Input
                  label="Upload QR Code"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    setUpiQrFile(file || null);
                  }}
                />
                {upiQrFile && (
                  <span className="text-xs text-emerald-600 mt-1 truncate">
                    {upiQrFile.name} selected
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || Object.keys(errors).some(k => errors[k]) || !formData.bankName || !formData.ifsc || !formData.bankAccount}
            >
              {isSubmitting ? 'Saving...' : 'Save Bank Details'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
