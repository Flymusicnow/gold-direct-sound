import {
  Body,
  Button,
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

interface InviteEmailProps {
  userName: string;
  confirmationUrl: string;
  inviteCode: string;
  locale: Locale;
}

export const InviteEmail = ({ 
  userName, 
  confirmationUrl,
  inviteCode,
  locale = 'en' 
}: InviteEmailProps) => {
  const t = getTranslation('INVITE', locale);
  
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
          
          {t.body.map((paragraph, index) => (
            <Text key={index} style={styles.text}>{paragraph}</Text>
          ))}
          
          <Section style={styles.buttonContainer}>
            <Button style={styles.button} href={confirmationUrl}>
              {t.ctaLabel}
            </Button>
          </Section>
          
          <Text style={styles.linkText}>{t.backupText}</Text>
          <Text style={styles.code}>{inviteCode}</Text>
          
          <Text style={styles.warningText}>{t.safetyLine}</Text>
          
          <Section style={styles.footer}>
            <Text style={styles.footerText}>{t.operatorText}</Text>
            <Text style={styles.footerBrand}>{t.footer}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default InviteEmail;
