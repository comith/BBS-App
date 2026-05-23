export const isImageFile = (filename: string) =>
  /\.(jpg|jpeg|png|gif|webp|bmp)$/i.test(filename);

export const isGoogleDriveUrl = (url: string) => url.includes("drive.google.com");

export const getPreviewUrl = (url: string) => {
  try {
    if (isGoogleDriveUrl(url) && url.includes("/view")) {
      return url.replace(/\/view.*/, "/preview");
    }
    return url;
  } catch {
    return url;
  }
};
