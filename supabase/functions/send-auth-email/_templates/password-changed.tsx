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

interface PasswordChangedEmailProps {
  userName: string;
}

export const PasswordChangedEmail = ({ userName }: PasswordChangedEmailProps) => (
  <Html>
    <Head />
    <Preview>Your FlyMusic password has been changed</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Text style={logo}>🎵 FlyMusic</Text>
        </Section>
        
        <Section style={iconSection}>
          <Text style={checkIcon}>✅</Text>
        </Section>
        
        <Heading style={h1}>Password Changed Successfully</Heading>
        
        <Text style={text}>
          Hi {userName},
        </Text>
        
        <Text style={text}>
          Your FlyMusic password was successfully changed. You can now use your new password to sign in to your account.
        </Text>
        
        <Section style={infoBox}>
          <Text style={infoTitle}>🕐 When did this happen?</Text>
          <Text style={infoText}>
            This change was made just now. If you made this change, no further action is needed.
          </Text>
        </Section>
        
        <Section style={warningBox}>
          <Text style={warningTitle}>🚨 Did not make this change?</Text>
          <Text style={warningText}>
            If you did not change your password, your account may have been compromised. Please reset your password immediately and contact our support team.
          </Text>
        </Section>
        
        <Section style={footer}>
          <Text style={footerBrand}>— The FlyMusic Team</Text>
          <Text style={footerSupport}>
            Need help? Contact us at support@flymusic.se
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default PasswordChangedEmail;

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

const checkIcon = {
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

const infoBox = {
  backgroundColor: "#0c2d1c",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 0",
  border: "1px solid #166534",
};

const infoTitle = {
  color: "#4ade80",
  fontSize: "14px",
  fontWeight: "bold",
  margin: "0 0 8px",
};

const infoText = {
  color: "#a7f3d0",
  fontSize: "13px",
  margin: "0",
  lineHeight: "20px",
};

const warningBox = {
  backgroundColor: "#1c1917",
  borderRadius: "8px",
  padding: "16px",
  margin: "0",
  border: "1px solid #292524",
};

const warningTitle = {
  color: "#ef4444",
  fontSize: "14px",
  fontWeight: "bold",
  margin: "0 0 8px",
};

const warningText = {
  color: "#a3a3a3",
  fontSize: "13px",
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
  margin: "0 0 8px",
};

const footerSupport = {
  color: "#737373",
  fontSize: "12px",
  margin: "0",
};
