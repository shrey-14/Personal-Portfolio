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
import PixelBuddy from "./PixelBuddy.jsx";
import ErrorBoundary from "./ErrorBoundary.jsx";

export default function App() {
  const [bootDone, setBootDone] = useState(false);

  const onBootComplete = () => {
    setBootDone(true);
    /* Hash-nav so /#projects, /#contact etc. land at the right section after
       the boot completes. Deferred one tick so React commits sections first. */
    if (window.location.hash) {
      requestAnimationFrame(() => {
        const el = document.getElementById(window.location.hash.slice(1));
        if (el) el.scrollIntoView({ behavior: 'auto', block: 'start' });
      });
    }
  };

  return (
    <ErrorBoundary>
      {!bootDone && (
        <div style={{ position: "fixed", inset: 0 }}>
          <CRTBootAnimation onComplete={onBootComplete} />
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
            <PixelBuddy />
          </FixedComponents>
        </OSProvider>
      )}

      <CRTOverlay />
    </ErrorBoundary>
  );
}
