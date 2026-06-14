export function startKeepAlive() {
  if (typeof window === 'undefined') return;
  
  setInterval(async () => {
    try {
      await fetch(process.env.NEXT_PUBLIC_API_URL + '/health');
    } catch (e) {
      // Ignore errors for background keepalive
    }
  }, 4 * 60 * 1000); // 4 minutes
}
