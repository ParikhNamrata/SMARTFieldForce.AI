export function enhanceImage(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(dataUrl);

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Grayscale and contrast/brightness adjustment for better OCR
      const factor = 1.6; // Higher contrast factor
      const brightness = 10; // Slightly less brightness offset

      for (let i = 0; i < data.length; i += 4) {
        // Calculate grayscale (luminosity method)
        const gray = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        
        // Apply contrast and brightness on the gray value
        let val = (gray - 128) * factor + 128 + brightness;
        
        // Clamp
        val = Math.min(255, Math.max(0, val));
        
        // Apply back to RGB
        data[i] = data[i + 1] = data[i + 2] = val;
      }
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.src = dataUrl;
  });
}
