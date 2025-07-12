import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const faqs = [
    {
        question: "How do I place an order?",
        answer: "To place an order, simply browse our products, add items to your cart, and proceed to checkout. Follow the on-screen instructions to enter your shipping and payment information."
    },
    {
        question: "What are your shipping options?",
        answer: "We offer standard and express shipping. Standard shipping usually takes 5-7 business days, while express shipping takes 2-3 business days. Shipping costs are calculated at checkout."
    },
    {
        question: "What is your return policy?",
        answer: "We accept returns within 30 days of purchase. The item must be unused and in its original packaging. To initiate a return, please contact our support team through the contact form on this page."
    },
    {
        question: "How can I track my order?",
        answer: "Once your order has shipped, you will receive an email with a tracking number. You can use this number on the carrier's website to track your package's progress."
    },
    {
        question: "Do you offer customer support?",
        answer: "Yes, our customer support team is available 24/7. You can reach us via the contact form, email, or by using our AI chat assistant for immediate help."
    }
]

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Help & Support</h1>
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem value={`item-${index}`} key={index}>
                <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                <AccordionContent>
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
