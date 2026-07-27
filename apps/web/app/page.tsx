import Navbar from "@/components/layout/navbar";
import Hero from "@/components/sections/hero";
import ArchSpecs from "@/components/sections/arch-specs";
import HowItWorks from "@/components/sections/how-it-works";
import Footer from "@/components/layout/footer";

export default function Home() {
  return (
    <main className="bg-black">
      <Navbar />
      <Hero />
      <ArchSpecs />
      <HowItWorks />
      <Footer />
    </main>
  );
}
