// app/components/WebPushInitializer.tsx
"use client";

import { useEffect } from "react";
import { getToken } from "firebase/messaging";
import { messaging } from "../firebase-config";
import AxiosProvider from "../../provider/AxiosProvider";
import StorageManager from "../../provider/StorageManager";

const VAPID_KEY =
  "BPGmALJgnU2asXN4pqtYf85enB-Y3KbCkCwmSmxtSE3nWT69ghqbFAvIYxRsqntM6oR4jJTCpnpngmXIlJ7ik_k";

const WebPushInitializer = () => {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const setupAndRegisterFCM = async () => {
      const storage = new StorageManager();
      const token = storage.getAccessToken();

      // Only register if user is logged in
      if (!token) return;

      try {
        // 1. Register Service Worker
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.register(
            "/firebase-messaging-sw.js"
          );
          console.log("✅ Service Worker registered with scope:", registration.scope);

          // 2. Request Notification Permission
          if ("Notification" in window) {
            let permission = Notification.permission;
            if (permission === "default") {
              permission = await Notification.requestPermission();
            }

            if (permission === "granted" && messaging) {
              // 3. Get FCM Token
              const currentToken = await getToken(messaging, {
                vapidKey: VAPID_KEY,
                serviceWorkerRegistration: registration,
              });

              if (currentToken) {
                console.log("📲 FCM Token obtained:", currentToken.substring(0, 30) + "...");
                // 4. Send token to backend
                await AxiosProvider.post("/register-fcm", {
                  fcmtoken: currentToken,
                });
                console.log("🚀 FCM Token successfully registered with backend");
              }
            } else {
              console.log("ℹ️ Notification permission status:", permission);
            }
          }
        }
      } catch (error) {
        console.error("❌ Error setting up FCM Web Push:", error);
      }
    };

    setupAndRegisterFCM();
  }, []);

  return null;
};

export default WebPushInitializer;
