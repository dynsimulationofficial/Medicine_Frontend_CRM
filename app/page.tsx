"use client";
import Image from "next/image";
import { useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
//import { AppContext } from "./AppContext";
import AxiosProvider from "../provider/AxiosProvider";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast } from "react-toastify";
import StorageManager from "../provider/StorageManager";
import { FaRegEye } from "react-icons/fa";
import { FaRegEyeSlash } from "react-icons/fa";
import { constrainedMemory } from "process";
import Link from "next/link";
import UserActivityLogger from "../provider/UserActivityLogger";
import { isTokenExpired } from "./component/utils/authUtils";

const storage = new StorageManager();

interface FormValues {
  email: string;
  password: string;
}
export default function LoginHome() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const storage = new StorageManager();
  const aaaaa = storage.getAccessToken();

  const axiosProvider = new AxiosProvider();
  //const { setAccessToken } = useContext(AppContext);

  const validationSchema = Yup.object().shape({
    email: Yup.string()
      .email("Enter a valid email")
      .required("Email is required"),
    password: Yup.string().required("Password is required"),
    terms: Yup.bool()
      .oneOf([true], "You must accept the Terms & Privacy Policy")
      .required("You must accept the Terms & Privacy Policy"),
  });

  const handleSubmitLogin = async (values: FormValues) => {
    setLoading(true);
    try {
      const res = await AxiosProvider.post("/sendotp", {
        email: values.email,
        password: values.password,
      });
      //console.log("LOG IN", res.data.data.role);
      storage.saveUserRole(res.data.data.role);

      // console.log(res.data.data.secretKey);
      // storage.saveUserId(res.data.data.id);
      // storage.saveUserSecretKey(res.data.data.secretKey);
      // storage.saveUserName(res.data.data.name);
      // await storage.saveUserPermissions(res.data.data.permissions);
      storage.saveUserEmail(values.email);
      // const activityLogger = new UserActivityLogger();
      //  await activityLogger.userLogin();
      const successMsg = res?.data?.msg || res?.data?.message || "OTP sent to your email successfully";
      toast.success(successMsg);
      storage.saveUserName(res.data.data.name);
      storage.saveUserId(res.data.data.system_user_id);
      router.push("/otp");
    } catch (error: any) {
      console.error("Login request OTP error:", error);
      const errorMsg =
        error?.response?.data?.msg ||
        error?.response?.data?.message ||
        "Invalid email or password. Please try again.";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // const value = localStorage.getItem("accessToken");
  // value === null ?
  // console.log("OOOOOOOOOOOOOOO", value);
  useEffect(() => {
    const token = storage.getAccessToken(); // Get token from localStorage via StorageManager

    // If token exists and is not expired, redirect to dashboard
    if (token && !isTokenExpired(token)) {
      router.replace("/dashboard"); // Redirect to the Dashboard page
    }
  }, [router]);

  return (
    <>
      {/* <div className="bg-[#F5F5F5] hidden md:block">
        <Image
          src="/images/orizon-login-bg.svg"
          alt="Orizon iconLogo bg"
          width={100}
          height={100}
          className="w-full h-[100vh]"
        />
        <Image
          src="/images/orizonIcon.svg"
          alt="OrizonIcon"
          width={82}
          height={52}
          className=" absolute top-20 left-28"
        />
        <Image
          src="/images/orizonIcon.svg"
          alt="OrizonIcon"
          width={82}
          height={52}
          className=" absolute top-32 right-28"
        />
        <Image
          src="/images/orizonIcon.svg"
          alt="OrizonIcon"
          width={82}
          height={52}
          className=" absolute  top-1/2 left-[25%]"
        />
        <Image
          src="/images/orizonIcon.svg"
          alt="OrizonIcon"
          width={82}
          height={52}
          className=" absolute  top-[60%] right-[25%]"
        />
        <Image
          src="/images/orizonIcon.svg"
          alt="OrizonIcon"
          width={82}
          height={52}
          className=" absolute  top-[90%] right-0 left-0 mx-auto"
        />
      </div> */}
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-[410px] shadow-loginBoxShadow px-6 sm:px-7 py-7 rounded-xl mainContainerBg border border-gray-800">
        <Image
          src="/images/crmlogo.png"
          alt="CRM Logo"
          width={150}
          height={100}
          className="mx-auto mb-3 object-contain"
        />
        <p className="font-semibold text-base sm:text-lg leading-normal text-center text-white mb-5">
          Login to LEAD CRM
        </p>
        <Formik
          initialValues={{ email: "", password: "", terms: false }}
          validationSchema={validationSchema}
          onSubmit={handleSubmitLogin}
        >
          {({ setFieldValue }) => (
            <Form className="w-full space-y-4">
              {/* Email Field */}
              <div>
                <p className="text-gray-200 text-sm font-medium mb-1.5">Email</p>
                <Field
                  type="text"
                  name="email"
                  autoComplete="username"
                  placeholder="Enter your User ID/Email"
                  className="focus:outline-none w-full h-[40px] border border-gray-700 rounded-md text-sm px-3.5 text-white hover:border-gray-500 focus:border-primary-500 bg-black transition-colors placeholder:text-gray-500 placeholder:text-sm"
                />
                <ErrorMessage
                  name="email"
                  component="div"
                  className="text-red-500 text-xs mt-1"
                />
              </div>

              {/* Password Field */}
              <div>
                <p className="text-gray-200 text-sm font-medium mb-1.5">Password</p>
                <div className="relative">
                  <Field
                    type={showPassword ? "text" : "password"}
                    name="password"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFieldValue("password", e.target.value)
                    }
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="focus:outline-none w-full h-[40px] border border-gray-700 rounded-md text-sm pl-3.5 pr-10 text-white hover:border-gray-500 focus:border-primary-500 bg-black transition-colors placeholder:text-gray-500 placeholder:text-sm"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute top-0 bottom-0 right-0 px-3 flex items-center text-gray-400 hover:text-white"
                  >
                    {showPassword ? <FaRegEye className="text-base" /> : <FaRegEyeSlash className="text-base" />}
                  </button>
                </div>
                <ErrorMessage
                  name="password"
                  component="div"
                  className="text-red-500 text-xs mt-1"
                />
              </div>

              {/* Terms Checkbox */}
              <div>
                <div className="flex items-center">
                  <Field
                    type="checkbox"
                    name="terms"
                    id="terms"
                    className="mr-2 w-3.5 h-3.5 rounded accent-primary-600 cursor-pointer shrink-0"
                  />
                  <label htmlFor="terms" className="text-[11px] text-gray-300 cursor-pointer whitespace-nowrap">
                    I agree to the{" "}
                    <a
                      href="/"
                      target="_blank"
                      className="underline text-primary-500 hover:text-primary-400"
                    >
                      Terms & Conditions
                    </a>{" "}
                    and{" "}
                    <a
                      href="/"
                      target="_blank"
                      className="underline text-primary-500 hover:text-primary-400"
                    >
                      Privacy Policy
                    </a>
                  </label>
                </div>
                <ErrorMessage
                  name="terms"
                  component="div"
                  className="text-red-500 text-xs mt-1"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary-600 rounded-md w-full h-[40px] text-center text-white text-sm font-semibold leading-normal hover:bg-primary-700 active:bg-primary-800 transition duration-150 shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Logging in..." : "Login"}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
    </>
  );
}
