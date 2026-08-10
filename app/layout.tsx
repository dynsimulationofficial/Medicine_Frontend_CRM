// app/layout.tsx
"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import dynamic from "next/dynamic";
import { ReactNode } from "react";
import "react-toastify/dist/ReactToastify.css";
import Script from "next/script";
import { usePathname } from "next/navigation";

import NotificationListener from "./NotificationListener";

// Client-only chunks
const ErrorBoundary = dynamic(() => import("./ErrorBoundary"), { ssr: false });
const AppProvider = dynamic(
  () => import("./AppContext").then((mod) => mod.AppProvider),
  { ssr: false }
);
const ToastContainer = dynamic(
  () => import("react-toastify").then((mod) => mod.ToastContainer),
  { ssr: false }
);

// 👉 Sidebar as client-only (safe if it uses hooks, router, localStorage, etc.)
const LeftSideBar = dynamic(() => import("./component/LeftSideBar"), {
  ssr: false,
});

const WebPushInitializer = dynamic(
  () => import("./component/WebPushInitializer"),
  { ssr: false }
);

const inter = Inter({ subsets: ["latin"] });

type RootLayoutProps = {
  children: ReactNode;
};

// Optional: export metadata if you want
// export const metadata = {
//   title: "Lead CRM",
//   description: "",
// };

export default function RootLayout({ children }: RootLayoutProps) {
    const pathname = usePathname();
  // Hide sidebar on "/" and "/opt"
  const hideSidebar = pathname === "/" || pathname === "/otp";
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <AppProvider>
            {/* Page shell: sidebar + main content */}
            <div className="min-h-dvh flex">
          {/* Sidebar column */}
              {!hideSidebar && <LeftSideBar />}

              {/* Main content column */}
              <main className="flex-1 min-w-0">{children}</main>
            </div>

            <NotificationListener />

            {/* Toasts */}
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
          </AppProvider>

          <WebPushInitializer />
        </ErrorBoundary>

{/* Production-only script to disable right-click */}
{process.env.NODE_ENV === "production" && (
  <Script id="disable-right-click" strategy="afterInteractive">
    {`
      document.addEventListener('contextmenu', function (e) {
        e.preventDefault();
      });
    `}
  </Script>
)}

      </body>
    </html>
  );
}
