import { ModeParams, Sora3Params, ReframeParams } from '@/types/generation-modes';

const STORAGE_KEY = 'video-generation-form-state-v1';

/**
 * Convert File object to base64 data URL for storage
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Convert base64 data URL back to File object
 */
function base64ToFile(dataUrl: string, fileName: string, mimeType: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || mimeType;
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], fileName, { type: mime });
}

/**
 * Serialize ModeParams for storage, handling File objects
 */
async function serializeModeParams(params: ModeParams): Promise<string> {
  const serializable: any = {
    mode: params.mode,
    params: { ...params.params }
  };

  // Handle File objects in params
  if (params.mode === 'reframe') {
    const reframeParams = params.params as ReframeParams;
    const fileFields: Array<keyof ReframeParams> = ['sourceVideo', 'startFrame', 'endFrame'];

    for (const field of fileFields) {
      if (reframeParams[field] instanceof File) {
        const file = reframeParams[field] as File;
        // Only store files smaller than 2MB to avoid localStorage size limits
        if (file.size < 2 * 1024 * 1024) {
          try {
            serializable.params[field] = {
              __type: 'file',
              dataUrl: await fileToBase64(file),
              name: file.name,
              type: file.type
            };
          } catch (error) {
            console.warn(`Failed to serialize file ${field}:`, error);
            delete serializable.params[field];
          }
        } else {
          console.warn(`File ${field} is too large (${file.size} bytes), skipping persistence`);
          delete serializable.params[field];
        }
      }
    }
  }

  return JSON.stringify(serializable);
}

/**
 * Deserialize stored ModeParams, restoring File objects
 */
function deserializeModeParams(serialized: string): ModeParams | null {
  try {
    const data = JSON.parse(serialized);

    if (!data.mode || !data.params) {
      return null;
    }

    // Restore File objects
    if (data.mode === 'reframe') {
      const fileFields: Array<keyof ReframeParams> = ['sourceVideo', 'startFrame', 'endFrame'];

      for (const field of fileFields) {
        if (data.params[field] && data.params[field].__type === 'file') {
          try {
            const fileData = data.params[field];
            data.params[field] = base64ToFile(
              fileData.dataUrl,
              fileData.name,
              fileData.type
            );
          } catch (error) {
            console.warn(`Failed to restore file ${field}:`, error);
            delete data.params[field];
          }
        }
      }
    }

    // Validate mode
    if (data.mode !== 'sora3' && data.mode !== 'reframe' && data.mode !== 'veo3') {
      console.warn('Invalid mode in stored data:', data.mode);
      return null;
    }

    return data as ModeParams;
  } catch (error) {
    console.error('Failed to deserialize form state:', error);
    return null;
  }
}

/**
 * Save form state to localStorage
 */
export async function saveFormState(modeParams: ModeParams): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const serialized = await serializeModeParams(modeParams);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded, clearing old form state');
      try {
        localStorage.removeItem(STORAGE_KEY);
        const serialized = await serializeModeParams(modeParams);
        localStorage.setItem(STORAGE_KEY, serialized);
      } catch (retryError) {
        console.error('Failed to save form state after clearing:', retryError);
      }
    } else {
      console.error('Failed to save form state:', error);
    }
  }
}

/**
 * Save form state to localStorage synchronously (files omitted).
 */
export function saveFormStateSync(modeParams: ModeParams): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const serializable: any = {
      mode: modeParams.mode,
      params: { ...modeParams.params }
    };

    if (modeParams.mode === 'reframe') {
      const reframeParams = modeParams.params as ReframeParams;
      const fileFields: Array<keyof ReframeParams> = ['sourceVideo', 'startFrame', 'endFrame'];
      for (const field of fileFields) {
        if (reframeParams[field] instanceof File) {
          delete serializable.params[field];
        }
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable));
  } catch (error) {
    console.error('Failed to save form state synchronously:', error);
  }
}

/**
 * Load form state from localStorage
 */
export function loadFormState(): ModeParams | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return null;
    }

    return deserializeModeParams(stored);
  } catch (error) {
    console.error('Failed to load form state:', error);
    return null;
  }
}

/**
 * Clear saved form state
 */
export function clearFormState(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear form state:', error);
  }
}

/**
 * Check if form state exists in storage
 */
export function hasFormState(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch (error) {
    return false;
  }
}
