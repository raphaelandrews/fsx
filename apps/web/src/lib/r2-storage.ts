export async function createPresignedUploadUrl(fileName: string, _contentType: string) {
  const key = `uploads/${Date.now()}-${fileName}`;

  return {
    uploadUrl: "",
    publicUrl: "",
    key,
  };
}

export async function deleteUploadedFile(_key: string) {
  return true;
}

export function getPublicUrl(key: string): string {
  return key;
}
