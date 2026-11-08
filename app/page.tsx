import { connection } from "next/server";
import { ChatPanel } from "@/components/chat/chat-panel";
import { StorefrontHero } from "@/components/storefront/hero";
import { isDemoMode } from "@/lib/demo/demo-mode";

export default async function Home() {
  // Read DEMO_MODE / OPENAI_API_KEY at request time, not at build time.
  await connection();

  return (
    <>
      <StorefrontHero />
      <ChatPanel demo={isDemoMode()} />
    </>
  );
}
