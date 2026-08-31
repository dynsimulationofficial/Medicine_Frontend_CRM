"use client";
import Image from "next/image";
import { useState, useEffect, useContext, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import AxiosProvider from "../../provider/AxiosProvider";
import StorageManager from "../../provider/StorageManager";
import { AppContext } from "../AppContext";
import UserActivityLogger from "../../provider/UserActivityLogger";
import OtpInput from "react-otp-input";
import { isTokenExpired } from "../component/utils/authUtils";

const axiosProvider = new AxiosProvider();

export default function OtpHome() {
  const storage = new StorageManager();
  const router = useRouter();
  const userEmail = storage.getUserEmail();

  const [loading, setLoading] = useState<boolean>(false);
  const [qrCode, setQrCode] = useState<string | undefined>();
  const [secretKey, setSecretKey] = useState<string | null>(
    storage.getDecryptedUserSecretKey(),
  );
  const [userId, setuserId] = useState<string | undefined>(storage.getUserId());
  const [otp, setOtp] = useState<string>("");
  const [isLogged, setIsLogged] = useState<boolean>(false);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const { setAccessToken } = useContext(AppContext);

  const handleChange = (val: string) => setOtp(val);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    if (otp.length !== 6) {
      toast.error("Please enter a valid 6-digit code.");
      setLoading(false);
      requestAnimationFrame(() => firstInputRef.current?.focus()); // 👈 add this
      return;
    }

    try {
      const res = await AxiosProvider.post("/login", {
        email: userEmail,
        otp: otp,
      });
      //  console.log("LOGIN SUCCESS", res.data.data.system_user_id);
      // setAccessToken(res.data.data.token);
      // storage.saveAccessToken(res.data.data.token);
      //  expiryTokenafter24Hour();
      //localStorage.setItem("authToken", res.data.data.token);
      await storage.saveAccessToken(res.data.data.token);
      await storage.saveUserId(res.data.data.system_user_id);
      if (res.data.data?.role_name || res.data.data?.role) {
        await storage.saveUserRole(
          res.data.data.role_name || res.data.data.role,
        );
      }
      const userRole = storage.getUserRole();
      const successMsg = res?.data?.msg || res?.data?.message || "Login Successful";
      toast.success(successMsg);
      if (userRole === "Admin") {
        router.push("/dashboard-admin");
      } else {
        router.push("/dashboard-agent");
      }
      setIsLogged(true);
      const activityLogger = new UserActivityLogger();
      // await activityLogger.userLogin();
    } catch (error: any) {
      console.error("Network error:", error);
      const errorMsg =
        error?.response?.data?.msg ||
        error?.response?.data?.message ||
        "Invalid Code. Please try again.";
      toast.error(errorMsg);
      setOtp("");
      requestAnimationFrame(() => firstInputRef.current?.focus()); // 👈 add this
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = storage.getAccessToken(); // Get token from localStorage via StorageManager

    // If token exists and is not expired, redirect to dashboard based on role
    if (token && !isTokenExpired(token)) {
      const userRole = storage.getUserRole();
      if (userRole === "Admin") {
        router.replace("/dashboard-admin");
      } else {
        router.replace("/dashboard-agent");
      }
    }
  }, [router]);

  return (
    <>
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[480px] shadow-loginBoxShadow px-6 sm:px-10 py-8 sm:py-10 rounded-xl mainContainerBg border border-gray-800 text-center">
        <Image
          src="/images/crmlogo.png"
          alt="CRM Logo"
          width={180}
          height={130}
          className="mx-auto mb-4 object-contain"
        />
        <p className="font-bold text-lg sm:text-xl leading-normal text-center text-white mb-2">
          Verify your email
        </p>
        {qrCode && (
          <Image
            src={qrCode}
            alt="QR Code"
            width={100}
            height={100}
            className="mx-auto mb-4"
          />
        )}
        <p className="text-sm text-gray-300 leading-relaxed text-center mb-6">
          We&apos;ve sent you a one-time password (OTP). Please enter it below
          to confirm your account.
        </p>
        <form onSubmit={handleSubmit} className="w-full">
          <div>
            <div className="flex items-center justify-between mb-8 w-full mx-auto">
              <OtpInput
                value={otp}
                onChange={handleChange}
                numInputs={6}
                shouldAutoFocus
                inputType="tel"
                containerStyle={{ display: "contents" }}
                renderInput={(props, index) => {
                  const { onChange, onKeyDown, ...rest } = props;
                  return (
                    <input
                      {...rest}
                      ref={index === 0 ? firstInputRef : undefined}
                      data-otp-index={index}
                      autoComplete="one-time-code"
                      onChange={(e) => {
                        onChange?.(e as any);
                        if (e.currentTarget.value.length === 1) {
                          const next = document.querySelector<HTMLInputElement>(
                            `input[data-otp-index="${index + 1}"]`,
                          );
                          next?.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        (onKeyDown as any)?.(e);
                        if (e.key === "Backspace" && !e.currentTarget.value) {
                          const prev = document.querySelector<HTMLInputElement>(
                            `input[data-otp-index="${index - 1}"]`,
                          );
                          prev?.focus();
                        }
                      }}
                      className="!w-[14%] md:!w-[52px] h-12 sm:h-14 py-2 sm:py-3 text-center border border-gray-700 rounded-[6px] text-white text-lg sm:text-xl font-semibold leading-normal focus:outline-none focus:border-primary-500 bg-black transition-colors"
                    />
                  );
                }}
              />
            </div>

            <div className="w-full">
              <button
                type="submit"
                className="bg-primary-600 rounded-[6px] w-full h-[48px] text-center text-white text-base font-semibold leading-normal hover:bg-primary-700 active:bg-primary-800 transition duration-150 shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? "Verifying OTP..." : "Verify OTP"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
    </>
  );
}
