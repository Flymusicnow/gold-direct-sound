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

interface MagicLinkEmailProps {
  userName: string;
  loginUrl: string;
  token: string;
}

export const MagicLinkEmail = ({ userName, loginUrl, token }: MagicLinkEmailProps) => (
  <Html>
    <Head />
    <Preview>Your FlyMusic login link is ready</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Text style={logo}>🎵 FlyMusic</Text>
        </Section>
        
        <Heading style={h1}>Sign In to FlyMusic</Heading>
        
        <Text style={text}>
          Hi {userName},
        </Text>
        
        <Text style={text}>
          Click the button below to sign in to your FlyMusic account. This link will expire in 1 hour.
        </Text>
        
        <Section style={buttonContainer}>
          <Button style={button} href={loginUrl}>
            Sign In to FlyMusic
          </Button>
        </Section>
        
        <Text style={codeText}>
          Or use this login code:
        </Text>
        <Text style={code}>{token}</Text>
        
        <Text style={warningText}>
          If you did not request this login link, you can safely ignore this email. Someone may have entered your email by mistake.
        </Text>
        
        <Section style={footer}>
          <Text style={footerBrand}>— The FlyMusic Team</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default MagicLinkEmail;

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
  marginBottom: "24px",
};

const logo = {
  fontSize: "28px",
  fontWeight: "bold",
  color: "#E8BF1A",
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

const warningText = {
  color: "#737373",
  fontSize: "14px",
  textAlign: "center" as const,
  margin: "24px 0 0",
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
