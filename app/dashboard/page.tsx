"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import StorageManager from "../../provider/StorageManager";
import { useAuthRedirect } from "../component/hooks/useAuthRedirect";

export default function DashboardGatewayPage() {
  const isChecking = useAuthRedirect();
  const router = useRouter();
  const storage = new StorageManager();
  const userRole = storage.getUserRole();

  useEffect(() => {
    if (!isChecking) {
      if (userRole === "Admin") {
        router.replace("/dashboard-admin");
      } else {
        router.replace("/dashboard-agent");
      }
    }
  }, [isChecking, userRole, router]);

  return (
    <div className="h-screen flex flex-col justify-center items-center bg-black text-white">
      <Image
        src="/images/crmlogo.jpg"
        alt="Loading"
        width={140}
        height={140}
        className="animate-pulse rounded-full mb-4"
      />
      <p className="text-gray-400 text-sm animate-pulse">Redirecting to your Dashboard...</p>
    </div>
  );
}
