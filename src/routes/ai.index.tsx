import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Cloud,
  CloudRain,
  Compass,
  Download,
  Heart,
  Hotel,
  Lightbulb,
  Loader2,
  MapPin,
  MessageSquare,
  Mic,
  MicOff,
  Plus,
  RefreshCw,
  Send,
  Share2,
  Shield,
  Sparkles,
  Star,
  Sun,
  UtensilsCrossed,
  Users,
  X,
  Volume2,
} from "lucide-react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/SiteHeader";
import { openEnquiry } from "@/components/EnquiryDialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  askQarwaanAi,
  getDestinationCoverImage,
  type AiChatMessage,
  type AiItinerary,
  type DestinationCardInfo,
  type TravelPreferences,
  type TripPersona,
  type WeatherDay,
} from "@/lib/ai-travel-client";
import { QARWAAN_ITINERARIES } from "@/data/qarwaan-itineraries";
import { SITE_URL } from "@/lib/seo";

const PERSONAS: { key: TripPersona; label: string; icon: string }[] = [
  { key: "Honeymoon", label: "Honeymoon", icon: "🤍" },
  { key: "Family Trip", label: "Family Trip", icon: "👨‍👩‍👧" },
  { key: "Group Tour", label: "Group Tour", icon: "👥" },
  { key: "Solo Backpacker", label: "Solo Backpacker", icon: "🎒" },
  { key: "Adventure", label: "Adventure", icon: "🏕️" },
];

const INITIAL_WEATHER: WeatherDay[] = [
  { day: "Mon, Oct 12", tempC: 25, condition: "Rain", icon: "rain" },
  { day: "Tue, Oct 13", tempC: 19, condition: "Rain", icon: "rain" },
  { day: "Wed, Oct 14", tempC: 16, condition: "Mainly Clear", icon: "sun" },
  { day: "Thu, Oct 15", tempC: 20, condition: "Overcast", icon: "cloud" },
  { day: "Fri, Oct 16", tempC: 23, condition: "Overcast", icon: "cloud" },
];

const DEFAULT_DESTINATION: DestinationCardInfo = {
  name: "Bali",
  tag: "POPULAR DESTINATION",
  rating: "4.8 Exceptional",
  coverImage:
    "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1200&q=80",
  bestTime: "October to April (Optimal Weather)",
  visaStatus: "Check local travel entry guidelines",
};

const TRENDING_DESTINATIONS = [
  {
    name: "Bali",
    badge: "42% this week",
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80",
    prompt: "Plan a romantic 6-day escape to Bali with Nusa Penida & Ubud",
  },
  {
    name: "Japan",
    badge: "Cherry blossom season",
    image:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80",
    prompt: "Plan a 7-day cultural journey to Japan covering Tokyo and Kyoto",
  },
  {
    name: "Dubai",
    badge: "Most booked this month",
    image:
      "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80",
    prompt: "Plan a luxury 5-day holiday in Dubai with desert safari",
  },
];

const WELCOME_MESSAGE: AiChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hello from Qarwaan AI, your premier travel consultant! Where would you like to escape next? Tell me your dream destination, travel dates, or who you're travelling with, and I'll craft your bespoke journey.",
};

