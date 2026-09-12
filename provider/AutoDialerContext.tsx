"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
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
}

export interface AutoDialerStats {
  total: number;
  completed: number;
  skipped: number;
}

interface AutoDialerContextType {
  isOpen: boolean;
  isMinimized: boolean;
  status: AutoDialerStatus;
  currentLead: AutoDialerLead | null;
  countdown: number;
  callDuration: number;
  stats: AutoDialerStats;
  dispositions: any[];
  isLoading: boolean;
  lastActivityId: string | null;
  startAutoDialer: (startLeadId?: string) => Promise<void>;
  startAutoDialerFromLead: (
    leadId: string,
    leadName?: string,
    leadPhone?: string
  ) => Promise<void>;
  pauseAutoDialer: () => void;
  resumeAutoDialer: () => void;
  advanceToNext: () => Promise<void>;
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
  refreshTrigger: number;
  // Backwards compatibility properties
  queue: AutoDialerLead[];
  currentIndex: number;
}

const AutoDialerContext = createContext<AutoDialerContextType | undefined>(
  undefined
);

export const AutoDialerProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [status, setStatus] = useState<AutoDialerStatus>("idle");
  const [currentLead, setCurrentLead] = useState<AutoDialerLead | null>(null);
  const [countdown, setCountdown] = useState<number>(5);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [dispositions, setDispositions] = useState<any[]>([]);
  const [lastActivityId, setLastActivityId] = useState<string | null>(null);
  const [lastCallInfo, setLastCallInfo] = useState<{ call_id?: string | null; recording_url?: string | null }>({});
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const [stats, setStats] = useState<AutoDialerStats>({
    total: 0,
    completed: 0,
    skipped: 0,
  });

  const currentLeadRef = useRef<AutoDialerLead | null>(null);
  const statusRef = useRef<AutoDialerStatus>("idle");
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const callDurationTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    currentLeadRef.current = currentLead;
  }, [currentLead]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

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

  // Dial specific lead
  const dialLead = async (leadId: string, leadName?: string, phone?: string) => {
    clearTimers();

    if (!phone) {
      toast.warn(`Skipping ${leadName || "Lead"} (No phone number)`);
      setStats((s) => ({ ...s, skipped: s.skipped + 1 }));
      setTimeout(() => {
        advanceToNext();
      }, 1500);
      return;
    }

    setIsLoading(true);
    setStatus("dialing");

    try {
      const res = await AxiosProvider.post("/leads/dialer/call-next", {
        lead_id: leadId,
      });

      setLastCallInfo({
        call_id: res.data?.data?.call_id || null,
        recording_url: res.data?.data?.recording_url || null,
      });
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

      toast.success(`Calling ${leadName || phone}...`);
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

  // Advance to next assigned lead in queue
  const advanceToNext = async () => {
    clearTimers();
    const currentId = currentLeadRef.current?.id;
    if (!currentId) {
      stopAutoDialer();
      return;
    }

    setIsLoading(true);
    try {
      const res = await AxiosProvider.get("/leads/assigned/next", {
        params: { current_lead_id: currentId },
      });

      const nextLead = res.data?.data;
      const isLoop = res.data?.is_loop;

      if (!nextLead || isLoop) {
        setStatus("completed");
        toast.success("🎉 Auto-Dialer finished! All assigned leads completed.");
        return;
      }

      // Smoothly navigate the UI to the next lead details page
      router.push(`/leadsdetails?id=${nextLead.id}`);

      const nextLeadObj: AutoDialerLead = {
        id: nextLead.id,
        lead_number: nextLead.lead_number,
        full_name: nextLead.full_name,
        phone: nextLead.phone || nextLead.whatsapp_number,
        whatsapp_number: nextLead.whatsapp_number,
        email: nextLead.email,
        lead_status: nextLead.lead_status,
        city: nextLead.city,
        state: nextLead.state,
        country: nextLead.country,
        best_time_to_call: nextLead.best_time_to_call,
        note: nextLead.note,
      };

      setCurrentLead(nextLeadObj);
      currentLeadRef.current = nextLeadObj;
      setStats((s) => ({ ...s, total: s.total + 1 }));

      // Immediately dial the next lead
      await dialLead(
        nextLead.id,
        nextLead.full_name,
        nextLead.phone || nextLead.whatsapp_number
      );
    } catch (err: any) {
      console.error("AutoDialer advance error:", err);
      toast.error("Failed to fetch next assigned lead");
      setStatus("paused");
    } finally {
      setIsLoading(false);
    }
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

  /**
   * 1. Start Auto-Dialer directly from a Lead Details screen
   */
  const startAutoDialerFromLead = async (
    leadId: string,
    leadName?: string,
    leadPhone?: string
  ) => {
    clearTimers();
    setIsOpen(true);
    setIsMinimized(false);

    const leadObj: AutoDialerLead = {
      id: leadId,
      full_name: leadName,
      phone: leadPhone,
    };
    setCurrentLead(leadObj);
    currentLeadRef.current = leadObj;
    setStats({ total: 1, completed: 0, skipped: 0 });

    toast.success("⚡ Auto-Dialer started!");
    await dialLead(leadId, leadName, leadPhone);
  };

  /**
   * 2. Start Auto-Dialer (e.g. from Dashboard or generic start)
   */
  const startAutoDialer = async (startLeadId?: string) => {
    if (startLeadId) {
      await startAutoDialerFromLead(startLeadId);
      return;
    }

    // Fetch the first assigned lead in queue
    setIsLoading(true);
    try {
      const res = await AxiosProvider.get("/leads/assigned/next");
      const firstLead = res.data?.data;
      if (!firstLead || !firstLead.id) {
        toast.info("No assigned leads found to auto-dial.");
        return;
      }

      router.push(`/leadsdetails?id=${firstLead.id}`);
      await startAutoDialerFromLead(
        firstLead.id,
        firstLead.full_name,
        firstLead.phone || firstLead.whatsapp_number
      );
    } catch (err: any) {
      console.error("Failed to start auto-dialer:", err);
      toast.error(err?.response?.data?.message || "Failed to start auto-dialer");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 3. Pause Auto-Dialer
   */
  const pauseAutoDialer = () => {
    clearTimers();
    setStatus("paused");
    toast.info("⏸️ Auto-Dialer paused.");
  };

  /**
   * 4. Resume Auto-Dialer
   */
  const resumeAutoDialer = () => {
    toast.success("▶️ Auto-Dialer resumed.");
    if (statusRef.current === "wrap-up") {
      advanceToNext();
    } else {
      dialCurrentLead();
    }
  };

  /**
   * 5. Skip Current Lead
   */
  const skipCurrentLead = () => {
    setStats((s) => ({ ...s, skipped: s.skipped + 1 }));
    toast.info(`Skipped ${currentLead?.full_name || "Lead"}`);
    advanceToNext();
  };

  /**
   * 6. Dial Current Lead Immediately
   */
  const dialCurrentLead = async () => {
    clearTimers();
    if (currentLead?.id) {
      await dialLead(
        currentLead.id,
        currentLead.full_name,
        currentLead.phone || currentLead.whatsapp_number
      );
    }
  };

  /**
   * 7. Save Disposition & Notes and Advance
   */
  const saveDispositionAndNext = async (
    dispositionId: string,
    conversationNote: string,
    leadStatus?: string
  ) => {
    if (!currentLead) return;

    try {
      const selectedDisp = dispositions.find((d) => d.id === dispositionId);
      const dispName = (selectedDisp?.name || "").trim().toLowerCase();
      const nonConnected = [
        "no answer",
        "blank call",
        "dnd",
        "do not disturb",
        "busy",
        "ringing",
        "switch off",
        "switched off",
        "not reachable",
        "wrong number",
        "voice mail full",
        "voice mail not set",
        "sms conversation",
        "email conversation",
        "whatsapp conversation",
      ].some((k) => dispName === k || dispName.includes(k));

      await AxiosProvider.post("/leads/dialer/quick-disposition", {
        lead_id: currentLead.id,
        activity_id: lastActivityId || undefined,
        disposition_id: dispositionId || undefined,
        conversation: conversationNote || "Auto-dialer call completed",
        lead_status: leadStatus || undefined,
        call_id: nonConnected ? undefined : (lastCallInfo.call_id || undefined),
        recording_url: nonConnected ? undefined : (lastCallInfo.recording_url || undefined),
        duration_seconds: nonConnected ? undefined : (callDuration || undefined),
      });

      setStats((s) => ({ ...s, completed: s.completed + 1 }));
      setRefreshTrigger((prev) => prev + 1);
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("lead-activity-updated", {
            detail: { lead_id: currentLead.id },
          })
        );
      }
      toast.success("Activity & disposition saved");
      setLastCallInfo({});
      setLastActivityId(null);

      // Immediately advance to next lead!
      await advanceToNext();
    } catch (err: any) {
      console.error("Failed to save quick disposition:", err);
      toast.error("Failed to save disposition, continuing...");
      await advanceToNext();
    }
  };

  /**
   * 8. Stop / End Auto-Dialer Session
   */
  const stopAutoDialer = () => {
    clearTimers();
    setStatus("idle");
    setIsOpen(false);
    setCurrentLead(null);
    currentLeadRef.current = null;
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
        currentLead,
        countdown,
        callDuration,
        stats,
        dispositions,
        isLoading,
        lastActivityId,
        startAutoDialer,
        startAutoDialerFromLead,
        pauseAutoDialer,
        resumeAutoDialer,
        advanceToNext,
        skipCurrentLead,
        dialCurrentLead,
        saveDispositionAndNext,
        stopAutoDialer,
        toggleMinimize,
        setIsOpen,
        refreshTrigger,
        queue: currentLead ? [currentLead] : [],
        currentIndex: 0,
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
