import { useCallback } from 'react';
import { Chuck } from 'webchuck';

export type UseFileUploadsParams = {
  chuck?: Chuck;
  filesToProcessRef: React.MutableRefObject<any>;
  uploadedBlobRef?: React.MutableRefObject<Blob | MediaSource | null>;
  onAfterAnalyze?: (fileName: string, arrayBuffer: ArrayBuffer) => void;
};

export function useFileUploads({ chuck, filesToProcessRef, uploadedBlobRef, onAfterAnalyze }: UseFileUploadsParams) {
  const onSubmit = useCallback(async ({ file }: { file: FileList }) => {
    if (!file || file.length < 1) return;

    // Process each selected file
    for (let i = 0; i < file.length; i++) {
      const f = file.item(i);
      if (!f) continue;
      const arrayBuffer = await f.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);

      // Push into shared files list used throughout legacy components
      try {
        filesToProcessRef.current = filesToProcessRef.current || [];
        filesToProcessRef.current.push({ data, filename: f.name, processed: false });
      } catch (e) {
        console.warn('filesToProcessRef push failed (non-critical):', e);
      }

      // Mount to WebChucK FS if available
      try {
        if (chuck) {
          await chuck.createFile('', f.name, arrayBuffer);
        }
      } catch (e) {
        console.warn('Chuck createFile failed (continuing):', e);
      }

      // Optionally expose blob for FileWindow
      try {
        if (uploadedBlobRef) {
          uploadedBlobRef.current = new Blob([arrayBuffer], { type: f.type || 'audio/wav' });
        }
      } catch (e) {
        console.warn('Setting uploadedBlobRef failed (continuing):', e);
      }

      // Optional downstream analysis hook (e.g., Meyda)
      try {
        onAfterAnalyze && onAfterAnalyze(f.name, arrayBuffer);
      } catch (e) {
        console.warn('onAfterAnalyze failed (continuing):', e);
      }
    }
  }, [chuck, filesToProcessRef, uploadedBlobRef, onAfterAnalyze]);

  return { onSubmit } as const;
}
