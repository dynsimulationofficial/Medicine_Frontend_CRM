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
  campaign_id?: string;
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
  startAssignedAutoDialer: (
    leadId: string,
    leadName?: string,
    leadPhone?: string
  ) => Promise<void>;
  startCampaignDialer: (
    campaignId: string,
    campaignName?: string
  ) => Promise<void>;
  isAssignedQueue: boolean;
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
    leadStatus?: string,
    targetLeadId?: string
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
  const [isAssignedQueue, setIsAssignedQueue] = useState<boolean>(false);

  const currentLeadRef = useRef<AutoDialerLead | null>(null);
  const statusRef = useRef<AutoDialerStatus>("idle");
  const activeCampaignIdRef = useRef<string | null>(null);
  const activeCampaignNameRef = useRef<string | null>(null);
  const campaignQueueRef = useRef<AutoDialerLead[]>([]);
  const campaignIndexRef = useRef<number>(0);
  const isAssignedQueueRef = useRef<boolean>(false);

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
      const fallbackList = [
        { id: "fbc5af04-3f2c-41d1-8b65-7c65e84b95a1", name: "Phone Conversation" },
        { id: "5cfec775-44db-4051-bf7b-b43839b0123a", name: "No Answer" },
        { id: "b6e6c7df-9c4d-4737-9a42-0fba8c7a04d2", name: "Left A Voice Mail" },
        { id: "9e2b8a76-d9ed-46c8-8a56-3de9fdaafc7f", name: "Blank Call" },
        { id: "6f4a283f-3086-442d-b5fb-52c5f82c1c4e", name: "Voice Mail Full" },
        { id: "ea8fddbc-83f0-4495-83d6-c68f12a7fd5e", name: "Voice Mail Not Set" },
        { id: "c28b5e4a-9e12-4c28-98e3-0d6e2e5b7b01", name: "DND" },
        { id: "0d9a2c0f-2b49-4666-8c89-89a9e093c777", name: "WhatsApp Conversation" },
        { id: "71a29c1b-84ac-4a39-a6dd-7f891f32de52", name: "Email Conversation" },
        { id: "14d40c0a-5189-49cc-8790-5c9a69e4c5b3", name: "SMS Conversation" },
        { id: "d7524d2d-57e6-48aa-bcb2-3506fee8a3b4", name: "Others" },
      ];

      try {
        let res = await AxiosProvider.get("/leads/dispositions/all");
        let list = Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data)
          ? res.data
          : [];

        if (list.length === 0) {
          res = await AxiosProvider.get("/leads/dispositions");
          list = Array.isArray(res.data?.data)
            ? res.data.data
            : Array.isArray(res.data)
            ? res.data
            : [];
        }

        if (list.length > 0) {
          setDispositions(list);
        } else {
          setDispositions(fallbackList);
        }
      } catch (err) {
        console.warn("AutoDialer: Error fetching dispositions, using fallback list:", err);
        setDispositions(fallbackList);
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
  const lastCompletedLeadIdRef = useRef<string | null>(null);

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

        // STRICT: Admin must NEVER screen-pop or be redirected to lead details! Only agents get screen-pop.
        if (userRole === "admin") return;

        const res = await AxiosProvider.get("/leads/dialer/active-call");
        const stoppedCamps: string[] = res.data?.stopped_campaigns || [];
        if (activeCampaignIdRef.current && stoppedCamps.includes(activeCampaignIdRef.current)) {
          setActiveCampaignId(null);
          activeCampaignIdRef.current = null;
          setActiveCampaignName(null);
          activeCampaignNameRef.current = null;
          toast.info("⏹️ Campaign calling was stopped by Admin.");
        }

        const activeCall = res.data?.data;
        if (!activeCall || !activeCall.lead_id) {
          return;
        }

        // Never screen pop a lead that was already completed / wrapped-up
        if (activeCall.lead_id === lastCompletedLeadIdRef.current) {
          return;
        }

        // If this lead is already currently active in the dialer, do not restart session
        if (currentLeadRef.current?.id === activeCall.lead_id) {
          return;
        }

        if (
          activeCall.lead_id &&
          activeCall.lead_id !== lastPoppedLeadIdRef.current &&
          Date.now() - Number(activeCall.timestamp || 0) < 900000
        ) {
          lastPoppedLeadIdRef.current = activeCall.lead_id;
          isScreenPoppedCallRef.current = true;

          if (activeCall.campaign_id) {
            setActiveCampaignId(activeCall.campaign_id);
            activeCampaignIdRef.current = activeCall.campaign_id;
          }

          // Set active lead in context so bottom bar shows customer name, phone, etc.
          const connectedLead: AutoDialerLead = {
            id: activeCall.lead_id,
            lead_number: activeCall.lead_number,
            full_name: activeCall.full_name,
            phone: activeCall.phone,
            campaign_id: activeCall.campaign_id || undefined,
          };
          setCurrentLead(connectedLead);
          currentLeadRef.current = connectedLead;
          setStatus("in-call");
          setIsOpen(true);
          setIsMinimized(false);
          startCallTimer();
          startCallSession(activeCall.lead_id, activeCall.full_name, activeCall.phone, activeCall.call_id);

          // Smooth Next.js client-side navigation (NEVER window.location.href which causes hard page reload)
          if (typeof window !== "undefined") {
            const targetUrl = `/leadsdetails?id=${activeCall.lead_id}`;
            const currentUrl = window.location.pathname + window.location.search;
            if (currentUrl !== targetUrl) {
              router.push(targetUrl);
            }
          }
          toast.info(`📞 Live Call: ${activeCall.full_name || "Customer"}`);
        }
      } catch {}
    }, 1500);

    return () => clearInterval(interval);
  }, [router]);

  // Start active call monitoring (18s ring countdown + CloudTalk status poller)
  const startCallSession = (
    leadId: string,
    leadName?: string,
    phone?: string,
    callId?: string | null
  ) => {
    setStatus("in-call");
    startCallTimer();

    // Start 35-second Smart Ring Timeout / Auto-skip (stops immediately when answered)
    setRingSecondsLeft(35);
    let callAnswered = false;
    if (ringTimerRef.current) clearInterval(ringTimerRef.current);
    ringTimerRef.current = setInterval(() => {
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
          // Handle unanswered call timeout
          (async () => {
            const isCampaign = Boolean(activeCampaignIdRef.current);
            const isQueue = Boolean(isAssignedQueueRef.current);
            if (isCampaign || isQueue) {
              toast.info(`Auto-skipping ${leadName || "Lead"} (ring timeout - No answer)...`);
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
            } else {
              // Single manual call: no answer, switch to wrap-up to let agent set disposition without advancing
              toast.info(`Call to ${leadName || "Lead"} timed out (No answer).`);
              setStatus("wrap-up");
            }
          })();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Real-time CloudTalk Status Poller (Stops ring timeout when answered & advances when ended)
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

        // 1. Customer picked up ("Hello") -> Immediately STOP the 18s ring timeout!
        if ((callData?.isAnswered || callData?.activeCall?.is_connected) && !callAnswered) {
          callAnswered = true;
          if (ringTimerRef.current) {
            clearInterval(ringTimerRef.current);
            ringTimerRef.current = null;
          }
          setRingSecondsLeft(0);
          setStatus("in-call");
        }

        // 2. If call was answered and has now ended, enter wrap-up mode so agent can save disposition
        if (callAnswered && callData?.isEnded) {
          if (callStatusPollTimerRef.current) {
            clearInterval(callStatusPollTimerRef.current);
            callStatusPollTimerRef.current = null;
          }
          setStatus("wrap-up");
          toast.info(`Call ended with ${leadName || "Lead"}. Please save disposition to advance.`);
        }
      } catch {}
    }, 5000);
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
      startCallSession(leadId, leadName, phone, res.data?.data?.call_id);
    } catch (err: any) {
      console.error("AutoDialer call error:", err);
      const isOffline =
        err?.response?.data?.isOffline ||
        err?.response?.data?.message?.toLowerCase()?.includes("offline") ||
        err?.response?.data?.message?.toLowerCase()?.includes("online");

      if (isOffline) {
        setStatus("paused");
        clearTimers();

        const userRole = typeof window !== "undefined" ? (localStorage.getItem("userRole") || "").toLowerCase() : "";

        if (userRole === "admin") {
          Swal.fire({
            title: "Agent Shakeel is Offline in CloudTalk",
            html: `
              <div style="text-align: left; font-size: 13px; color: #d1d5db; line-height: 1.6;">
                <p style="margin-bottom: 10px;">
                  To connect campaign calls, your CloudTalk agent must be <b style="color:#10b981;">Online</b>.
                </p>
                <div style="background-color: #1f2937; padding: 12px; border-radius: 8px; border: 1px solid #374151;">
                  <p style="font-weight: 600; color: #f59e0b; margin-bottom: 6px;">⚠️ Current Status:</p>
                  <p style="color: #e5e7eb;">Agent <b>Shakeel Ahmed (Extension 1001)</b> is currently <b>Offline</b> in the CloudTalk Phone app.</p>
                  <p style="margin-top: 8px; color: #38bdf8;">👉 <b>Solution:</b> Please ask agent Shakeel to open the CloudTalk Phone app on their PC and set their status toggle to <b>Online (Green)</b>. Once online, click "Start Calling" again.</p>
                </div>
              </div>
            `,
            icon: "warning",
            background: "#181818",
            color: "#ffffff",
            iconColor: "#f59e0b",
            confirmButtonColor: "#0284c7",
            confirmButtonText: "Got It, Understood",
            customClass: {
              popup: "border border-gray-700 rounded-2xl shadow-2xl",
            },
          });
        } else {
          Swal.fire({
            title: "Your CloudTalk Phone is Offline",
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
        }
      } else {
        const errorMsg = String(
          err?.response?.data?.message || err?.response?.data?.msg || err?.message || ""
        ).toLowerCase();

        // If CloudTalk hit rate limit (too many calls/min), pause gracefully instead of skipping all leads!
        if (
          errorMsg.includes("rate limit") ||
          errorMsg.includes("429") ||
          errorMsg.includes("too many requests")
        ) {
          toast.warn("⏳ CloudTalk API Rate Limit reached. Dialing paused for 15s, please wait a moment...");
          setStatus("paused");
          clearTimers();
          return;
        }

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
        setStatus("paused");
        clearTimers();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Advance to next assigned lead or campaign lead in queue
  const advanceToNext = async () => {
    clearTimers();

    // If not in active campaign mode and not in assigned queue mode, do not advance
    const isCampaignMode = Boolean(activeCampaignIdRef.current);
    const isQueueMode = Boolean(isAssignedQueueRef.current);
    if (!isCampaignMode && !isQueueMode) {
      setStatus("completed");
      setTimeout(() => {
        setIsOpen(false);
      }, 800);
      return;
    }

    // 1. Campaign Queue Mode (Works across multiple PCs: Admin PC and Agent PC)
    const campId = activeCampaignIdRef.current;
    if (isCampaignMode && campId) {
      const q = campaignQueueRef.current;
      const nextIdx = campaignIndexRef.current + 1;
      setCampaignIndex(nextIdx);
      campaignIndexRef.current = nextIdx;

      let nextLead: AutoDialerLead | null = null;
      if (q && q.length > 0 && nextIdx < q.length) {
        nextLead = q[nextIdx];
      } else {
        // Fetch remaining pending leads for this campaign from DB
        try {
          const res = await AxiosProvider.get("/leads/dialer/queue", {
            params: { campaign_id: campId, limit: 10 },
          });
          const pendingLeads: any[] = res.data?.data?.leads || [];
          const candidate = pendingLeads.find((l: any) => l.id !== currentLeadRef.current?.id);
          if (candidate) {
            nextLead = {
              id: candidate.id,
              lead_number: candidate.lead_number,
              full_name: candidate.full_name,
              phone: candidate.phone || candidate.whatsapp_number,
              campaign_id: campId,
              campaign_name: candidate.campaign_name || activeCampaignNameRef.current || undefined,
            };
          }
        } catch (e) {
          console.error("Failed to query next campaign lead:", e);
        }
      }

      if (nextLead) {
        setCurrentLead(nextLead);
        currentLeadRef.current = nextLead;
        setStats((s) => ({ ...s, total: s.total + 1 }));

        toast.info(`📞 Dialing next campaign lead: ${nextLead.full_name || nextLead.phone}...`);
        router.push(`/leadsdetails?id=${nextLead.id}`);
        await dialLead(
          nextLead.id,
          nextLead.full_name,
          nextLead.phone || nextLead.whatsapp_number
        );
      } else {
        setStatus("completed");
        setActiveCampaignId(null);
        activeCampaignIdRef.current = null;
        toast.success(`🎉 Campaign "${activeCampaignNameRef.current || "Campaign"}" calling finished! All leads dialed.`);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("campaign-dialer-finished"));
        }
      }
      return;
    }

    // 2. Standard Assigned Leads Mode
    if (isQueueMode) {
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
          setIsAssignedQueue(false);
          isAssignedQueueRef.current = false;
          toast.success("🎉 Auto-Dialer finished! All assigned leads completed.");
          setTimeout(() => {
            setIsOpen(false);
          }, 1200);
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
          campaign_name: "Assigned Leads",
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
    }
  };

  // Start Wrap-up Mode (Waits for agent to click Save & Next, no auto-skipping)
  const startCountdown = () => {
    clearTimers();
    setStatus("wrap-up");
  };

  /**
   * 1. Start Single Call directly from a Lead Details screen
   */
  const startAutoDialerFromLead = async (
    leadId: string,
    leadName?: string,
    leadPhone?: string
  ) => {
    clearTimers();
    setActiveCampaignId(null);
    activeCampaignIdRef.current = null;
    setActiveCampaignName(null);
    activeCampaignNameRef.current = null;
    setCampaignQueue([]);
    campaignQueueRef.current = [];
    setCampaignIndex(0);
    campaignIndexRef.current = 0;
    setIsAssignedQueue(false);
    isAssignedQueueRef.current = false;
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

    toast.success("⚡ Calling lead...");
    await dialLead(leadId, leadName, leadPhone);
  };

  /**
   * 1.1 Start Continuous Auto-Dialer for Agent Assigned Leads
   */
  const startAssignedAutoDialer = async (
    leadId: string,
    leadName?: string,
    leadPhone?: string
  ) => {
    clearTimers();
    setActiveCampaignId(null);
    activeCampaignIdRef.current = null;
    setActiveCampaignName(null);
    activeCampaignNameRef.current = null;
    setCampaignQueue([]);
    campaignQueueRef.current = [];
    setCampaignIndex(0);
    campaignIndexRef.current = 0;
    setIsAssignedQueue(true);
    isAssignedQueueRef.current = true;
    setIsOpen(true);
    setIsMinimized(false);

    const leadObj: AutoDialerLead = {
      id: leadId,
      full_name: leadName,
      phone: leadPhone,
      campaign_name: "Assigned Leads",
    };
    setCurrentLead(leadObj);
    currentLeadRef.current = leadObj;
    setStats({ total: 1, completed: 0, skipped: 0 });

    toast.success("🚀 Auto-Dialer started! Calling assigned leads back-to-back...");
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
      // 1. Verify that CloudTalk agent (Shakeel) is Online
      try {
        const agentCheck = await AxiosProvider.get("/leads/dialer/agent-status");
        const agentData = agentCheck.data?.data;
        if (agentData && agentData.isOnline === false) {
          setIsLoading(false);
          Swal.fire({
            title: "Agent Shakeel is Offline in CloudTalk",
            html: `
              <div style="text-align: left; font-size: 13px; color: #d1d5db; line-height: 1.6;">
                <p style="margin-bottom: 10px;">
                  To connect campaign calls, your CloudTalk agent must be <b style="color:#10b981;">Online</b>.
                </p>
                <div style="background-color: #1f2937; padding: 12px; border-radius: 8px; border: 1px solid #374151;">
                  <p style="font-weight: 600; color: #f59e0b; margin-bottom: 6px;">⚠️ Current Status:</p>
                  <p style="color: #e5e7eb;">Agent <b>${agentData.agentName || "Shakeel Ahmed"} (Extension 1001)</b> is currently <b>Offline</b> in the CloudTalk Phone app.</p>
                  <p style="margin-top: 8px; color: #38bdf8;">👉 <b>Solution:</b> Please ask agent Shakeel to open the CloudTalk Phone app on their PC and set their status toggle to <b>Online (Green)</b>. Once online, click "Start Calling" again.</p>
                </div>
              </div>
            `,
            icon: "warning",
            background: "#181818",
            color: "#ffffff",
            iconColor: "#f59e0b",
            confirmButtonColor: "#0284c7",
            confirmButtonText: "Got It, Understood",
            customClass: {
              popup: "border border-gray-700 rounded-2xl shadow-2xl",
            },
          });
          return;
        }
      } catch {}

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
      setIsAssignedQueue(false);
      isAssignedQueueRef.current = false;

      // Notify backend to activate campaign
      AxiosProvider.post("/leads/dialer/start", { campaign_id: campaignId }).catch(() => {});

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

      // Start Campaign Calling: Immediately dial Lead 1
      try {
        toast.success(`🚀 Campaign started! Dialing Lead 1: ${firstLead.full_name || firstLead.phone}...`);
        await dialLead(firstLead.id, firstLead.full_name, firstLead.phone);
      } catch (callErr: any) {
        console.error("Dial lead error:", callErr);
        toast.error("Failed to dial first lead: " + (callErr?.message || "Unknown error"));
      }
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
  const pauseAutoDialer = async () => {
    clearTimers();
    setStatus("paused");
    if (activeCampaignIdRef.current) {
      try {
        await AxiosProvider.post("/leads/dialer/stop-parallel", {
          campaign_id: activeCampaignIdRef.current,
        });
      } catch {}
    }
    toast.info("⏸️ Campaign dialing paused.");
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
    leadStatus?: string,
    targetLeadId?: string
  ) => {
    const finalLeadId = targetLeadId || currentLead?.id;
    if (!finalLeadId) return;

    lastCompletedLeadIdRef.current = finalLeadId;
    clearTimers();
    setIsLoading(true);

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

      const isCampaignMode = Boolean(activeCampaignIdRef.current);
      const isQueueMode = Boolean(isAssignedQueueRef.current);
      const shouldAdvance = isCampaignMode || isQueueMode;

      const res = await AxiosProvider.post("/leads/dialer/save-and-advance", {
        lead_id: finalLeadId,
        activity_id: lastActivityId || undefined,
        disposition_id: dispositionId || undefined,
        conversation: conversationNote || (isCampaignMode || isQueueMode ? "Auto-dialer call completed" : "Manual call completed"),
        lead_status: leadStatus || undefined,
        campaign_id: isCampaignMode ? activeCampaignIdRef.current : undefined,
        is_campaign: isCampaignMode,
        is_assigned_queue: isQueueMode,
        advance: shouldAdvance,
        call_id: nonConnected ? undefined : (lastCallInfo.call_id || undefined),
        recording_url: nonConnected ? undefined : (lastCallInfo.recording_url || undefined),
        duration_seconds: nonConnected ? undefined : (callDuration || undefined),
      });

      setStats((s) => ({ ...s, completed: s.completed + 1 }));
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("lead-activity-updated", {
            detail: { lead_id: finalLeadId },
          })
        );
      }
      toast.success("Activity & disposition saved");
      setLastCallInfo({});

      const data = res.data;
      if (shouldAdvance && data?.has_next && data?.data?.next_lead) {
        const next = data.data.next_lead;
        lastPoppedLeadIdRef.current = next.id;
        setCampaignIndex((prev) => prev + 1);
        campaignIndexRef.current = campaignIndexRef.current + 1;

        const nextLeadObj: AutoDialerLead = {
          id: next.id,
          lead_number: next.lead_number,
          full_name: next.full_name,
          phone: next.phone,
          whatsapp_number: next.whatsapp_number,
          email: next.email,
          campaign_id: next.campaign_id || activeCampaignIdRef.current,
          campaign_name: activeCampaignNameRef.current || (isQueueMode ? "Assigned Leads" : undefined),
        };

        setCurrentLead(nextLeadObj);
        currentLeadRef.current = nextLeadObj;
        setStats((s) => ({ ...s, total: s.total + 1 }));

        // Connect via CloudTalk protocol if dialLink exists
        if (next.dialLink) {
          const iframe = document.createElement("iframe");
          iframe.style.display = "none";
          iframe.src = next.dialLink;
          document.body.appendChild(iframe);
          setTimeout(() => {
            try {
              document.body.removeChild(iframe);
            } catch {}
          }, 3000);
        }

        setLastCallInfo({
          call_id: next.call_id || null,
          recording_url: next.recording_url || null,
        });

        toast.info(`📞 Calling next lead: ${next.full_name || next.phone}...`);
        startCallSession(next.id, next.full_name, next.phone, next.call_id);

        // Smoothly navigate the UI to the next lead details page
        router.push(`/leadsdetails?id=${next.id}`);
      } else {
        setStatus("completed");
        const wasCampaign = Boolean(activeCampaignIdRef.current);
        const wasQueue = Boolean(isAssignedQueueRef.current);
        const campName = activeCampaignNameRef.current;
        setActiveCampaignId(null);
        activeCampaignIdRef.current = null;
        setActiveCampaignName(null);
        activeCampaignNameRef.current = null;
        setIsAssignedQueue(false);
        isAssignedQueueRef.current = false;
        if (data?.campaign_stopped) {
          toast.info("⏹️ Campaign calling was stopped by Admin. Activity saved.");
          setTimeout(() => {
            setIsOpen(false);
          }, 1200);
        } else if (wasCampaign) {
          toast.success(`🎉 Campaign "${campName || "Campaign"}" calling finished! All leads dialed.`);
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("campaign-dialer-finished"));
          }
        } else if (wasQueue) {
          toast.success("🎉 All your assigned leads have been dialed!");
          setTimeout(() => {
            setIsOpen(false);
          }, 1200);
        } else {
          // Single manual call finished: close the dialer bar smoothly
          setTimeout(() => {
            setIsOpen(false);
          }, 800);
        }
      }
    } catch (err: any) {
      console.error("Failed to save and advance:", err);
      toast.error("Error saving disposition: " + (err?.response?.data?.message || err?.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 9. Stop / End Auto-Dialer Session
   */
  const stopAutoDialer = () => {
    clearTimers();
    setIsAssignedQueue(false);
    isAssignedQueueRef.current = false;
    try {
      AxiosProvider.post("/leads/dialer/stop", {
        campaign_id: activeCampaignIdRef.current || undefined,
      }).catch(() => {});
    } catch {}
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
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("campaign-dialer-finished"));
    }
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
        startAssignedAutoDialer,
        startCampaignDialer,
        isAssignedQueue,
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
