import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Privacy Policy</CardTitle>
          <p className="text-muted-foreground">Last updated: February 19, 2026</p>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us, such as when you create an account, purchase a note, or contact support. This may include:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Contact information (email address, username)</li>
              <li>Account credentials</li>
              <li>Transaction data (purchase history, sales data)</li>
              <li>User-generated content (notes, comments)</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-2">2. How We Use Your Information</h2>
            <p>
              We use the collected information to:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send administrative messages, security alerts, and support updates</li>
              <li>Monitor and analyze trends and usage</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Data Storage & Security</h2>
            <p>
              We use <strong>Supabase</strong> to securely store your data. While we implement safeguards to protect your information, no transmission of data over the Internet is 100% secure.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Third-Party Services</h2>
            <p>
              We may share data with third-party vendors for specific purposes:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Payment Processors (e.g., Stripe) for handling financial transactions. We do not store your full credit card information.</li>
              <li>AI Providers (e.g., OpenAI, Puter.js) for content enhancement features.</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Your Rights</h2>
            <p>
              You have the right to access, correct, or delete your personal information. You can manage your account settings directly within the application or contact us for assistance.
            </p>
          </section>

          <div className="pt-6 text-center text-sm text-muted-foreground">
            <p>Questions about privacy? Contact us at privacy@jotly.com</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
