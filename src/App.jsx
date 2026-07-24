import { useState } from "react";
import CRTBootAnimation from "./CRTBootAnimation.jsx";
import CRTOverlay from "./CRTOverlay.jsx";
import HeroSection from "./HeroSection.jsx";
import AboutSection from "./AboutSection.jsx";
import SkillsSection from "./SkillsSection.jsx";
import ProjectsSection from "./ProjectsSection.jsx";
import { OSProvider } from "./OSContext.jsx";
import FixedComponents from "./FixedComponents.jsx";
import JourneySection from "./JourneySection.jsx";
import AskShreySection from "./AskShreySection.jsx";
import ContactSection from "./ContactSection.jsx";

export default function App() {
  const [bootDone, setBootDone] = useState(false);

  return (
    <>
      {!bootDone && (
        <div style={{ position: "fixed", inset: 0 }}>
          <CRTBootAnimation onComplete={() => setBootDone(true)} />
        </div>
      )}

      {bootDone && (
        <OSProvider>
          <FixedComponents>
            <HeroSection />
            <AboutSection />
            <SkillsSection />
            <ProjectsSection />
            <JourneySection />
            <AskShreySection />
            <ContactSection />
          </FixedComponents>
        </OSProvider>
      )}

      <CRTOverlay />
    </>
  );
}