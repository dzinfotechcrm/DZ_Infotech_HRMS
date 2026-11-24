import { pdf } from '@react-pdf/renderer';
import { OfferLetterPDF } from '../components/pdf/OfferLetterPDF';
import { NDAPDF } from '../components/pdf/NDAPDF';
import { InternshipCertificatePDF } from '../components/pdf/InternshipCertificatePDF';
import { supabase } from '../supabase/config';

/**
 * Generates and uploads the Offer Letter and NDA for an intern.
 * @param {Object} intern - The intern data object.
 * @returns {Promise<{offerLetterUrl: string, ndaUrl: string}>} - The public URLs of the uploaded PDFs.
 */
export async function generateAndUploadInternDocuments(intern) {
  if (!intern.id) {
    throw new Error('Intern ID is required to upload documents.');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  
  // 1. Generate PDFs as Blobs
  const offerLetterBlob = await pdf(<OfferLetterPDF intern={intern} />).toBlob();
  const ndaBlob = await pdf(<NDAPDF intern={intern} />).toBlob();

  // 2. Define filenames
  const firstName = (intern.first_name || 'First').trim().replace(/\s+/g, '_');
  const lastName = (intern.last_name || 'Last').trim().replace(/\s+/g, '_');
  const safeName = `${firstName}_${lastName}`;
  const offerLetterPath = `${intern.id}/${safeName}_Offer_Letter.pdf`;
  const ndaPath = `${intern.id}/${safeName}_NDA.pdf`;

  // 3. Upload to Supabase Storage 'intern_documents' bucket
  const [offerResult, ndaResult] = await Promise.all([
    supabase.storage.from('intern_documents').upload(offerLetterPath, offerLetterBlob, {
      contentType: 'application/pdf',
      upsert: true, 
    }),
    supabase.storage.from('intern_documents').upload(ndaPath, ndaBlob, {
      contentType: 'application/pdf',
      upsert: true,
    })
  ]);

  if (offerResult.error) throw new Error(`Failed to upload Offer Letter: ${offerResult.error.message}`);
  if (ndaResult.error) throw new Error(`Failed to upload NDA: ${ndaResult.error.message}`);

  // 4. Get Public URLs (assuming bucket is private, we should probably get a signed URL, 
  // but if the app relies on public URLs for viewing, we use getPublicUrl. Wait, bucket is private per RLS.)
  // Wait, if bucket is private, `getPublicUrl` might not work without token. But Supabase `createSignedUrl` is better.
  // Actually, usually HRMS apps use `createSignedUrl` when viewing, but if we store the path in DB, 
  // we can just store the path and generate signed urls on the fly, or if we use RLS, clients can download directly 
  // using `supabase.storage.from('intern_documents').download(path)`.
  // Let's return the paths instead of public URLs, so the UI can download them securely.
  
  return {
    offerLetterPath: offerResult.data.path,
    ndaPath: ndaResult.data.path,
  };
}

/**
 * Helper to get a short-lived download URL for a document path.
 */
export async function getDocumentDownloadUrl(path) {
  if (!path) return null;
  const { data, error } = await supabase.storage.from('intern_documents').createSignedUrl(path, 60 * 60); // 1 hour
  if (error) {
    console.error('Error generating signed URL:', error);
    return null;
  }
  return data.signedUrl;
}

/**
 * Generates an Internship Completion Certificate Blob.
 */
export async function generateCertificateBlob(intern, options = {}) {
  return await pdf(<InternshipCertificatePDF intern={intern} options={options} />).toBlob();
}

/**
 * Opens a PDF Blob in a new browser tab with proper title and favicon.
 */
export function openPdfInNewTab(blob, fileName) {
  const blobUrl = URL.createObjectURL(blob);
  const newTab = window.open('', '_blank');
  if (!newTab) {
    const file = new File([blob], fileName, { type: 'application/pdf' });
    const fallbackUrl = URL.createObjectURL(file);
    window.open(fallbackUrl, '_blank');
    return;
  }

  newTab.document.open();
  newTab.document.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <title>${fileName}</title>
        <link rel="icon" type="image/jpeg" href="/DZ_Infotech_Logo.jpeg" />
        <style>
          html, body {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background-color: #323639;
          }
          iframe {
            width: 100%;
            height: 100%;
            border: none;
            display: block;
          }
        </style>
      </head>
      <body>
        <iframe src="${blobUrl}#title=${encodeURIComponent(fileName)}" title="${fileName}"></iframe>
      </body>
    </html>
  `);
  newTab.document.close();
}

/**
 * Downloads a PDF Blob with a clean, proper filename.
 */
export function downloadPdfBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
