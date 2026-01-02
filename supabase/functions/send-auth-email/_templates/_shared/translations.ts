// Bilingual translations for FlyMusic auth emails
// EN/SV content with operator wording compliance

export type Locale = 'en' | 'sv';

export interface EmailTranslations {
  greeting: (name: string) => string;
  subject: string;
  body: string[];
  ctaLabel: string;
  backupText: string;
  safetyLine: string;
  footer: string;
  operatorText: string;
}

const operatorWording = {
  en: 'FlyMusic platform, operated by FlyMusic',
  sv: 'FlyMusic-plattformen, driven av FlyMusic',
};

export const translations: Record<string, Record<Locale, EmailTranslations>> = {
  PASSWORD_RECOVERY: {
    en: {
      greeting: (name: string) => `Hi ${name},`,
      subject: 'Reset Your FlyMusic Password',
      body: [
        'We received a request to reset your password.',
        'Click the button below to create a new password. This link will expire in 1 hour.',
      ],
      ctaLabel: 'Reset Password',
      backupText: 'Or copy and paste this link:',
      safetyLine: 'If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.',
      footer: '— The FlyMusic Team',
      operatorText: operatorWording.en,
    },
    sv: {
      greeting: (name: string) => `Hej ${name},`,
      subject: 'Återställ ditt FlyMusic-lösenord',
      body: [
        'Vi har mottagit en begäran om att återställa ditt lösenord.',
        'Klicka på knappen nedan för att skapa ett nytt lösenord. Länken är giltig i 1 timme.',
      ],
      ctaLabel: 'Återställ lösenord',
      backupText: 'Eller kopiera och klistra in denna länk:',
      safetyLine: 'Om du inte begärde att återställa ditt lösenord kan du ignorera detta e-postmeddelande. Ditt lösenord förblir oförändrat.',
      footer: '— FlyMusic-teamet',
      operatorText: operatorWording.sv,
    },
  },

  MAGIC_LINK: {
    en: {
      greeting: (name: string) => `Hi ${name},`,
      subject: 'Your FlyMusic Login Link',
      body: [
        'Click the button below to sign in to your FlyMusic account.',
        'This link will expire in 1 hour.',
      ],
      ctaLabel: 'Sign In to FlyMusic',
      backupText: 'Or copy and paste this link:',
      safetyLine: 'If you did not request this login link, you can safely ignore this email. Someone may have entered your email by mistake.',
      footer: '— The FlyMusic Team',
      operatorText: operatorWording.en,
    },
    sv: {
      greeting: (name: string) => `Hej ${name},`,
      subject: 'Din FlyMusic-inloggningslänk',
      body: [
        'Klicka på knappen nedan för att logga in på ditt FlyMusic-konto.',
        'Länken är giltig i 1 timme.',
      ],
      ctaLabel: 'Logga in på FlyMusic',
      backupText: 'Eller kopiera och klistra in denna länk:',
      safetyLine: 'Om du inte begärde denna inloggningslänk kan du ignorera detta e-postmeddelande. Någon kan ha angett din e-post av misstag.',
      footer: '— FlyMusic-teamet',
      operatorText: operatorWording.sv,
    },
  },

  EMAIL_VERIFY: {
    en: {
      greeting: (name: string) => `Hi ${name},`,
      subject: 'Welcome to FlyMusic - Confirm Your Email',
      body: [
        'Thanks for joining FlyMusic! We are excited to have you on board.',
        'Please confirm your email address to get started on your musical journey.',
      ],
      ctaLabel: 'Confirm Email',
      backupText: 'Or copy and paste this link:',
      safetyLine: 'If you did not create this account, you can safely ignore this email.',
      footer: '— The FlyMusic Team',
      operatorText: operatorWording.en,
    },
    sv: {
      greeting: (name: string) => `Hej ${name},`,
      subject: 'Välkommen till FlyMusic - Bekräfta din e-post',
      body: [
        'Tack för att du gick med i FlyMusic! Vi är glada att ha dig ombord.',
        'Bekräfta din e-postadress för att komma igång med din musikaliska resa.',
      ],
      ctaLabel: 'Bekräfta e-post',
      backupText: 'Eller kopiera och klistra in denna länk:',
      safetyLine: 'Om du inte skapade detta konto kan du ignorera detta e-postmeddelande.',
      footer: '— FlyMusic-teamet',
      operatorText: operatorWording.sv,
    },
  },

  EMAIL_CHANGE: {
    en: {
      greeting: (name: string) => `Hi ${name},`,
      subject: 'Confirm Your New Email Address',
      body: [
        'You requested to change your email address for your FlyMusic account.',
        'Click the button below to confirm this new email address.',
      ],
      ctaLabel: 'Confirm New Email',
      backupText: 'Or copy and paste this link:',
      safetyLine: 'If you did not request this change, please contact support immediately as someone may be trying to access your account.',
      footer: '— The FlyMusic Team',
      operatorText: operatorWording.en,
    },
    sv: {
      greeting: (name: string) => `Hej ${name},`,
      subject: 'Bekräfta din nya e-postadress',
      body: [
        'Du har begärt att ändra e-postadressen för ditt FlyMusic-konto.',
        'Klicka på knappen nedan för att bekräfta denna nya e-postadress.',
      ],
      ctaLabel: 'Bekräfta ny e-post',
      backupText: 'Eller kopiera och klistra in denna länk:',
      safetyLine: 'Om du inte begärde denna ändring, kontakta support omedelbart då någon kan försöka få tillgång till ditt konto.',
      footer: '— FlyMusic-teamet',
      operatorText: operatorWording.sv,
    },
  },

  PASSWORD_CHANGED: {
    en: {
      greeting: (name: string) => `Hi ${name},`,
      subject: 'Your FlyMusic Password Was Changed',
      body: [
        'Your FlyMusic password was successfully changed.',
        'You can now use your new password to sign in to your account.',
      ],
      ctaLabel: 'Sign In',
      backupText: '',
      safetyLine: 'If you did not make this change, please reset your password immediately and contact support.',
      footer: '— The FlyMusic Team',
      operatorText: operatorWording.en,
    },
    sv: {
      greeting: (name: string) => `Hej ${name},`,
      subject: 'Ditt FlyMusic-lösenord har ändrats',
      body: [
        'Ditt FlyMusic-lösenord har ändrats framgångsrikt.',
        'Du kan nu använda ditt nya lösenord för att logga in på ditt konto.',
      ],
      ctaLabel: 'Logga in',
      backupText: '',
      safetyLine: 'Om du inte gjorde denna ändring, återställ ditt lösenord omedelbart och kontakta support.',
      footer: '— FlyMusic-teamet',
      operatorText: operatorWording.sv,
    },
  },

  INVITE: {
    en: {
      greeting: (name: string) => `Hi ${name},`,
      subject: 'You\'re Invited to FlyMusic Beta',
      body: [
        'You\'ve been invited to join FlyMusic Beta!',
        'Use the code below or click the button to claim your spot.',
      ],
      ctaLabel: 'Accept Invitation',
      backupText: 'Your invite code:',
      safetyLine: 'If you did not request this invitation, you can safely ignore this email.',
      footer: '— The FlyMusic Team',
      operatorText: operatorWording.en,
    },
    sv: {
      greeting: (name: string) => `Hej ${name},`,
      subject: 'Du är inbjuden till FlyMusic Beta',
      body: [
        'Du har blivit inbjuden att gå med i FlyMusic Beta!',
        'Använd koden nedan eller klicka på knappen för att ta din plats.',
      ],
      ctaLabel: 'Acceptera inbjudan',
      backupText: 'Din inbjudningskod:',
      safetyLine: 'Om du inte begärde denna inbjudan kan du ignorera detta e-postmeddelande.',
      footer: '— FlyMusic-teamet',
      operatorText: operatorWording.sv,
    },
  },
};

export function getTranslation(eventType: string, locale: Locale): EmailTranslations {
  const eventTranslations = translations[eventType];
  if (!eventTranslations) {
    // Fallback to EMAIL_VERIFY as default
    return translations.EMAIL_VERIFY[locale];
  }
  return eventTranslations[locale] || eventTranslations.en;
}

export function generatePlainText(
  eventType: string,
  locale: Locale,
  userName: string,
  confirmationUrl?: string,
  code?: string
): string {
  const t = getTranslation(eventType, locale);
  
  let text = `FlyMusic\n========\n\n`;
  text += `${t.greeting(userName)}\n\n`;
  text += t.body.join('\n') + '\n\n';
  
  if (confirmationUrl && t.ctaLabel) {
    text += `${t.ctaLabel}: ${confirmationUrl}\n\n`;
  }
  
  if (code && t.backupText) {
    text += `${t.backupText} ${code}\n\n`;
  }
  
  text += `${t.safetyLine}\n\n`;
  text += `---\n${t.operatorText}\n`;
  text += t.footer;
  
  return text;
}