export const Route = createFileRoute("/ai/")({
  validateSearch: (search: Record<string, unknown>) => ({
    chatId: typeof search.chatId === "number" ? search.chatId : Date.now(),
  }),
  head: () => ({
    meta: [
      { title: "Qarwaan AI — Bespoke Travel Consultant & Itinerary Planner" },
      {
        name: "description",
        content:
          "Plan your dream holiday with Qarwaan AI. Bespoke day-by-day itineraries, live weather, personalized expert recommendations.",
      },
      { property: "og:url", content: `${SITE_URL}/ai` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/ai` }],
  }),
  component: QarwaanAiPage,
});

function renderFormattedInlineText(text: string) {
  // Strip any stray raw markdown heading hashes if embedded inline
  const sanitized = text.replace(/^\s*#{1,6}\s*/, "");
  const parts = sanitized.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-bold text-[#004643]">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function FormattedMessage({ content }: { content: string }) {
  if (!content) return null;

  // Split content by lines so every single line is processed with correct hierarchy
  const lines = content.split("\n");

  return (
    <div className="font-sans space-y-1.5 leading-relaxed text-sm">
      {lines.map((rawLine, idx) => {
        const trimmed = rawLine.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1" />;
        }

        // 1. Strip raw markdown heading hashes (e.g., #####, ####, ###, ##, #)
        const cleanLine = rawLine.replace(/^\s*#{1,6}\s*/, "").trim();

        // 2. Identify Main Section Headers (✨ The Essence, 🗺️ Day-by-Day Itinerary, 🏨 Premium Stay, 💡 Insider Tips, etc.)
        const isMainSection =
          /^[✨🗺️🏨💡🏛️📍]/.test(cleanLine) ||
          /^\*{0,2}(The Essence|Day-by-Day Itinerary|Premium Stay & Resort Recommendations|Premium Stay|Insider Travel Tips|Insider Tips|Highlights & Top Sights|Highlights|Local Flavors)/i.test(
            cleanLine,
          );

        if (isMainSection) {
          const strippedTitle = cleanLine.replace(/^\s*[-*•]?\s*\*{0,2}/, "").replace(/\*{0,2}\s*$/, "");
          return (
            <h4
              key={idx}
              className="font-sans text-sm font-bold text-[#004643] pt-3 pb-1 border-b border-[#004643]/15 flex items-center gap-1.5"
            >
              {renderFormattedInlineText(strippedTitle)}
            </h4>
          );
        }

        // 3. Identify Day Subheaders (e.g., Day 1: Tokyo Arrival, **Day 1: ...**, ##### Day 1: ...)
        const isDaySubheader =
          /^(\*{0,2}Day\s+\d+[:\-–—]|\d+[\.\)]\s+Day\s+\d+)/i.test(cleanLine) ||
          /^Day\s+\d+/i.test(cleanLine);

        if (isDaySubheader) {
          const strippedDayTitle = cleanLine.replace(/^\s*[-*•]?\s*\*{0,2}/, "").replace(/\*{0,2}\s*$/, "");
          return (
            <div
              key={idx}
              className="font-sans text-[13px] font-bold text-stone-900 pt-2.5 pb-0.5 flex items-center gap-1.5"
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#004643]" />
              <span>{renderFormattedInlineText(strippedDayTitle)}</span>
            </div>
          );
        }

        // 4. Other headings that originally had # (e.g., ### Packing Tips)
        const wasHeading = /^\s*#{1,6}\s+/.test(rawLine);
        if (wasHeading) {
          return (
            <h4
              key={idx}
              className="font-sans text-sm font-bold text-[#004643] pt-2 pb-0.5 border-b border-[#004643]/10"
            >
              {renderFormattedInlineText(cleanLine)}
            </h4>
          );
        }

        // 5. Nested / Indented bullet items (e.g. `  - **Why you'll love it:** ...` or 2+ spaces indentation)
        const isIndentedItem =
          /^\s{2,}[•\-*]\s+/.test(rawLine) ||
          /^\s*(\*{0,2}Why you'll love it[:\*])/i.test(cleanLine);

        if (isIndentedItem) {
          const cleaned = rawLine.replace(/^\s+[•\-*]\s+/, "").replace(/^\s*[•\-*]\s*/, "");
          return (
            <div
              key={idx}
              className="ml-5 pl-2.5 border-l-2 border-[#004643]/20 flex items-start gap-2 text-stone-600 text-xs sm:text-[13px] my-1"
            >
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#004643]/60" />
              <span className="leading-relaxed font-sans">{renderFormattedInlineText(cleaned)}</span>
            </div>
          );
        }

        // 6. Standard bullet items (e.g. `- **Morning:** ...`, `* **Afternoon:** ...`, or bulleted hotel choices)
        const isStandardItem =
          /^\s*[•\-*]\s+/.test(rawLine) ||
          /^\s*\d+\.\s+/.test(rawLine) ||
          /^\s*(\*{0,2}(Morning|Afternoon|Evening)[:\*])/i.test(cleanLine);

        if (isStandardItem) {
          const cleaned = rawLine.replace(/^\s*([•\-*]|\d+\.)\s+/, "");
          return (
            <div key={idx} className="flex items-start gap-2 text-stone-700 pl-1">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#004643]" />
              <span className="leading-relaxed font-sans">{renderFormattedInlineText(cleaned)}</span>
            </div>
          );
        }

        // 7. Regular paragraph / description text
        return (
          <p key={idx} className="text-stone-700 leading-relaxed font-sans">
            {renderFormattedInlineText(cleanLine)}
          </p>
        );
      })}
    </div>
  );
}

function DestinationHeroCard({
  card,
  itinerary,
  onConnectExpert,
  onViewItinerary,
  onShare,
}: {
  card: DestinationCardInfo;
  itinerary?: AiItinerary | null;
  onConnectExpert: (destName: string, itinerary?: AiItinerary | null) => void;
  onViewItinerary: (destName: string, itinerary?: AiItinerary | null) => void;
  onShare: (destName: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm font-sans">
      {/* Image Banner */}
      <div className="relative h-48 w-full overflow-hidden bg-stone-900 sm:h-56">
        <img
          src={card.coverImage}
          alt={card.name}
          className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/35" />

        {/* Top Badges */}
        <div className="absolute inset-x-3.5 top-3.5 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-amber-300 backdrop-blur-md border border-white/10">
            <Star className="h-3 w-3 fill-amber-300 text-amber-300" /> {card.rating || "4.8 Exceptional"}
          </span>
          <button
            type="button"
            onClick={() => onConnectExpert(card.name, itinerary)}
            className="inline-flex items-center gap-1 rounded-full bg-[#004643] px-3.5 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-[#003634] transition"
          >
            Customized Pricing <span className="opacity-90">| Talk to Expert ↗</span>
          </button>
        </div>

        {/* Bottom Overlay Text */}
        <div className="absolute inset-x-4 bottom-3.5 text-white">
          <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-amber-400">
            <MapPin className="h-3 w-3 text-amber-400" /> {card.tag || "POPULAR DESTINATION"}
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white drop-shadow-md">
            {card.name}
          </h2>
        </div>
      </div>

      {/* Info Grid & Action Buttons */}
      <div className="p-4 sm:p-5">
        {/* Soft Cream Container */}
        <div className="rounded-xl bg-[#f8f5ee] p-3.5 sm:p-4 text-xs sm:text-sm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-6">
            <div>
              <div className="flex items-center gap-1.5 font-bold text-[#004643]">
                <Calendar className="h-4 w-4 shrink-0 text-[#004643]" />
                <span>Best Time</span>
              </div>
              <p className="mt-0.5 text-xs text-stone-600 sm:text-[13px]">
                {card.bestTime || "October to April (Optimal Weather)"}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-bold text-[#004643]">
                <Shield className="h-4 w-4 shrink-0 text-[#004643]" />
                <span>Visa Status</span>
              </div>
              <p className="mt-0.5 text-xs text-stone-600 sm:text-[13px]">
                {card.visaStatus || "Check local travel entry guidelines"}
              </p>
            </div>
          </div>
        </div>

        {/* Primary CTA Button */}
        <button
          type="button"
          onClick={() => onConnectExpert(card.name, itinerary)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#004643] py-3.5 text-sm font-semibold text-white shadow transition duration-200 hover:bg-[#003634]"
        >
          <MessageSquare className="h-4 w-4" /> Connect with Travel Expert for {card.name} Quote
        </button>

        {/* Secondary Buttons */}
        <div className="mt-2.5 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => onViewItinerary(card.name, itinerary)}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white py-2.5 text-xs font-semibold text-[#004643] shadow-2xs transition hover:bg-stone-50 sm:text-sm"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#004643]" /> View Day-by-Day Itinerary
          </button>
          <button
            type="button"
            onClick={() => onShare(card.name)}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white py-2.5 text-xs font-semibold text-[#004643] shadow-2xs transition hover:bg-stone-50 sm:text-sm"
          >
            <Share2 className="h-3.5 w-3.5 text-[#004643]" /> Share
          </button>
        </div>
      </div>
    </div>
  );
}

function TravellerTripsCarousel({
  onPlanTrip,
}: {
  onPlanTrip: (prompt: string) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const trips = QARWAAN_ITINERARIES.slice(0, 8);
  const total = trips.length;

  const handlePrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  }, [total]);

  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % total);
  }, [total]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 45) {
      handleNext();
    } else if (diff < -45) {
      handlePrev();
    }
    touchStartX.current = null;
  };

  const currentTrip = trips[currentIndex] || trips[0];

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir >= 0 ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.25 },
      },
    },
    exit: (dir: number) => ({
      x: dir >= 0 ? "-100%" : "100%",
      opacity: 0,
      transition: {
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
      },
    }),
  };

  return (
    <div className="mt-6">
      {/* Section Header with Circular Arrow Controls */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-xs text-[#004643]">
          <Heart className="h-3.5 w-3.5 text-[#004643]" /> Trips our travellers love
        </h3>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handlePrev}
            aria-label="Previous trip"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-[#004643]/20 bg-white text-[#004643] shadow-xs transition hover:bg-[#004643] hover:text-white active:scale-95"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleNext}
            aria-label="Next trip"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-[#004643]/20 bg-white text-[#004643] shadow-xs transition hover:bg-[#004643] hover:text-white active:scale-95"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Single Card Horizontal Carousel */}
      <div
        className="group relative mt-3 h-80 w-full overflow-hidden rounded-2xl bg-stone-900 shadow-sm"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={currentTrip.id}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="absolute inset-0 h-full w-full select-none"
          >
            {/* Full Card Cover Image */}
            <img
              src={currentTrip.coverImage}
              alt={currentTrip.packageName}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            {/* Gradient Scrim on Image */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

            {/* Text and everything in card on image below */}
            <div className="absolute inset-x-0 bottom-0 z-10 p-4 font-sans text-white">
              <div className="flex items-center justify-between text-xs font-sans">
                <span className="inline-flex items-center gap-1 font-semibold text-amber-400">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> 4.9 Exceptional
                </span>
                <span className="rounded bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-xs">
                  {currentTrip.tripType}
                </span>
              </div>

              <p className="mt-1.5 text-sm sm:text-base font-bold leading-snug text-white line-clamp-2 font-sans">
                {currentTrip.packageName}
              </p>

              <p className="mt-1 text-xs text-stone-300 font-sans">{currentTrip.duration}</p>

              <button
                type="button"
                onClick={() =>
                  onPlanTrip(
                    `I'm interested in the "${currentTrip.packageName}" package. Please plan my journey.`,
                  )
                }
                className="mt-2 inline-block text-xs font-semibold text-white underline underline-offset-2 hover:text-stone-200 transition font-sans"
              >
                Plan this trip →
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function QarwaanAiPage() {
  const { chatId } = Route.useSearch();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<AiChatMessage[]>([WELCOME_MESSAGE]);
  const [preferences, setPreferences] = useState<TravelPreferences>({ travellers: 2 });
  const [activePersona, setActivePersona] = useState<TripPersona | "">("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [activeItinerary, setActiveItinerary] = useState<AiItinerary | null>(null);
  const [itineraryModalOpen, setItineraryModalOpen] = useState(false);

  // Active Destination Details for the Top Feature Card
  const [destinationInfo, setDestinationInfo] = useState(DEFAULT_DESTINATION);

  // Live Weather for Right Companion
  const [weatherForecast, setWeatherForecast] = useState<WeatherDay[]>(INITIAL_WEATHER);

  // Nearby attractions and restaurants
  const [attractions, setAttractions] = useState<string[]>([
    "Uluwatu Temple cliffside sunset",
    "Tegallalang Sacred Rice Terraces",
    "Kelingking Beach panoramic vista",
  ]);
  const [restaurants, setRestaurants] = useState<string[]>([
    "Locavore NXT (Modern Indonesian fine dining)",
    "Merah Putih (Classic Balinese heritage cuisine)",
    "La Lucciola (Oceanfront Seminyak dining)",
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const speechRecognitionRef = useRef<any>(null);

  // Session persistence
  useEffect(() => {
    if (!chatId) return;
    try {
      const saved = sessionStorage.getItem(`qarwaan-ai:${chatId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.messages) && parsed.messages.length) {
          setMessages(parsed.messages);
        }
        if (parsed.preferences) setPreferences(parsed.preferences);
        if (parsed.destinationInfo) setDestinationInfo(parsed.destinationInfo);
        if (parsed.weatherForecast) setWeatherForecast(parsed.weatherForecast);
        if (parsed.activeItinerary) setActiveItinerary(parsed.activeItinerary);
      }
    } catch {
      // Ignore storage errors
    }
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;
    try {
      sessionStorage.setItem(
        `qarwaan-ai:${chatId}`,
        JSON.stringify({
          messages,
          preferences,
          destinationInfo,
          weatherForecast,
          activeItinerary,
        }),
      );
    } catch {
      // Ignore
    }
  }, [chatId, messages, preferences, destinationInfo, weatherForecast, activeItinerary]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  // Speech Recognition Setup
  const toggleSpeechRecognition = useCallback(() => {
    if (isListening) {
      speechRecognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Speech recognition is not supported in this browser. Please type your message.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        toast.info("Listening... Speak your dream destination or itinerary request");
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0]?.[0]?.transcript;
        if (transcript) {
          setDraft((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = (err: any) => {
        console.warn("Speech recognition error:", err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Failed to initialize speech recognition:", err);
      setIsListening(false);
    }
  }, [isListening]);

  // Send message
  async function handleSend(customText?: string) {
    const content = (customText ?? draft).trim();
    if (!content || sending) return;

    const userMessage: AiChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setDraft("");
    setSending(true);
    setError("");

    try {
      const response = await askQarwaanAi({
        messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
        preferences,
        persona: activePersona,
      });

      const updatedPrefs = { ...preferences, ...(response.preferences || {}) };
      setPreferences(updatedPrefs);

      const isDest = response.isDestinationQuery !== false && Boolean(response.destination);

      if (isDest && response.itinerary) {
        setActiveItinerary(response.itinerary);
      }

      // Update destination card info ONLY for Intent B (destination query)
      const destName = isDest ? response.destination!.trim() : "";

      if (destName) {
        const cardCover =
          response.destinationCard?.coverImage ||
          response.itinerary?.coverImage ||
          getDestinationCoverImage(destName);

        const cardBestTime =
          response.destinationCard?.bestTime ||
          response.bestTime ||
          "October to April (Optimal Weather)";

        const cardVisaStatus =
          response.destinationCard?.visaStatus ||
          response.visaStatus ||
          "Check local travel entry guidelines";

        setDestinationInfo({
          name: destName,
          tag: response.destinationCard?.tag || "POPULAR DESTINATION",
          rating: response.destinationCard?.rating || "4.8 Exceptional",
          coverImage: cardCover,
          bestTime: cardBestTime,
          visaStatus: cardVisaStatus,
        });
      }

      if (isDest && response.weatherForecast && response.weatherForecast.length) {
        setWeatherForecast(response.weatherForecast);
      }

      if (isDest && response.nearbyAttractions && response.nearbyAttractions.length) {
        setAttractions(response.nearbyAttractions);
      }
      if (isDest && response.nearbyRestaurants && response.nearbyRestaurants.length) {
        setRestaurants(response.nearbyRestaurants);
      }

      const destinationCardData: DestinationCardInfo | undefined =
        isDest && destName
          ? (response.destinationCard || {
              name: destName,
              tag: "POPULAR DESTINATION",
              rating: "4.8 Exceptional",
              coverImage: getDestinationCoverImage(destName),
              bestTime: response.bestTime || "October to April (Optimal Weather)",
              visaStatus: response.visaStatus || "Check local travel entry guidelines",
            })
          : undefined;

      const botMessage: AiChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.reply,
        isDestinationQuery: isDest,
        destination: isDest ? destName : undefined,
        destinationCard: destinationCardData,
        bestTime: isDest ? response.bestTime : undefined,
        visaStatus: isDest ? response.visaStatus : undefined,
        itinerary: isDest ? response.itinerary : null,
        weatherForecast: isDest ? response.weatherForecast : undefined,
        nearbyAttractions: isDest ? response.nearbyAttractions : undefined,
        nearbyRestaurants: isDest ? response.nearbyRestaurants : undefined,
        matchedTrips: isDest ? (response.matchedTrips || response.recommendedTrips) : undefined,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      console.error("Chat error:", err);
      setError(err?.message || "Failed to contact Qarwaan AI. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  function handlePersonaClick(personaKey: TripPersona) {
    if (activePersona === personaKey) {
      setActivePersona("");
    } else {
      setActivePersona(personaKey);
      toast.success(`Trip persona set to ${personaKey}!`);
      if (destinationInfo.name) {
        void handleSend(`Tailor this ${destinationInfo.name} itinerary specifically for a ${personaKey}.`);
      }
    }
  }

  function handleConnectWithExpert(targetDest?: string, targetItin?: AiItinerary | null) {
    const dest = targetDest || destinationInfo.name;
    const itin = targetItin || activeItinerary;
    openEnquiry(
      itin?.title || `${dest} Custom Travel`,
      {
        travelers: preferences.travellers || 2,
        travelStartDate: preferences.startDate,
        message: itin
          ? `Interested in ${itin.title} (${itin.durationDays || 5} Days, ${dest}). Please provide customized package pricing and deal quote.`
          : `Interested in travel package for ${dest}. Please connect me with a Qarwaan travel expert.`,
        source: "qarwaan-ai-consultant",
      },
    );
  }

  function handleShare(targetDest?: string) {
    const dest = targetDest || destinationInfo.name;
    const shareData = {
      title: `Qarwaan AI: ${dest} Escape`,
      text: `Check out this custom journey to ${dest} crafted by Qarwaan AI!`,
      url: window.location.href,
    };
    if (navigator.share) {
      navigator
        .share(shareData)
        .catch(() => {
          navigator.clipboard.writeText(window.location.href);
          toast.success("Link copied to clipboard!");
        });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  }

  function downloadBrochureHtml(itinerary: AiItinerary) {
    const daysHtml = (itinerary.days || [])
      .map(
        (d) => `
        <div style="margin-bottom: 24px; padding: 16px; background: #fdfbf7; border-left: 4px solid #004643;">
          <h3 style="margin: 0 0 8px 0; color: #004643;">Day ${d.day}: ${d.title}</h3>
          <ul style="margin: 0 0 8px 0; padding-left: 20px; line-height: 1.6;">
            ${(d.activities || []).map((a) => `<li>${a}</li>`).join("")}
          </ul>
          ${d.places?.length ? `<p style="margin: 4px 0; font-size: 13px; color: #555;"><strong>Key Spots:</strong> ${d.places.join(", ")}</p>` : ""}
          ${d.localTip ? `<p style="margin: 4px 0; font-size: 13px; color: #004643; font-style: italic;"><strong>Insider Tip:</strong> ${d.localTip}</p>` : ""}
        </div>
      `,
      )
      .join("");

    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${itinerary.title} — Qarwaan AI</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1a3331; max-width: 800px; margin: 40px auto; padding: 0 24px; }
    h1 { color: #004643; font-size: 28px; margin-bottom: 6px; }
    .badge { display: inline-block; background: #004643; color: #fff; padding: 4px 10px; font-size: 12px; font-weight: bold; margin-bottom: 16px; border-radius: 4px; }
    .meta { font-size: 14px; color: #555; margin-bottom: 24px; }
    .overview { font-size: 15px; line-height: 1.7; margin-bottom: 30px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 13px; color: #777; text-align: center; }
  </style>
</head>
<body>
  <div class="badge">QARWAAN AI · BESPOKE JOURNEY</div>
  <h1>${itinerary.title}</h1>
  <div class="meta">
    📍 ${itinerary.destination} · ⏱️ ${itinerary.durationDays} Days · 👥 ${itinerary.travellers} Travellers · 💰 ${itinerary.budgetEstimate || "Customized Rates"}
  </div>
  ${itinerary.overview ? `<p class="overview">${itinerary.overview}</p>` : ""}
  <h2 style="color: #004643; border-bottom: 2px solid #004643; padding-bottom: 8px;">Day-by-Day Journey Itinerary</h2>
  ${daysHtml}
  <div class="footer">
    Crafted by Qarwaan AI · For customized package pricing and bookings, contact team@qarwaan.com or visit www.qarwaan.com
  </div>
</body>
</html>`;

    const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Qarwaan_${itinerary.destination.replace(/[^a-z0-9]/gi, "_")}_Itinerary.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("Itinerary downloaded!");
  }

  return (
    <main className="flex h-screen w-full flex-col overflow-hidden bg-[#f3efe6] text-[#004643] selection:bg-[#004643] selection:text-white">
      <SiteHeader page="ai" />

      {/* Full Page Width and Height Studio Container (edge-to-edge, not a box) */}
      <div className="flex-1 w-full overflow-hidden">
        <div className="grid h-full w-full overflow-hidden border-t border-[#004643]/15 bg-[#fbf9f4] lg:grid-cols-[minmax(0,1.25fr)_minmax(390px,1fr)] xl:grid-cols-[minmax(0,1.35fr)_minmax(440px,1fr)]">
          
          {/* ========================================================= */}
          {/* LEFT COLUMN: INTERACTIVE AI TRAVEL CHATBOT                 */}
          {/* ========================================================= */}
          <section className="flex h-full flex-col overflow-hidden border-b border-[#004643]/15 lg:border-b-0 lg:border-r">
            
            {/* Top Expert Banner */}
            <div className="flex items-center gap-2 border-b border-[#004643]/10 bg-[#f7f3ea] px-4 py-2.5 text-xs text-[#004643]">
              <MessageSquare className="h-4 w-4 shrink-0 text-[#004643]" />
              <p className="flex-1 font-medium leading-snug">
                For customized package pricing and exclusive deals, connect with our Qarwaan travel expert right here in the chatbot!
              </p>
            </div>

            {/* Scrollable Conversation & Hero Destination Card Area */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6 [scrollbar-width:thin]"
            >
              {/* Chat Message Stream */}
              <AnimatePresence initial={false}>
                {messages.map((msg) => {
                  const isUser = msg.role === "user";
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                    >
                      {/* Message Bubble */}
                      <div
                        className={`max-w-[92%] sm:max-w-[85%] ${
                          isUser
                            ? "rounded-2xl rounded-br-none bg-[#d8f0dc] px-4 py-3 text-sm font-medium leading-relaxed text-[#144234] shadow-sm"
                            : "rounded-2xl rounded-bl-none border border-[#004643]/12 bg-white px-5 py-4 text-sm leading-relaxed text-[#004643] shadow-sm"
                        }`}
                      >
                        {isUser ? (
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <FormattedMessage content={msg.content} />
                        )}

                        {/* Matched Packages Preview if available */}
                        {!isUser && msg.matchedTrips && msg.matchedTrips.length > 0 && (
                          <div className="mt-2.5 rounded-xl border border-[#004643]/15 bg-[#e8f4ed]/50 p-2.5 text-xs">
                            <p className="font-bold text-[#004643] mb-1.5 flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5 text-[#004643]" /> Official Qarwaan Packages for this Journey:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {msg.matchedTrips.map((trip) => (
                                <a
                                  key={trip.id}
                                  href={`/trips/${trip.slug}`}
                                  className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-[11px] font-semibold text-[#004643] shadow-sm border border-[#004643]/15 hover:bg-[#004643] hover:text-white transition"
                                >
                                  {trip.title} <ArrowUpRight className="h-3 w-3" />
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Destination Hero Card at the end of Assistant's Reply (Exact same design as default Bali card) */}
                        {!isUser && msg.destinationCard && (
                          <div className="mt-4">
                            <DestinationHeroCard
                              card={msg.destinationCard}
                              itinerary={msg.itinerary}
                              onConnectExpert={handleConnectWithExpert}
                              onViewItinerary={(dest, itin) => {
                                const targetItin = itin || activeItinerary;
                                if (targetItin && targetItin.days && targetItin.days.length > 0) {
                                  setActiveItinerary(targetItin);
                                  setItineraryModalOpen(true);
                                } else {
                                  void handleSend(`Show me the complete day-by-day itinerary for ${dest}`);
                                }
                              }}
                              onShare={handleShare}
                            />
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>

              {/* Loading Indicator */}
              {sending && (
                <div className="flex items-center gap-2 rounded-xl bg-white/80 p-3 text-xs font-medium text-[#004643]">
                  <Loader2 className="h-4 w-4 animate-spin text-[#004643]" />
                  <span>Qarwaan AI is consulting travel guides & tailoring your journey...</span>
                </div>
              )}

              {/* Error Alert */}
              {error && (
                <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">
                  <span>{error}</span>
                  <button onClick={() => setError("")}>
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Persona Chips & Input Toolbar */}
            <div className="border-t border-[#004643]/12 bg-[#f9f7f2] p-3 sm:p-4">
              
              {/* Trip Persona Selector Bar */}
              <div className="mb-2.5 flex items-center gap-2 overflow-x-auto pb-1 text-xs [scrollbar-width:none]">
                <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-[#004643]/70">
                  TRIP PERSONA:
                </span>
                {PERSONAS.map((p) => {
                  const isSelected = activePersona === p.key;
                  return (
                    <button
                      key={p.key}
                      onClick={() => handlePersonaClick(p.key)}
                      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 transition ${
                        isSelected
                          ? "border-[#004643] bg-[#004643] text-white font-medium"
                          : "border-stone-300 bg-white text-stone-700 hover:border-[#004643]/50"
                      }`}
                    >
                      <span>{p.icon}</span>
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Modern Rounded Chat Input */}
              <div className="relative flex items-end gap-2 rounded-2xl border border-stone-300 bg-white p-2 shadow-sm focus-within:border-[#004643] focus-within:ring-2 focus-within:ring-[#004643]/10">
                {/* Plus / Options Button */}
                <button
                  type="button"
                  onClick={() => setShowOptions(!showOptions)}
                  title="Quick trip preferences"
                  className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-stone-500 hover:bg-stone-100"
                >
                  <Plus className="h-4 w-4" />
                </button>

                {/* Textarea */}
                <Textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={sending}
                  rows={1}
                  placeholder={`Plan a 5-day ${activePersona ? activePersona.toLowerCase() : "honeymoon"} in Bali or anywhere...`}
                  className="max-h-28 min-h-[2.5rem] flex-1 resize-none border-0 bg-transparent p-1.5 text-sm shadow-none focus-visible:ring-0"
                />

                {/* Voice / Mic Button */}
                <button
                  type="button"
                  onClick={toggleSpeechRecognition}
                  title={isListening ? "Listening... click to stop" : "Voice input"}
                  className={`mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
                    isListening
                      ? "animate-pulse bg-red-600 text-white"
                      : "text-stone-600 hover:bg-stone-100"
                  }`}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>

                {/* Send Button */}
                <button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={!draft.trim() || sending}
                  className="mb-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#004643] text-white transition hover:bg-[#155a55] disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>

              {/* Options Popover Panel */}
              {showOptions && (
                <div className="mt-2 flex flex-wrap gap-2 rounded-xl border border-stone-200 bg-white p-3 text-xs">
                  <span className="font-semibold text-[#004643]">Trip Duration:</span>
                  {[3, 5, 7, 10, 14].map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        setDraft((prev) => `${prev} ${d} days`.trim());
                        setShowOptions(false);
                      }}
                      className="rounded bg-stone-100 px-2 py-0.5 hover:bg-stone-200"
                    >
                      {d} Days
                    </button>
                  ))}
                  <span className="ml-2 font-semibold text-[#004643]">Style:</span>
                  {["Luxury", "Budget", "Balanced", "Slow Travel"].map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setDraft((prev) => `${prev} ${s} style`.trim());
                        setShowOptions(false);
                      }}
                      className="rounded bg-stone-100 px-2 py-0.5 hover:bg-stone-200"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Disclaimer */}
              <p className="mt-2 text-center text-[11px] text-stone-500">
                Qarwaan AI Concierge is in beta — please verify critical booking, visa, and flight details with your Qarwaan travel specialist.
              </p>
            </div>
          </section>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: TRAVEL COMPANION & DISCOVERY SIDEBAR        */}
          {/* ========================================================= */}
          <aside className="flex h-full flex-col overflow-y-auto bg-[#f8f5ed] p-5 sm:p-7 [scrollbar-width:thin]">
            
            {/* Header Showcase */}
            <div>
              <h2 className="font-serif text-3xl font-bold leading-tight text-[#004643] sm:text-4xl">
                Unlock your next epic escape
              </h2>
              <p className="text-sm font-medium text-[#004643]/70">with Qarwaan AI</p>

              {/* Trust Badges */}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-stone-700">
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 shadow-sm">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> 4.8/5 on Google
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 shadow-sm">
                  <Users className="h-3 w-3 text-[#004643]" /> 250K+ travellers
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-emerald-700 shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                  </span>
                  78 planning live
                </span>
              </div>

              {/* Guarantee Banner */}
              <div className="mt-3 rounded-xl bg-[#e3f4e8] px-3.5 py-2 text-xs font-semibold text-[#125838] flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 shrink-0 text-[#125838]" />
                <span>24/7 On-Trip Concierge - 100% Customized Rates</span>
              </div>

              {/* Quick Action Pills */}
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <button
                  onClick={() => {
                    const dest = destinationInfo.name && destinationInfo.name.toLowerCase() !== "destination" ? destinationInfo.name : "Bali";
                    void handleSend(`What are the top must-visit attractions in ${dest}?`);
                  }}
                  className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-[#004643] shadow-sm transition hover:bg-stone-50"
                >
                  <span className="flex items-center gap-1.5">
                    <Compass className="h-3.5 w-3.5 text-[#004643]" /> Explore Nearby Attractions
                  </span>
                  <span>→</span>
                </button>
                <button
                  onClick={() => {
                    const dest = destinationInfo.name && destinationInfo.name.toLowerCase() !== "destination" ? destinationInfo.name : "Bali";
                    void handleSend(`Recommend the best authentic local restaurants and food spots in ${dest}.`);
                  }}
                  className="flex items-center justify-between rounded-xl border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-[#004643] shadow-sm transition hover:bg-stone-50"
                >
                  <span className="flex items-center gap-1.5">
                    <UtensilsCrossed className="h-3.5 w-3.5 text-[#004643]" /> Explore Nearby Restaurants
                  </span>
                  <span>→</span>
                </button>
              </div>
            </div>

            {/* Live Weather Forecast Widget */}
            <div className="mt-6 rounded-2xl border border-[#004643]/15 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#004643]">
                  <Sun className="h-4 w-4 text-[#004643]" />
                  <span>5-Day Weather Forecast: {destinationInfo.name}</span>
                </div>
                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                  Live Forecast
                </span>
              </div>

              {/* Weather Cards Row */}
              <div className="mt-3 grid grid-cols-5 gap-1.5 text-center text-xs">
                {weatherForecast.map((item, idx) => {
                  const isRain = item.condition.toLowerCase().includes("rain") || item.icon === "rain";
                  const isSun = item.condition.toLowerCase().includes("clear") || item.icon === "sun";
                  return (
                    <div
                      key={idx}
                      className="flex flex-col items-center justify-between rounded-xl bg-[#f8f6f0] p-2"
                    >
                      <p className="text-[10px] font-semibold text-stone-500">{item.day.split(",")[0]}</p>
                      <p className="text-[9px] text-stone-400">{item.day.split(",")[1]?.trim() || ""}</p>
                      <div className="my-1 flex items-center justify-center">
                        {isRain ? (
                          <CloudRain className="h-4 w-4 text-blue-500" />
                        ) : isSun ? (
                          <Sun className="h-4 w-4 text-amber-500" />
                        ) : (
                          <Cloud className="h-4 w-4 text-stone-500" />
                        )}
                      </div>
                      <p className="font-bold text-[#004643]">{item.tempC}°C</p>
                      <p className="line-clamp-1 text-[9px] text-stone-600">{item.condition}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Trending Destinations */}
            <div className="mt-6">
              <h3 className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-xs text-[#004643]">
                <Compass className="h-3.5 w-3.5 text-[#004643]" /> Trending Destinations
              </h3>
              <div className="mt-3 grid grid-cols-3 gap-2.5">
                {TRENDING_DESTINATIONS.map((dest) => (
                  <button
                    key={dest.name}
                    onClick={() => void handleSend(dest.prompt)}
                    className="group relative flex h-36 flex-col justify-end overflow-hidden rounded-xl bg-stone-800 text-left shadow-sm transition hover:shadow-md"
                  >
                    <img
                      src={dest.image}
                      alt={dest.name}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                    <div className="relative p-2.5 text-white">
                      <p className="font-bold leading-tight">{dest.name}</p>
                      <p className="text-[10px] text-stone-300">{dest.badge}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Trips Our Travellers Love - Horizontal Single Card Carousel */}
            <TravellerTripsCarousel onPlanTrip={(prompt) => void handleSend(prompt)} />
          </aside>
        </div>
      </div>

      {/* Day-by-Day Itinerary Modal */}
      {activeItinerary && (
        <Dialog open={itineraryModalOpen} onOpenChange={setItineraryModalOpen}>
          <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto bg-[#fbf9f4] text-[#004643]">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl text-[#004643]">
                {activeItinerary.title}
              </DialogTitle>
              <p className="text-xs text-stone-600 flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-[#004643]" /> {activeItinerary.destination}
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5 text-[#004643]" /> {activeItinerary.durationDays} Days
                </span>
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-[#004643]" /> {activeItinerary.travellers} Travellers
                </span>
              </p>
            </DialogHeader>

            {activeItinerary.overview && (
              <p className="text-sm leading-relaxed text-stone-700">{activeItinerary.overview}</p>
            )}

            <div className="mt-4 space-y-3">
              {activeItinerary.days.map((day) => (
                <div
                  key={day.day}
                  className="rounded-xl border border-[#004643]/15 bg-white p-3.5 shadow-sm"
                >
                  <h4 className="font-bold text-[#004643]">
                    Day {day.day}: {day.title}
                  </h4>
                  <ul className="mt-2 list-disc pl-5 text-xs text-stone-600 space-y-1">
                    {day.activities.map((act, i) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                  {day.places.length > 0 && (
                    <p className="mt-2 text-[11px] text-stone-500">
                      <strong>Places:</strong> {day.places.join(", ")}
                    </p>
                  )}
                  {day.localTip && (
                    <p className="mt-1 text-[11px] font-medium text-[#004643] flex items-center gap-1">
                      <Lightbulb className="h-3.5 w-3.5 shrink-0 text-[#004643]" />
                      <span><strong>Insider Tip:</strong> {day.localTip}</span>
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-end gap-2 border-t border-stone-200 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadBrochureHtml(activeItinerary)}
              >
                <Download className="mr-1.5 h-3.5 w-3.5" /> Download Brochure
              </Button>
              <Button
                size="sm"
                className="bg-[#004643] text-white hover:bg-[#155a55]"
                onClick={() => {
                  setItineraryModalOpen(false);
                  handleConnectWithExpert();
                }}
              >
                Connect with Expert
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
}
