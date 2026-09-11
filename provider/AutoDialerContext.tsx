"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import AxiosProvider from "./AxiosProvider";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

export type AutoDialerStatus =
  | "idle"
  | "dialing"
  | "in-call"
  | "wrap-up"
  | "paused"
  | "completed";

export interface AutoDialerLead {
  id: string;
  lead_number?: string;
  full_name?: string;
  phone?: string;
  whatsapp_number?: string;
  email?: string;
  lead_status?: string;
  city?: string;
  state?: string;
  country?: string;
  best_time_to_call?: string;
  note?: string;
  lead_source_name?: string;
  campaign_name?: string;
  agent_name?: string;
  latest_activity?: any;
}

interface AutoDialerStats {
  total: number;
  completed: number;
  skipped: number;
}

interface AutoDialerContextType {
  isOpen: boolean;
  isMinimized: boolean;
  status: AutoDialerStatus;
  queue: AutoDialerLead[];
  currentIndex: number;
  currentLead: AutoDialerLead | null;
  countdown: number;
  callDuration: number;
  stats: AutoDialerStats;
  dispositions: any[];
  isLoading: boolean;
  lastActivityId: string | null;
  startAutoDialer: (leadIds?: string[], customQueue?: AutoDialerLead[]) => Promise<void>;
  pauseAutoDialer: () => void;
  resumeAutoDialer: () => void;
  skipCurrentLead: () => void;
  dialCurrentLead: () => Promise<void>;
  saveDispositionAndNext: (
    dispositionId: string,
    conversationNote: string,
    leadStatus?: string
  ) => Promise<void>;
  stopAutoDialer: () => void;
  toggleMinimize: () => void;
  setIsOpen: (open: boolean) => void;
}

const AutoDialerContext = createContext<AutoDialerContextType | undefined>(
  undefined
);

