import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PenSquare, Sparkles, Globe, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 py-24 md:py-32 text-center">
        <div className="max-w-3xl space-y-6">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl lg:text-6xl">
            Write. Publish.{" "}
            <span className="text-primary">Share Ideas.</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Veltri is a modern note publishing platform with AI-powered content
            enhancements. Write beautifully, get instant feedback, and share your
            knowledge with the world.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="gap-2 w-full sm:w-auto">
                <PenSquare className="h-5 w-5" />
                Start Writing — It&apos;s Free
              </Button>
            </Link>
            <Link href="/explore">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 w-full sm:w-auto"
              >
                <Globe className="h-5 w-5" />
                Explore Notes
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t bg-muted/40 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Powered by AI, Built for Writers
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center text-center space-y-3 p-6">
              <div className="rounded-full bg-primary/10 p-3">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">AI Auto-Summary</h3>
              <p className="text-muted-foreground">
                Generate concise summaries for your notes automatically. Perfect
                for SEO and quick previews.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-3 p-6">
              <div className="rounded-full bg-primary/10 p-3">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Content Validation</h3>
              <p className="text-muted-foreground">
                Get instant feedback on grammar, clarity, and content quality
                powered by local AI.
              </p>
            </div>
            <div className="flex flex-col items-center text-center space-y-3 p-6">
              <div className="rounded-full bg-primary/10 p-3">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Publish & Share</h3>
              <p className="text-muted-foreground">
                One-click publishing with beautiful public URLs. Share your
                knowledge with the world.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
