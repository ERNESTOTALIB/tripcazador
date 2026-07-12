// Sentry stub - removido del bundle para Worker <3MiB en plan gratis Cloudflare. API intacta, no-op. Restaurable desde .bak/git.
export interface RevenueErrorContext { module: string; code: string; extra?: any; level?: string; }
export function captureRevenueError(_err: unknown, _ctx: RevenueErrorContext): void {}
export function captureRevenueMessage(_message: string, _ctx: RevenueErrorContext): void {}