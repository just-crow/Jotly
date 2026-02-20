import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function TermsPage() {
  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Terms of Service</CardTitle>
          <p className="text-muted-foreground">Last updated: February 19, 2026</p>
        </CardHeader>
        <CardContent className="prose dark:prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Veltri (&quot;the Service&quot;), you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-2">2. User Accounts</h2>
            <p>
              You are responsible for maintaining the security of your account and password. You agree to accept responsibility for all activities that occur under your account. We reserve the right to terminate accounts that violate these terms.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-2">3. Content and Conduct</h2>
            <p>
              Users retain ownership of the content they create and upload (&quot;Notes&quot;). By publishing content on Veltri, you grant us a license to host, display, and distribute your content.
            </p>
            <p className="mt-2">
              You agree not to upload content that is illegal, offensive, infringing on intellectual property rights, or otherwise harmful. We reserve the right to remove any content at our discretion.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-2">4. Marketplace & Commissions</h2>
            <div className="bg-muted p-4 rounded-md border border-l-4 border-l-primary">
              <h3 className="font-bold mb-1">Platform Fee</h3>
              <p>
                Veltri charges a <strong>30% platform fee</strong> on all transactions made through the marketplace. Publishers receive <strong>70%</strong> of the final sale price (after any applicable taxes).
              </p>
            </div>
            <p className="mt-2">
              Prices are set by the publishers. Payments are processed securely via our third-party payment providers. Refunds are handled on a case-by-case basis in accordance with our Refund Policy.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-2">5. Intellectual Property (DMCA)</h2>
            <p>
              We respect the intellectual property rights of others. If you believe your work has been copied in a way that constitutes copyright infringement, please contact our designated Copyright Agent at support@veltri.com.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-xl font-semibold mb-2">6. Limitation of Liability</h2>
            <p>
              The Service is provided &quot;as is&quot; without warranties of any kind. Veltri shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service.
            </p>
          </section>

          <div className="pt-6 text-center text-sm text-muted-foreground">
            <p>Questions? Contact us at support@veltri.com</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
