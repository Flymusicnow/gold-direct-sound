// Shared email styles for FlyMusic branded emails
// Consistent branding across all templates

export const colors = {
  background: '#0a0a0a',
  containerBg: '#141414',
  primary: '#E8BF1A',
  textPrimary: '#ffffff',
  textSecondary: '#d4d4d4',
  textMuted: '#a3a3a3',
  textFaint: '#737373',
  border: '#262626',
  codeBg: '#262626',
};

export const main = {
  backgroundColor: colors.background,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

export const container = {
  backgroundColor: colors.containerBg,
  margin: '0 auto',
  padding: '40px 20px',
  borderRadius: '12px',
  maxWidth: '560px',
};

export const logoSection = {
  textAlign: 'center' as const,
  marginBottom: '24px',
};

export const logo = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: colors.primary,
  margin: '0',
};

export const h1 = {
  color: colors.textPrimary,
  fontSize: '24px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '0 0 24px',
};

export const text = {
  color: colors.textSecondary,
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
};

export const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
};

export const button = {
  backgroundColor: colors.primary,
  borderRadius: '8px',
  color: colors.background,
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '14px 32px',
};

export const linkText = {
  color: colors.textMuted,
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '24px 0 8px',
};

export const linkUrl = {
  color: colors.primary,
  fontSize: '12px',
  wordBreak: 'break-all' as const,
  textAlign: 'center' as const,
  display: 'block',
  margin: '0 0 24px',
};

export const code = {
  backgroundColor: colors.codeBg,
  borderRadius: '8px',
  color: colors.primary,
  fontSize: '24px',
  fontFamily: 'monospace',
  fontWeight: 'bold',
  letterSpacing: '4px',
  padding: '16px',
  textAlign: 'center' as const,
  display: 'block',
  margin: '0 0 24px',
};

export const warningText = {
  color: colors.textFaint,
  fontSize: '14px',
  textAlign: 'center' as const,
  margin: '24px 0 0',
};

export const infoBox = {
  backgroundColor: colors.codeBg,
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
};

export const warningBox = {
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
};

export const footer = {
  borderTop: `1px solid ${colors.border}`,
  marginTop: '32px',
  paddingTop: '24px',
  textAlign: 'center' as const,
};

export const footerText = {
  color: colors.textFaint,
  fontSize: '12px',
  margin: '0 0 8px',
};

export const footerBrand = {
  color: colors.textMuted,
  fontSize: '14px',
  margin: '0',
};
