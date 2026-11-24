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
 * Opens a PDF Blob in a new browser tab with proper title, favicon, and download bar.
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
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          }
          .top-bar {
            height: 44px;
            background: #202124;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
            color: #ffffff;
            border-bottom: 1px solid #3c4043;
            box-sizing: border-box;
          }
          .brand-info {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 13px;
            font-weight: 500;
            letter-spacing: 0.2px;
          }
          .btn-download {
            background: #EA6B23;
            color: white;
            border: none;
            padding: 5px 14px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 6px;
          }
          .btn-download:hover {
            background: #d45d1b;
          }
          iframe {
            width: 100%;
            height: calc(100% - 44px);
            border: none;
            display: block;
          }
        </style>
      </head>
      <body>
        <div class="top-bar">
          <div class="brand-info">
            <img src="/DZ_Infotech_Logo.jpeg" style="height: 24px; width: 24px; object-fit: contain; border-radius: 4px;" alt="DZ Infotech" />
            <span>${fileName}</span>
          </div>
          <button class="btn-download" onclick="savePdf()">
            <svg style="width: 14px; height: 14px;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            <span>Download</span>
          </button>
        </div>
        <iframe src="${blobUrl}#title=${encodeURIComponent(fileName)}" title="${fileName}"></iframe>
        <script>
          function savePdf() {
            const a = document.createElement('a');
            a.href = '${blobUrl}';
            a.download = '${fileName}';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        </script>
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

/**
 * High-level helper to view PDF with proper filename and tab title.
 * Uploads to Supabase Storage first so Chrome PDF viewer has the real filename in the URL.
 * Falls back to openPdfInNewTab if offline or upload fails.
 */
export async function viewPdfWithProperName({ blob, fileName, internId }) {
  let signedUrl = null;
  if (internId) {
    try {
      const filePath = `${internId}/${fileName}`;
      const { data: uploadData, error: uploadErr } = await supabase.storage
        .from('intern_documents')
        .upload(filePath, blob, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (!uploadErr && uploadData?.path) {
        const { data: signedData } = await supabase.storage
          .from('intern_documents')
          .createSignedUrl(uploadData.path, 60 * 60);
        if (signedData?.signedUrl) {
          signedUrl = signedData.signedUrl;
        }
      }
    } catch (err) {
      console.warn('Supabase storage preview sync fallback:', err);
    }
  }

  if (signedUrl) {
    window.open(signedUrl, '_blank');
  } else {
    openPdfInNewTab(blob, fileName);
  }
}
