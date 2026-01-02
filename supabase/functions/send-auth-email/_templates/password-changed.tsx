import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "https://esm.sh/@react-email/components@0.0.22";
import React from "https://esm.sh/react@18.3.1";
import { type Locale, getTranslation } from "./_shared/translations.ts";
import * as styles from "./_shared/styles.ts";

interface PasswordChangedEmailProps {
  userName: string;
  locale: Locale;
}

export const PasswordChangedEmail = ({ 
  userName, 
  locale = 'en' 
}: PasswordChangedEmailProps) => {
  const t = getTranslation('PASSWORD_CHANGED', locale);
  
  return (
    <Html>
      <Head />
      <Preview>{t.subject}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Section style={styles.logoSection}>
            <Text style={styles.logo}>🎵 FlyMusic</Text>
          </Section>
          
          <Heading style={styles.h1}>{t.subject}</Heading>
          
          <Text style={styles.text}>{t.greeting(userName)}</Text>
          
          <Section style={styles.infoBox}>
            {t.body.map((paragraph, index) => (
              <Text key={index} style={{ ...styles.text, margin: index === t.body.length - 1 ? 0 : '0 0 8px' }}>
                ✓ {paragraph}
              </Text>
            ))}
          </Section>
          
          <Section style={styles.warningBox}>
            <Text style={{ ...styles.text, color: '#ef4444', margin: 0 }}>
              ⚠️ {t.safetyLine}
            </Text>
          </Section>
          
          <Section style={styles.footer}>
            <Text style={styles.footerText}>{t.operatorText}</Text>
            <Text style={styles.footerBrand}>{t.footer}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default PasswordChangedEmail;
