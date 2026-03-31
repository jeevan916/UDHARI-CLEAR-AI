export const pushLog = (type: 'INFO' | 'ERR', ...args: any[]) => {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  const msg = args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ');
  console.log(`[${timestamp}] [${type}] ${msg}`);
};
