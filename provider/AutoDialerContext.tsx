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
  startCampaignDialer: (
    campaignId: string,
    campaignName?: string
  ) => Promise<void>;
  activeCampaignId: string | null;
  activeCampaignName: string | null;
  ringSecondsLeft: number;
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
  markCallAsConnected: () => Promise<void>;
  campaignQueue: AutoDialerLead[];
  campaignIndex: number;
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

  // Campaign Calling States
  const [activeCampaignId, setActiveCampaignId] = useState<string | null>(null);
  const [activeCampaignName, setActiveCampaignName] = useState<string | null>(null);
  const [campaignQueue, setCampaignQueue] = useState<AutoDialerLead[]>([]);
  const [campaignIndex, setCampaignIndex] = useState<number>(0);
  const [ringSecondsLeft, setRingSecondsLeft] = useState<number>(18);

  const currentLeadRef = useRef<AutoDialerLead | null>(null);
  const statusRef = useRef<AutoDialerStatus>("idle");
  const activeCampaignIdRef = useRef<string | null>(null);
  const activeCampaignNameRef = useRef<string | null>(null);
  const campaignQueueRef = useRef<AutoDialerLead[]>([]);
  const campaignIndexRef = useRef<number>(0);

  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const callDurationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const ringTimerRef = useRef<NodeJS.Timeout | null>(null);
  const callStatusPollTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    currentLeadRef.current = currentLead;
  }, [currentLead]);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  useEffect(() => {
    activeCampaignIdRef.current = activeCampaignId;
  }, [activeCampaignId]);

  useEffect(() => {
    activeCampaignNameRef.current = activeCampaignName;
  }, [activeCampaignName]);

  useEffect(() => {
    campaignQueueRef.current = campaignQueue;
  }, [campaignQueue]);

  useEffect(() => {
    campaignIndexRef.current = campaignIndex;
  }, [campaignIndex]);

  // Load Dispositions on mount
  useEffect(() => {
    const fetchDispositions = async () => {
      try {
        const res = await AxiosProvider.get("/leads/dispositions");
        const list = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
          ? res.data
          : [];
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
    if (ringTimerRef.current) {
      clearInterval(ringTimerRef.current);
      ringTimerRef.current = null;
    }
    if (callStatusPollTimerRef.current) {
      clearInterval(callStatusPollTimerRef.current);
      callStatusPollTimerRef.current = null;
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

  // Track if current active call on agent was popped from screen-pop
  const isScreenPoppedCallRef = useRef<boolean>(false);

  // 🚀 Automatic Screen-Pop: Listen for live connected calls and auto-navigate to lead details
  const lastPoppedLeadIdRef = useRef<string | null>(null);
  useEffect(() => {
    // Continuously monitor active calls for Agents
    const interval = setInterval(async () => {
      try {
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("accessToken") || localStorage.getItem("token")
            : null;
        if (!token) return;

        const userRole =
          typeof window !== "undefined"
            ? (localStorage.getItem("userRole") || "").toLowerCase()
            : "";

        // STRICT ROLE IMMUNITY: Admin must NEVER screen-pop or be redirected to lead details!
        if (userRole === "admin") return;

        // If this tab is actively running the campaign dialer, keep it on current view
        if (activeCampaignIdRef.current) return;

        const res = await AxiosProvider.get("/leads/dialer/active-call");
        const activeCall = res.data?.data;
        if (
          activeCall &&
          activeCall.lead_id &&
          activeCall.lead_id !== lastPoppedLeadIdRef.current &&
          Date.now() - Number(activeCall.timestamp || 0) < 900000
        ) {
          lastPoppedLeadIdRef.current = activeCall.lead_id;
          isScreenPoppedCallRef.current = true;

          // Set active lead in context so bottom bar shows customer name, phone, etc.
          const connectedLead: AutoDialerLead = {
            id: activeCall.lead_id,
            lead_number: activeCall.lead_number,
            full_name: activeCall.full_name,
            phone: activeCall.phone,
          };
          setCurrentLead(connectedLead);
          currentLeadRef.current = connectedLead;
          setStatus("in-call");
          setIsOpen(true);
          setIsMinimized(false);
          startCallTimer();

          // Auto-navigate Agent screen to the lead details
          router.push(`/leadsdetails?id=${activeCall.lead_id}`);
          toast.info(`📞 Live Call: ${activeCall.full_name || "Customer"}`);
        }
      } catch {}
    }, 1500);

    return () => clearInterval(interval);
  }, [router]);

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

      // Start 35-second Smart Ring Timeout / Auto-skip (stops immediately when answered)
      setRingSecondsLeft(35);
      let callAnswered = false;
      if (ringTimerRef.current) clearInterval(ringTimerRef.current);
      ringTimerRef.current = setInterval(async () => {
        setRingSecondsLeft((prev) => {
          if (callAnswered) {
            if (ringTimerRef.current) {
              clearInterval(ringTimerRef.current);
              ringTimerRef.current = null;
            }
            return 0;
          }

          if (prev <= 1) {
            if (ringTimerRef.current) {
              clearInterval(ringTimerRef.current);
              ringTimerRef.current = null;
            }
            // Auto-skip unanswered call after 35s ring timeout
            (async () => {
              toast.info(`Auto-skipping ${leadName || "Lead"} (35s ring timeout - No answer)...`);
              try {
                await AxiosProvider.post("/leads/dialer/auto-skip-timeout", {
                  lead_id: leadId,
                  campaign_id: activeCampaignIdRef.current || undefined,
                });
                setStats((s) => ({ ...s, skipped: s.skipped + 1 }));
              } catch (e) {
                console.warn("Auto skip error:", e);
              }
              advanceToNext();
            })();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Real-time CloudTalk Status Poller (Stops ring timeout when answered & advances when ended)
      const callId = res.data?.data?.call_id;
      const dialedTimestamp = Date.now();
      if (callStatusPollTimerRef.current) clearInterval(callStatusPollTimerRef.current);
      callStatusPollTimerRef.current = setInterval(async () => {
        try {
          const statusRes = await AxiosProvider.get("/leads/dialer/call-status", {
            params: {
              call_id: callId || undefined,
              lead_id: leadId,
              phone: phone || undefined,
              since: dialedTimestamp,
            },
          });
          const callData = statusRes.data?.data;

          // 1. Customer picked up ("Hello") -> Immediately STOP the 35s drop timer!
          if ((callData?.isAnswered || callData?.activeCall?.is_connected) && !callAnswered) {
            callAnswered = true;
            if (ringTimerRef.current) {
              clearInterval(ringTimerRef.current);
              ringTimerRef.current = null;
            }
            setRingSecondsLeft(0);
            setStatus("in-call");
          }

          // 2. Call completed (disposition saved by agent or call ended in CloudTalk) -> Wait 3s and advance to next lead
          const isDone = callData?.isCompleted || (callAnswered && callData?.isEnded);
          if (isDone && Date.now() - dialedTimestamp > 5000) {
            if (callStatusPollTimerRef.current) {
              clearInterval(callStatusPollTimerRef.current);
              callStatusPollTimerRef.current = null;
            }
            if (ringTimerRef.current) {
              clearInterval(ringTimerRef.current);
              ringTimerRef.current = null;
            }
            toast.info(`Call completed for ${leadName || "Lead"}. Moving to next lead...`);
            setTimeout(() => {
              advanceToNext();
            }, 3000);
          }
        } catch {}
      }, 2000);
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
        const errorMsg = String(
          err?.response?.data?.message || err?.response?.data?.msg || err?.message || ""
        ).toLowerCase();

        // If agent is currently on a call, wait 6s and retry (do not skip remaining leads!)
        if (
          errorMsg.includes("already calling") ||
          errorMsg.includes("busy") ||
          errorMsg.includes("in a call") ||
          errorMsg.includes("on call") ||
          errorMsg.includes("another call")
        ) {
          toast.info("⏳ Agent is finishing call / wrap-up. Next call will start shortly...");
          setTimeout(() => {
            dialCurrentLead();
          }, 6000);
          return;
        }

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

  // Advance to next assigned lead or campaign lead in queue
  const advanceToNext = async () => {
    clearTimers();

    // 1. Campaign Queue Mode
    if (activeCampaignIdRef.current) {
      const q = campaignQueueRef.current;
      const nextIdx = campaignIndexRef.current + 1;
      setCampaignIndex(nextIdx);
      campaignIndexRef.current = nextIdx;

      if (nextIdx < q.length) {
        const nextLead = q[nextIdx];
        setCurrentLead(nextLead);
        currentLeadRef.current = nextLead;
        setStats((s) => ({ ...s, total: s.total + 1 }));

        // Background dialing: Agent stays on current page while phone rings
        await dialLead(
          nextLead.id,
          nextLead.full_name,
          nextLead.phone || nextLead.whatsapp_number
        );
      } else {
        setStatus("completed");
        setActiveCampaignId(null);
        activeCampaignIdRef.current = null;
        toast.success(`🎉 Campaign "${activeCampaignNameRef.current || ""}" calling finished! All leads dialed.`);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("campaign-dialer-finished"));
        }
      }
      return;
    }

    // 2. Standard Assigned Leads Mode
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

      // Smoothly navigate the UI to the next lead details page (Agents only)
      const userRole =
        typeof window !== "undefined"
          ? (localStorage.getItem("userRole") || "").toLowerCase()
          : "";
      if (userRole !== "admin") {
        router.push(`/leadsdetails?id=${nextLead.id}`);
      }

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

      const userRole =
        typeof window !== "undefined"
          ? (localStorage.getItem("userRole") || "").toLowerCase()
          : "";
      if (userRole !== "admin") {
        router.push(`/leadsdetails?id=${firstLead.id}`);
      }
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
   * 3. Start Auto-Dialer specifically for a Campaign
   */
  const startCampaignDialer = async (
    campaignId: string,
    campaignName?: string
  ) => {
    clearTimers();
    setIsLoading(true);
    try {
      const res = await AxiosProvider.get("/leads/dialer/queue", {
        params: { campaign_id: campaignId, limit: 200 },
      });
      const leadsList: any[] = res.data?.data?.leads || [];
      if (leadsList.length === 0) {
        Swal.fire({
          title: "All Leads Already Dialed",
          html: `
            <div style="text-align: left; font-size: 13px; color: #d1d5db; line-height: 1.5;">
              <p>All leads in campaign <b>"${campaignName || "Campaign"}"</b> have already been dialed.</p>
              <p style="margin-top: 8px; color: #10b981;">✅ No pending leads left to call (Anti-spam protection).</p>
            </div>
          `,
          icon: "info",
          background: "#181818",
          color: "#ffffff",
          confirmButtonColor: "#0284c7",
          confirmButtonText: "Got It",
          customClass: {
            popup: "border border-gray-700 rounded-2xl shadow-2xl",
          },
        });
        return;
      }

      setActiveCampaignId(campaignId);
      activeCampaignIdRef.current = campaignId;
      setActiveCampaignName(campaignName || "Campaign");
      activeCampaignNameRef.current = campaignName || "Campaign";

      const mappedLeads: AutoDialerLead[] = leadsList.map((l: any) => ({
        id: l.id,
        lead_number: l.lead_number,
        full_name: l.full_name,
        phone: l.phone || l.whatsapp_number,
        whatsapp_number: l.whatsapp_number,
        email: l.email,
        lead_status: l.lead_status,
        city: l.city,
        state: l.state,
        country: l.country,
        best_time_to_call: l.best_time_to_call,
        note: l.note,
        campaign_name: l.campaign_name || campaignName,
      }));

      setCampaignQueue(mappedLeads);
      campaignQueueRef.current = mappedLeads;
      setCampaignIndex(0);
      campaignIndexRef.current = 0;

      const userRole = typeof window !== "undefined" ? (localStorage.getItem("userRole") || "").toLowerCase() : "";
      if (userRole !== "admin") {
        setIsOpen(true);
        setIsMinimized(false);
      } else {
        setIsOpen(false);
      }
      setStats({ total: mappedLeads.length, completed: 0, skipped: 0 });

      const firstLead = mappedLeads[0];
      setCurrentLead(firstLead);
      currentLeadRef.current = firstLead;

      toast.success(
        `🚀 Starting Campaign calling for "${campaignName || "Campaign"}" (${mappedLeads.length} leads)...`
      );
      // Background dialing: Agent stays on current page while phone rings
      await dialLead(firstLead.id, firstLead.full_name, firstLead.phone);
    } catch (err: any) {
      console.error("startCampaignDialer error:", err);
      toast.error(err?.response?.data?.message || "Failed to load campaign queue");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 4. Pause Auto-Dialer
   */
  const pauseAutoDialer = () => {
    clearTimers();
    setStatus("paused");
    toast.info("⏸️ Auto-Dialer paused.");
  };

  /**
   * 5. Resume Auto-Dialer
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
   * 6. Skip Current Lead
   */
  const skipCurrentLead = async () => {
    clearTimers();
    if (currentLead) {
      try {
        await AxiosProvider.post("/leads/dialer/auto-skip-timeout", {
          lead_id: currentLead.id,
          campaign_id: activeCampaignIdRef.current || undefined,
        });
      } catch {}
    }
    setStats((s) => ({ ...s, skipped: s.skipped + 1 }));
    toast.info(`Skipped ${currentLead?.full_name || "Lead"}`);
    await advanceToNext();
  };

  /**
   * 7. Dial Current Lead Immediately
   */
  const dialCurrentLead = async () => {
    clearTimers();
    const targetLead = currentLeadRef.current || currentLead;
    if (targetLead?.id) {
      await dialLead(
        targetLead.id,
        targetLead.full_name,
        targetLead.phone || targetLead.whatsapp_number
      );
    }
  };

  /**
   * 8. Save Disposition & Notes and Advance
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
      // If this call was an incoming campaign call popped for the agent, do not advance personal assigned leads queue
      if (isScreenPoppedCallRef.current && !activeCampaignIdRef.current) {
        isScreenPoppedCallRef.current = false;
        clearTimers();
        setStatus("idle");
        setIsOpen(false);
        toast.success("Disposition & notes saved! Ready for next call.");
        return;
      }

      // Immediately advance to next lead!
      await advanceToNext();
    } catch (err: any) {
      console.error("Failed to save quick disposition:", err);
      toast.error("Failed to save disposition, continuing...");
      if (!isScreenPoppedCallRef.current || activeCampaignIdRef.current) {
        await advanceToNext();
      }
    }
  };

  /**
   * 9. Stop / End Auto-Dialer Session
   */
  const stopAutoDialer = () => {
    clearTimers();
    setStatus("idle");
    setIsOpen(false);
    setCurrentLead(null);
    currentLeadRef.current = null;
    setActiveCampaignId(null);
    activeCampaignIdRef.current = null;
    setActiveCampaignName(null);
    activeCampaignNameRef.current = null;
    setCampaignQueue([]);
    campaignQueueRef.current = [];
    setCampaignIndex(0);
    campaignIndexRef.current = 0;
    setLastActivityId(null);
    toast.info("Auto-Dialer session ended.");
  };

  const markCallAsConnected = async () => {
    try {
      const leadId = currentLeadRef.current?.id;
      if (leadId) {
        await AxiosProvider.post("/leads/dialer/call-connected", { lead_id: leadId });
        const userRole =
          typeof window !== "undefined"
            ? (localStorage.getItem("userRole") || "").toLowerCase()
            : "";
        if (userRole !== "admin") {
          router.push(`/leadsdetails?id=${leadId}`);
        }
        toast.success(`📞 Connected to ${currentLeadRef.current?.full_name || "Lead"}`);
      }
    } catch (err) {
      console.error("markCallAsConnected error:", err);
    }
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
        startCampaignDialer,
        activeCampaignId,
        activeCampaignName,
        ringSecondsLeft,
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
        markCallAsConnected: async () => {},
        campaignQueue,
        campaignIndex,
        queue: currentLead ? [currentLead] : [],
        currentIndex: campaignIndex,
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
