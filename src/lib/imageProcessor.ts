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

      // Simple contrast/brightness adjustment
      const factor = 1.2; // Contrast factor
      const brightness = 20; // Brightness offset

      for (let i = 0; i < data.length; i += 4) {
        for (let j = 0; j < 3; j++) {
          let val = data[i + j];
          // Apply contrast
          val = (val - 128) * factor + 128;
          // Apply brightness
          val += brightness;
          // Clamp
          data[i + j] = Math.min(255, Math.max(0, val));
        }
      }
      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.src = dataUrl;
  });
}
