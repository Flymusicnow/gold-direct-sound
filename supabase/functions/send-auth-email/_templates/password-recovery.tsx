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

interface PasswordRecoveryEmailProps {
  userName: string;
  resetUrl: string;
  token: string;
}

export const PasswordRecoveryEmail = ({ userName, resetUrl, token }: PasswordRecoveryEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset your FlyMusic password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Text style={logo}>🎵 FlyMusic</Text>
        </Section>
        
        <Section style={iconSection}>
          <Text style={lockIcon}>🔐</Text>
        </Section>
        
        <Heading style={h1}>Reset Your Password</Heading>
        
        <Text style={text}>
          Hi {userName},
        </Text>
        
        <Text style={text}>
          We received a request to reset your password for your FlyMusic account. Click the button below to set a new password.
        </Text>
        
        <Section style={buttonContainer}>
          <Button style={button} href={resetUrl}>
            Reset Password
          </Button>
        </Section>
        
        <Text style={codeText}>
          Or use this reset code:
        </Text>
        <Text style={code}>{token}</Text>
        
        <Section style={warningBox}>
          <Text style={warningTitle}>⏰ This link expires in 1 hour</Text>
          <Text style={warningText}>
            If you did not request a password reset, please ignore this email. Your password will remain unchanged.
          </Text>
        </Section>
        
        <Section style={footer}>
          <Text style={footerBrand}>— The FlyMusic Team</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default PasswordRecoveryEmail;

const main = {
  backgroundColor: "#0a0a0a",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: "#141414",
  margin: "0 auto",
  padding: "40px 20px",
  borderRadius: "12px",
  maxWidth: "560px",
};

const logoSection = {
  textAlign: "center" as const,
  marginBottom: "16px",
};

const logo = {
  fontSize: "28px",
  fontWeight: "bold",
  color: "#E8BF1A",
  margin: "0",
};

const iconSection = {
  textAlign: "center" as const,
  marginBottom: "16px",
};

const lockIcon = {
  fontSize: "48px",
  margin: "0",
};

const h1 = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "0 0 24px",
};

const text = {
  color: "#d4d4d4",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#E8BF1A",
  borderRadius: "8px",
  color: "#0a0a0a",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
};

const codeText = {
  color: "#a3a3a3",
  fontSize: "14px",
  textAlign: "center" as const,
  margin: "24px 0 8px",
};

const code = {
  backgroundColor: "#262626",
  borderRadius: "8px",
  color: "#E8BF1A",
  fontSize: "24px",
  fontFamily: "monospace",
  fontWeight: "bold",
  letterSpacing: "4px",
  padding: "16px",
  textAlign: "center" as const,
  display: "block",
  margin: "0 0 24px",
};

const warningBox = {
  backgroundColor: "#1c1917",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 0 0",
  border: "1px solid #292524",
};

const warningTitle = {
  color: "#fbbf24",
  fontSize: "14px",
  fontWeight: "bold",
  margin: "0 0 8px",
  textAlign: "center" as const,
};

const warningText = {
  color: "#a3a3a3",
  fontSize: "13px",
  textAlign: "center" as const,
  margin: "0",
  lineHeight: "20px",
};

const footer = {
  borderTop: "1px solid #262626",
  marginTop: "32px",
  paddingTop: "24px",
  textAlign: "center" as const,
};

const footerBrand = {
  color: "#a3a3a3",
  fontSize: "14px",
  margin: "0",
};
