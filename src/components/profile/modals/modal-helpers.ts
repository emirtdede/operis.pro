export function getErrorMessage(err: unknown, defaultMsg: string): string {
  if (err instanceof Error) return err.message;
  return defaultMsg;
}

export function getLoadingButtonLabel(
  isLoading: boolean,
  idleTr: string,
  idleEn: string,
  loadingTr: string,
  loadingEn: string,
  isTr: boolean
): string {
  if (isLoading) {
    return isTr ? loadingTr : loadingEn;
  }
  return isTr ? idleTr : idleEn;
}

export function getAvatarSourceBadgeLabel(source: string, isTr: boolean): string {
  if (source === "custom") {
    return isTr ? "Özel Resim (R2)" : "Custom Picture (R2)";
  }
  return isTr ? "Google Senkronize" : "Google Synced";
}

export function getUploadingPhotoLabel(isUploading: boolean, isTr: boolean): string {
  if (isUploading) {
    return isTr ? "WebP'ye Çevrilip Yükleniyor..." : "Compressing & Uploading...";
  }
  return isTr ? "Cihazdan Fotoğraf Yükle" : "Upload from Device";
}
