import { supabase } from './config';

/**
 * Upload a file to Supabase Storage.
 *
 * Called in two ways throughout the app:
 *   uploadFile(path, fileOrBlob, { contentType })   ← Profile, LeaveForm
 *   uploadFile(file, folder)                         ← legacy style
 *
 * Returns the public URL of the uploaded file.
 */
export async function uploadFile(pathOrFile, fileOrFolder, options = {}) {
  // Detect call style: if first arg is a string it's the explicit storage path.
  if (typeof pathOrFile === 'string') {
    const filePath = pathOrFile;
    const blob = fileOrFolder;
    if (!blob) return null;

    const { error } = await supabase.storage
      .from('files')
      .upload(filePath, blob, { upsert: true, ...options });

    if (error) throw error;

    const { data } = supabase.storage.from('files').getPublicUrl(filePath);
    return data.publicUrl;
  }

  // Legacy style: uploadFile(fileObject, folderString)
  const file = pathOrFile;
  const folder = typeof fileOrFolder === 'string' ? fileOrFolder : 'documents';
  if (!file) return null;

  const fileExt = file.name?.split('.').pop() || 'bin';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  const { error } = await supabase.storage
    .from('files')
    .upload(filePath, file, { upsert: true });

  if (error) throw error;

  const { data } = supabase.storage.from('files').getPublicUrl(filePath);
  return data.publicUrl;
}
