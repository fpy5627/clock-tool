export default function TableItemImage({
  value,
  options,
  className,
}: {
  value: string;
  options?: any;
  className?: string;
}) {
  // Extract filename from URL for better alt text
  const getAltText = (url: string) => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const filename = pathname.split('/').pop() || '';
      // Remove file extension and decode
      const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
      return nameWithoutExt || 'Image';
    } catch {
      // If URL parsing fails, try to extract from string
      const parts = url.split('/');
      const filename = parts[parts.length - 1] || '';
      const nameWithoutExt = filename.replace(/\.[^/.]+$/, '');
      return nameWithoutExt || 'Image';
    }
  };

  return (
    <img
      src={value}
      alt={options?.alt || getAltText(value)}
      className={`w-10 h-10 rounded-full ${className}`}
    />
  );
}