export const AutoDialerProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [status, setStatus] = useState<AutoDialerStatus>("idle");
  const [queue, setQueue] = useState<AutoDialerLead[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [countdown, setCountdown] = useState<number>(5);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dispositions, setDispositions] = useState<any[]>([]);
  const [lastActivityId, setLastActivityId] = useState<string | null>(null);

  const [stats, setStats] = useState<AutoDialerStats>({
    total: 0,
    completed: 0,
    skipped: 0,
  });

  // Refs to prevent stale closures in async callbacks and timers
  const queueRef = useRef<AutoDialerLead[]>([]);
  const currentIndexRef = useRef<number>(0);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const callDurationTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Load Dispositions on mount
  useEffect(() => {
    const fetchDispositions = async () => {
      try {
        const res = await AxiosProvider.get("/leads/dispositions/all");
        const list =
          res.data?.data?.items ||
          res.data?.data?.data ||
          res.data?.data ||
          [];
        setDispositions(list);
      } catch (err) {
        console.error("AutoDialer: Error fetching dispositions:", err);
      }
    };
    fetchDispositions();
  }, []);

  const currentLead = queue[currentIndex] || null;

  // Clear timers helper
  const clearTimers = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (callDurationTimerRef.current) {
      clearInterval(callDurationTimerRef.current);
      callDurationTimerRef.current = null;
    }
  };

  // Start Call Duration Counter
  const startCallTimer = () => {
    if (callDurationTimerRef.current) clearInterval(callDurationTimerRef.current);
    setCallDuration(0);
    callDurationTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  // Advance to Next Lead in Queue
  const advanceToNext = (fromIndex?: number, explicitQueue?: AutoDialerLead[]) => {
    clearTimers();
    const currentQ = explicitQueue || queueRef.current;
    const currentIdx = fromIndex !== undefined ? fromIndex : currentIndexRef.current;
    const nextIdx = currentIdx + 1;

    if (nextIdx >= currentQ.length) {
      setStatus("completed");
      toast.success("🎉 Auto-Dialer session completed all leads in queue!");
      return;
    }

    setCurrentIndex(nextIdx);
    currentIndexRef.current = nextIdx;
    dialLeadAtIndex(nextIdx, currentQ);
  };

  // Start Wrap-up Countdown Timer
  const startCountdown = () => {
    clearTimers();
    setStatus("wrap-up");
    setCountdown(5);

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearTimers();
          advanceToNext();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Dial a Lead at specific index
  const dialLeadAtIndex = async (index: number, explicitQueue?: AutoDialerLead[]) => {
    const currentQ = explicitQueue || queueRef.current;
    const targetLead = currentQ[index];

    if (!targetLead) {
      if (currentQ.length > 0 && index >= currentQ.length) {
        setStatus("completed");
      }
      return;
    }

    const phone = targetLead.phone || targetLead.whatsapp_number;
    if (!phone) {
      toast.warn(`Skipping ${targetLead.full_name || "Lead"} (No phone number)`);
      setStats((s) => ({ ...s, skipped: s.skipped + 1 }));
      advanceToNext(index, currentQ);
      return;
    }

    setIsLoading(true);
    setStatus("dialing");
    clearTimers();

    try {
      const res = await AxiosProvider.post("/leads/dialer/call-next", {
        lead_id: targetLead.id,
      });

      setLastActivityId(res.data?.data?.activity_id || null);
      const dialLink = res.data?.data?.dialLink;
      const fallbackTel = res.data?.data?.fallbackTel;

      // Connect via CloudTalk protocol
      if (dialLink) {
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = dialLink;
        document.body.appendChild(iframe);
        setTimeout(() => {
          try {
            document.body.removeChild(iframe);
          } catch {}
        }, 3000);
      } else if (fallbackTel) {
        window.location.href = fallbackTel;
      }

      toast.success(`Calling ${targetLead.full_name || phone}...`);
      setStatus("in-call");
      startCallTimer();
    } catch (err: any) {
      console.error("AutoDialer call error:", err);
      const isOffline =
        err?.response?.data?.isOffline ||
        err?.response?.data?.message?.toLowerCase()?.includes("offline") ||
        err?.response?.data?.message?.toLowerCase()?.includes("online");

      if (isOffline) {
        setStatus("paused");
        clearTimers();

        Swal.fire({
          title: "CloudTalk Phone Offline",
          html: `
            <div style="text-align: left; font-size: 13px; color: #d1d5db; line-height: 1.5;">
              <p style="margin-bottom: 10px;">Your CloudTalk agent is not online. To auto-dial leads, your CloudTalk Phone app must be open and status set to <b>Online</b>.</p>
              <div style="background-color: #1f2937; padding: 12px; border-radius: 6px; border: 1px solid #374151;">
                <p style="font-weight: 600; color: #38bdf8; margin-bottom: 6px;">How to continue:</p>
                <ol style="margin-left: 18px; padding: 0;">
                  <li>Click <b>"Open CloudTalk Phone"</b> below.</li>
                  <li>Log in with your agent account.</li>
                  <li>Set status toggle to green (<b>Online</b>).</li>
                  <li>Click <b>"Resume Auto-Dialer"</b>!</li>
                </ol>
              </div>
            </div>
          `,
          icon: "warning",
          background: "#181818",
          color: "#ffffff",
          iconColor: "#f59e0b",
          showCancelButton: true,
          confirmButtonColor: "#0284c7",
          cancelButtonColor: "#374151",
          confirmButtonText: "🌐 Open CloudTalk Phone",
          cancelButtonText: "Close",
          customClass: {
            popup: "border border-gray-700 rounded-2xl shadow-2xl",
          },
        }).then((result) => {
          if (result.isConfirmed) {
            window.open(
              "https://phone.cloudtalk.io",
              "_blank",
              "width=460,height=750,noopener,noreferrer"
            );
          }
        });
      } else {
        toast.error(
          err?.response?.data?.message ||
            err?.response?.data?.msg ||
            "Failed to initiate call for this lead"
        );
        setStatus("wrap-up");
        startCountdown();
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 1. Start Auto-Dialer Queue
   */
  const startAutoDialer = async (
    leadIds?: string[],
    customQueue?: AutoDialerLead[]
  ) => {
    setIsLoading(true);
    try {
      let leadsToQueue: AutoDialerLead[] = [];

      if (customQueue && customQueue.length > 0) {
        leadsToQueue = customQueue;
      } else {
        const params: any = { limit: 500 };
        if (leadIds && leadIds.length > 0) {
          params.lead_ids = leadIds.join(",");
        }

        const res = await AxiosProvider.get("/leads/dialer/queue", { params });
        leadsToQueue = res.data?.data?.leads || [];
      }

      if (leadsToQueue.length === 0) {
        toast.info("No actionable leads found to auto-dial.");
        return;
      }

      queueRef.current = leadsToQueue;
      currentIndexRef.current = 0;
      setQueue(leadsToQueue);
      setCurrentIndex(0);
      setStats({
        total: leadsToQueue.length,
        completed: 0,
        skipped: 0,
      });
      setIsOpen(true);
      setIsMinimized(false);

      toast.success(
        `⚡ Auto-Dialer started with ${leadsToQueue.length} leads in queue!`
      );
      dialLeadAtIndex(0, leadsToQueue);
    } catch (err: any) {
      console.error("Failed to initialize auto-dialer queue:", err);
      toast.error(
        err?.response?.data?.message || "Failed to start auto-dialer"
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 2. Pause Auto-Dialer
   */
  const pauseAutoDialer = () => {
    clearTimers();
    setStatus("paused");
    toast.info("⏸️ Auto-Dialer paused.");
  };

  /**
   * 3. Resume Auto-Dialer
   */
  const resumeAutoDialer = () => {
    toast.success("▶️ Auto-Dialer resumed.");
    dialLeadAtIndex(currentIndexRef.current);
  };

  /**
   * 4. Skip Current Lead
   */
  const skipCurrentLead = () => {
    setStats((s) => ({ ...s, skipped: s.skipped + 1 }));
    toast.info(`Skipped ${currentLead?.full_name || "Lead"}`);
    advanceToNext();
  };

  /**
   * 5. Dial Current Lead Immediately
   */
  const dialCurrentLead = async () => {
    clearTimers();
    await dialLeadAtIndex(currentIndexRef.current);
  };

  /**
   * 6. Save Disposition & Notes and Advance
   */
  const saveDispositionAndNext = async (
    dispositionId: string,
    conversationNote: string,
    leadStatus?: string
  ) => {
    if (!currentLead) return;

    try {
      await AxiosProvider.post("/leads/dialer/quick-disposition", {
        lead_id: currentLead.id,
        activity_id: lastActivityId,
        disposition_id: dispositionId,
        conversation: conversationNote || "Auto-dialer call completed",
        lead_status: leadStatus || undefined,
      });

      setStats((s) => ({ ...s, completed: s.completed + 1 }));
      toast.success("Activity & disposition saved");
      startCountdown();
    } catch (err: any) {
      console.error("Failed to save quick disposition:", err);
      toast.error("Failed to save disposition, continuing to next lead...");
      startCountdown();
    }
  };

  /**
   * 7. Stop / End Auto-Dialer Session
   */
  const stopAutoDialer = () => {
    clearTimers();
    setStatus("idle");
    setIsOpen(false);
    setQueue([]);
    queueRef.current = [];
    setCurrentIndex(0);
    currentIndexRef.current = 0;
    setLastActivityId(null);
    toast.info("Auto-Dialer session ended.");
  };

  const toggleMinimize = () => {
    setIsMinimized((prev) => !prev);
  };

  return (
    <AutoDialerContext.Provider
      value={{
        isOpen,
        isMinimized,
        status,
        queue,
        currentIndex,
        currentLead,
        countdown,
        callDuration,
        stats,
        dispositions,
        isLoading,
        lastActivityId,
        startAutoDialer,
        pauseAutoDialer,
        resumeAutoDialer,
        skipCurrentLead,
        dialCurrentLead,
        saveDispositionAndNext,
        stopAutoDialer,
        toggleMinimize,
        setIsOpen,
      }}
    >
      {children}
    </AutoDialerContext.Provider>
  );
};

export const useAutoDialer = () => {
  const context = useContext(AutoDialerContext);
  if (!context) {
    throw new Error("useAutoDialer must be used within an AutoDialerProvider");
  }
  return context;
};

export default AutoDialerContext;
