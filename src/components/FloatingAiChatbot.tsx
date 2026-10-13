import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

// Exact vector paths extracted directly from the reference character logo
const LEFT_EYE_PATH =
  "M -12.47 -6.82 C -11.91 -6.86, -11.47 -6.79, -10.92 -6.60 C -10.36 -6.42, -9.66 -6.16, -9.14 -5.71 C -8.62 -5.27, -8.18 -4.53, -7.81 -3.94 C -7.44 -3.35, -7.22 -2.76, -6.92 -2.16 C -6.63 -1.57, -6.29 -0.98, -6.04 -0.39 C -5.78 0.20, -5.63 0.79, -5.37 1.38 C -5.11 1.98, -4.74 2.57, -4.48 3.16 C -4.22 3.75, -3.96 4.34, -3.82 4.93 C -3.67 5.53, -3.60 6.12, -3.60 6.71 C -3.60 7.30, -3.52 7.93, -3.82 8.48 C -4.11 9.04, -4.82 9.70, -5.37 10.04 C -5.92 10.37, -6.59 10.44, -7.14 10.48 C -7.70 10.52, -8.14 10.44, -8.70 10.26 C -9.25 10.07, -9.99 9.81, -10.47 9.37 C -10.95 8.93, -11.25 8.19, -11.58 7.60 C -11.91 7.00, -12.21 6.41, -12.47 5.82 C -12.73 5.23, -12.91 4.64, -13.13 4.05 C -13.36 3.46, -13.54 2.86, -13.80 2.27 C -14.06 1.68, -14.39 1.09, -14.69 0.50 C -14.98 -0.09, -15.35 -0.69, -15.57 -1.28 C -15.80 -1.87, -15.98 -2.46, -16.02 -3.05 C -16.05 -3.64, -16.09 -4.27, -15.80 -4.83 C -15.50 -5.38, -14.80 -6.05, -14.24 -6.38 C -13.69 -6.71, -13.02 -6.79, -12.47 -6.82 Z";

const RIGHT_EYE_PATH =
  "M 6.17 -10.37 C 6.61 -10.59, 7.16 -10.33, 7.72 -10.15 C 8.27 -9.97, 8.90 -9.71, 9.49 -9.26 C 10.08 -8.82, 10.82 -8.08, 11.27 -7.49 C 11.71 -6.90, 11.86 -6.30, 12.15 -5.71 C 12.45 -5.12, 12.78 -4.49, 13.04 -3.94 C 13.30 -3.38, 13.45 -2.94, 13.71 -2.39 C 13.97 -1.83, 14.34 -1.20, 14.59 -0.61 C 14.85 -0.02, 15.07 0.57, 15.26 1.16 C 15.44 1.75, 15.59 2.35, 15.70 2.94 C 15.81 3.53, 16.07 4.12, 15.93 4.71 C 15.78 5.30, 15.26 6.23, 14.82 6.49 C 14.37 6.75, 13.82 6.49, 13.26 6.26 C 12.71 6.04, 12.01 5.64, 11.49 5.16 C 10.97 4.68, 10.49 3.97, 10.16 3.38 C 9.83 2.79, 9.71 2.20, 9.49 1.61 C 9.27 1.02, 9.05 0.39, 8.83 -0.17 C 8.61 -0.72, 8.38 -1.17, 8.16 -1.72 C 7.94 -2.28, 7.75 -2.90, 7.50 -3.50 C 7.24 -4.09, 6.90 -4.68, 6.61 -5.27 C 6.31 -5.86, 5.98 -6.45, 5.72 -7.04 C 5.46 -7.64, 4.98 -8.26, 5.06 -8.82 C 5.13 -9.37, 5.72 -10.15, 6.17 -10.37 Z";

export function FloatingAiChatbot() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  // Do not show floating button if user is already on the dedicated /ai planner page
  if (currentPath === "/ai" || currentPath.startsWith("/ai/")) {
    return null;
  }

  return <EyeTrackingBotButton />;
}

