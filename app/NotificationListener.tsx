"use client";

import { useEffect } from "react";
import { onMessage } from "firebase/messaging";
import { toast } from "react-toastify";
import { messaging } from "./firebase-config";

const NotificationListener = () => {
  useEffect(() => {
    if (typeof window !== "undefined" && messaging) {
      // Handle foreground messages
      const unsubscribe = onMessage(messaging, (payload) => {
        console.log("📩 Notification received (foreground):", payload);

        const { notification, data } = payload;
        const title = notification?.title || "New Notification";
        const body = notification?.body || "Click to view details.";
        const leadId = data?.lead_id || data?.sample_lead_id || null;
        const targetUrl = leadId ? `/leadsdetails?id=${encodeURIComponent(leadId)}` : null;

        // 1. Trigger Windows / Desktop OS Notification Popup (Side banner)
        if ("Notification" in window && Notification.permission === "granted") {
          try {
            if ("serviceWorker" in navigator) {
              navigator.serviceWorker.ready.then((registration) => {
                registration.showNotification(title, {
                  body: body,
                  icon: "/images/crmlogo.png",
                  badge: "/images/crmlogo.png",
                  data: { url: targetUrl || "/" },
                });
              });
            } else {
              const notif = new Notification(title, {
                body: body,
                icon: "/images/crmlogo.png",
              });
              notif.onclick = () => {
                if (targetUrl) window.open(targetUrl, "_blank");
              };
            }
          } catch (e) {
            console.error("Desktop notification popup error:", e);
          }
        }

        // 2. Also show In-App Toast
        toast.info(
          <div>
            <p className="font-bold text-sm">{title}</p>
            <p className="text-xs text-gray-200 mt-0.5">{body}</p>
          </div>,
          {
            autoClose: 6000,
            onClick: () => {
              if (targetUrl) {
                window.open(targetUrl, "_blank");
              }
            },
            closeOnClick: true,
            pauseOnHover: true,
          }
        );
      });

      return () => unsubscribe();
    }
  }, []);

  return null;
};

export default NotificationListener;
