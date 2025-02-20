export function bytesToGB(bytes): string {
  return (bytes / (1024 ** 3)).toFixed(2);
}