function EyeTrackingBotButton() {
  const buttonRef = useRef<HTMLAnchorElement>(null);

  // The signature resting position matching the user's reference logo
  // Ball center is (50, 50). Eyes group resting center is (69.79, 28.43).
  // Offset relative to ball center: (+19.79, -21.57)
  const REST_OFFSET = { x: 19.79, y: -21.57 };

  const [eyeOffset, setEyeOffset] = useState(REST_OFFSET);
  const [isTracking, setIsTracking] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    let animationFrameId: number;
    let targetX = REST_OFFSET.x;
    let targetY = REST_OFFSET.y;
    let currentX = REST_OFFSET.x;
    let currentY = REST_OFFSET.y;
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    const handleMouseMove = (e: MouseEvent) => {
      if (!buttonRef.current) return;
      const rect = buttonRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const distance = Math.hypot(dx, dy);

      setIsTracking(true);

      if (distance < 6) {
        // Cursor is directly over the character - look straight ahead / forward
        targetX = 0;
        targetY = 0;
      } else {
        const angle = Math.atan2(dy, dx);
        // Maximum displacement from center of ball in viewBox units
        // With max radius 21, the eyes move smoothly around the ball surface without clipping
        const maxTravel = 21;
        // Smooth responsive intensity ramping
        const intensity = Math.min(distance / 200, 1);
        targetX = Math.cos(angle) * maxTravel * intensity;
        targetY = Math.sin(angle) * maxTravel * intensity;
      }

      // If the user's cursor stops moving for 2.6s, smoothly glide back to the iconic resting pose
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setIsTracking(false);
        targetX = REST_OFFSET.x;
        targetY = REST_OFFSET.y;
      }, 2600);
    };

    const handleMouseLeave = () => {
      setIsTracking(false);
      targetX = REST_OFFSET.x;
      targetY = REST_OFFSET.y;
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    document.addEventListener("mouseleave", handleMouseLeave);

    // Smooth lerp loop with organic damping (0.12)
    const animate = () => {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      setEyeOffset({ x: currentX, y: currentY });
      animationFrameId = requestAnimationFrame(animate);
    };
    animationFrameId = requestAnimationFrame(animate);

    // Organic blink animation every ~4.5s
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 130);
    }, 4500);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
      clearInterval(blinkInterval);
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, []);

  const [isHovered, setIsHovered] = useState(false);

  return (
    <>
      {/* Auto-Adapting Inverse Contrast Character Button */}
      <div className="fixed bottom-6 right-6 z-50 select-none font-sans mix-blend-difference">
        <Link
          to="/ai"
          search={{ chatId: Date.now() }}
          ref={buttonRef}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="group relative flex h-16 w-16 items-center justify-center rounded-full transition-transform duration-300 hover:scale-110 active:scale-95 focus:outline-none"
          aria-label="Open Qarwaan AI Travel Studio"
        >
          {/* High-Contrast Base Sphere (White body, Black eyes) */}
          <div className="relative h-full w-full overflow-hidden rounded-full bg-white">
            <svg
              viewBox="0 0 100 100"
              className="h-full w-full"
              style={{ overflow: "hidden" }}
            >
              {/* White Sphere Body: inverts to Black on light backgrounds, White on dark backgrounds */}
              <circle cx="50" cy="50" r="50" fill="#ffffff" />

              {/* Eye Tracking Group */}
              <g transform={`translate(${50 + eyeOffset.x}, ${50 + eyeOffset.y})`}>
                <g
                  transform={`scale(1, ${isBlinking ? 0.15 : 1})`}
                  style={{
                    transition: "transform 0.1s ease-in-out",
                    transformOrigin: "0px 0px",
                  }}
                >
                  {/* 1. Signature Resting Logo Eyes (inverts to white on light bg, black on dark bg) */}
                  <g
                    style={{
                      opacity: isTracking ? 0 : 1,
                      transition: "opacity 0.22s ease-in-out",
                    }}
                  >
                    <g transform="translate(-0.8, 0)">
                      <path d={LEFT_EYE_PATH} fill="#000000" />
                    </g>
                    <g transform="translate(0.8, 0)">
                      <path d={RIGHT_EYE_PATH} fill="#000000" />
                    </g>
                  </g>

                  {/* 2. Cursor Follow Eyes (Vertically straight, identical size) */}
                  <g
                    style={{
                      opacity: isTracking ? 1 : 0,
                      transition: "opacity 0.22s ease-in-out",
                    }}
                  >
                    {/* Left Eye: vertically straight pill */}
                    <rect
                      x="-12.4"
                      y="-8"
                      width="7.2"
                      height="16"
                      rx="3.6"
                      fill="#000000"
                    />
                    {/* Right Eye: identical vertically straight pill */}
                    <rect
                      x="5.2"
                      y="-8"
                      width="7.2"
                      height="16"
                      rx="3.6"
                      fill="#000000"
                    />
                  </g>
                </g>
              </g>
            </svg>
          </div>
        </Link>
      </div>

      {/* Elegant Tooltip on Hover (unaffected by mix-blend-mode) */}
      <div
        className={`pointer-events-none fixed bottom-[90px] right-6 z-50 whitespace-nowrap rounded-xl bg-[#004643] px-3 py-1.5 text-xs font-semibold text-white shadow-xl transition-all duration-200 ${
          isHovered ? "opacity-100 -translate-y-1" : "opacity-0 translate-y-0"
        }`}
      >
        <span>Plan with AI ✨</span>
        <div className="absolute -bottom-1 right-6 h-2 w-2 rotate-45 bg-[#004643]" />
      </div>
    </>
  );
}
