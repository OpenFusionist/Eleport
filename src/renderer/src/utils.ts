export function bytesToGB(bytes): string {
  return (bytes / (1024 ** 3)).toFixed(2);
}

export function wait(ms): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}