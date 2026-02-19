import { NavBar } from "@/components/NavBar";
import { HeroSection } from "@/components/HeroSection";
import { QuietQuestionsSection } from "@/components/QuietQuestionsSection";
import { SocialProofBar } from "@/components/SocialProofBar";
import { ReflectionEngineSection } from "@/components/ReflectionEngineSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { PrivacySection } from "@/components/PrivacySection";
import { FooterSection } from "@/components/FooterSection";
import { Toaster } from "@/components/ui/toaster";

const Index = () => {
  return (
    <main>
      <NavBar />
      <HeroSection />
      <QuietQuestionsSection />
      <SocialProofBar />
      <ReflectionEngineSection />
      <HowItWorksSection />
      <PrivacySection />
      <FooterSection />
      <Toaster />
    </main>
  );
};

export default Index;
