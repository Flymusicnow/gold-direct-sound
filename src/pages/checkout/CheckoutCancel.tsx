import { useNavigate } from "react-router-dom";
import { XCircle, ArrowLeft, HelpCircle, CreditCard, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  {
    question: "Why was my payment declined?",
    answer: "Common reasons include insufficient funds, expired card, or bank security blocks. Try using a different card or contact your bank."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, American Express) through Stripe. All payments are processed securely."
  },
  {
    question: "Can I pay with PayPal?",
    answer: "Currently we only accept credit/debit cards. We're working on adding more payment options in the future."
  },
  {
    question: "Is my payment information secure?",
    answer: "Absolutely. All payments are processed through Stripe with bank-level encryption. We never store your card details."
  }
];

export default function CheckoutCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-lg w-full space-y-8">
        {/* Cancel Icon */}
        <div className="text-center">
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
            <XCircle className="w-10 h-10 text-muted-foreground" />
          </div>
        </div>

        {/* Message */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Checkout Cancelled</h1>
          <p className="text-muted-foreground">
            No worries – your card wasn't charged. Take your time and come back when you're ready.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button 
            onClick={() => navigate('/pricing')} 
            className="flex-1"
            variant="default"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button 
            onClick={() => navigate(-1)} 
            variant="outline"
            className="flex-1"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>

        {/* Help Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-primary" />
              Having trouble?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
              <CreditCard className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Check your card details</p>
                <p className="text-muted-foreground">
                  Ensure your card number, expiry date, and CVV are correct.
                </p>
              </div>
            </div>
            
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`item-${i}`}>
                  <AccordionTrigger className="text-sm text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <p className="text-center text-sm text-muted-foreground">
          Still having issues?{" "}
          <a href="mailto:support@flymusic.se" className="text-primary hover:underline">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
