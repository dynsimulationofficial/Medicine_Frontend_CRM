"use client";
import Image from "next/image";
import Tabs from "../component/Tabs";
import { useState } from "react";
import {
  Formik,
  Form,
  Field,
  ErrorMessage,
  FormikHelpers,
} from "formik";
import * as Yup from "yup";
import AxiosProvider from "../../provider/AxiosProvider";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import LeftSideBar from "../component/LeftSideBar";
import Select from "react-select";
import DesktopHeader from "../component/DesktopHeader";
import { useAuthRedirect } from "../component/hooks/useAuthRedirect";

interface FormValues {
  name: string;
  mobile_number: string;
  email: string;
  password: string;
  roleLevel: string;
}

const customSelectStyles = {
  control: (base: any, { isFocused }: any) => ({
    ...base,
    height: "38px",
    minHeight: "38px",
    backgroundColor: "#000",
    borderColor: isFocused ? "var(--primary-500, #0284c7)" : "#374151",
    borderRadius: 4,
    fontSize: "12px",
    boxShadow: "none",
    "&:hover": {
      borderColor: isFocused ? "var(--primary-500, #0284c7)" : "#4b5563",
    },
  }),
  valueContainer: (base: any) => ({
    ...base,
    height: "38px",
    padding: "0 8px",
  }),
  input: (base: any) => ({
    ...base,
    margin: "0px",
    padding: "0px",
    color: "#fff",
    fontSize: "12px",
  }),
  indicatorsContainer: (base: any) => ({
    ...base,
    height: "38px",
  }),
  singleValue: (base: any) => ({
    ...base,
    color: "#fff",
    fontSize: "12px",
  }),
  placeholder: (base: any) => ({
    ...base,
    color: "#aaa",
    fontSize: "12px",
  }),
  menu: (base: any) => ({
    ...base,
    borderRadius: 4,
    backgroundColor: "#000",
    border: "1px solid #374151",
    zIndex: 9999,
  }),
  option: (base: any, { isFocused, isSelected }: any) => ({
    ...base,
    backgroundColor: isSelected
      ? "var(--primary-600, #0284c7)"
      : isFocused
      ? "#222"
      : "#000",
    color: "#fff",
    cursor: "pointer",
    fontSize: "12px",
    padding: "8px 12px",
  }),
};

const roleOptions = [
  { value: "1", label: "Admin" },
  { value: "2", label: "Agent" },
];

const validationSchema = Yup.object().shape({
  name: Yup.string().required("Your name is required"),
  mobile_number: Yup.string()
    .matches(/^(\+91|\+1|\+44)\d{10}$/, "Mobile number must be exactly 10 digits")
    .required("Mobile number is required"),
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

export default function Home() {
  const isChecking = useAuthRedirect();
  const [showPassword, setShowPassword] = useState<boolean>(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (
    values: FormValues,
    { resetForm }: FormikHelpers<FormValues>,
  ) => {
    try {
      await AxiosProvider.post("/register", values);
      toast.success("Form submitted successfully!");
      resetForm();
    } catch (error: any) {
      if (error.response && error.response.status === 409) {
        toast.error(
          error.response?.data?.message ||
            error.response?.data?.msg ||
            "Conflict error occurred.",
        );
      } else {
        console.error("Error during registration:", error);
        toast.error("Failed to submit the form.");
      }
    }
  };

  const tabs = [
    {
      label: "Create New User",
      content: (
        <>
          {/* Tab content: Add User Form */}
          <div className="flex gap-8 pt-3 flex-col md:flex-row">
            <Formik
              initialValues={{
                name: "",
                mobile_number: "+91",
                email: "",
                password: "",
                roleLevel: "1",
              }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ setFieldValue, isSubmitting, values }) => (
                <Form className="w-full md:w-9/12">
                  <div className="w-full">
                    {/* Name & Mobile Number */}
                    <div className="w-full flex flex-col md:flex-row gap-6 mb-4">
                      <div className="w-full relative">
                        <p className="text-white text-xs font-medium mb-1.5">
                          Your Name
                        </p>
                        <Field
                          type="text"
                          name="name"
                          placeholder="Charlene Reed"
                          className="hover:shadow-hoverInputShadow focus:border-primary-600 w-full h-[38px] border border-gray-700 rounded-[4px] text-white text-xs placeholder-gray-400 px-3 bg-black outline-none"
                        />
                        <ErrorMessage
                          name="name"
                          component="div"
                          className="text-red-500 absolute top-[62px] text-xs"
                        />
                      </div>

                      <div className="w-full relative">
                        <p className="text-white text-xs font-medium mb-1.5">
                          Mobile Number
                        </p>
                        <div className="flex w-full h-[38px] border border-gray-700 rounded-[4px] bg-black overflow-hidden hover:shadow-hoverInputShadow focus-within:border-primary-600">
                          <select
                            className="h-full bg-black text-white text-xs border-r border-gray-700 px-2 outline-none cursor-pointer"
                            value={
                              values.mobile_number.startsWith("+1")
                                ? "+1"
                                : values.mobile_number.startsWith("+44")
                                ? "+44"
                                : "+91"
                            }
                            onChange={(e) => {
                              const currentCode = values.mobile_number.startsWith(
                                "+1",
                              )
                                ? "+1"
                                : values.mobile_number.startsWith("+44")
                                ? "+44"
                                : "+91";
                              const numberPart = values.mobile_number.replace(
                                currentCode,
                                "",
                              );
                              setFieldValue(
                                "mobile_number",
                                e.target.value + numberPart,
                              );
                            }}
                          >
                            <option value="+91">+91</option>
                            <option value="+1">+1</option>
                            <option value="+44">+44</option>
                          </select>
                          <input
                            type="text"
                            maxLength={10}
                            className="h-full w-full bg-black text-white text-xs px-3 outline-none placeholder-gray-400"
                            placeholder="Enter mobile number"
                            value={(() => {
                              const code = values.mobile_number.startsWith("+1")
                                ? "+1"
                                : values.mobile_number.startsWith("+44")
                                ? "+44"
                                : "+91";
                              return values.mobile_number.substring(
                                code.length,
                              );
                            })()}
                            onChange={(e) => {
                              const code = values.mobile_number.startsWith(
                                "+1",
                              )
                                ? "+1"
                                : values.mobile_number.startsWith("+44")
                                ? "+44"
                                : "+91";
                              const digitsOnly = e.target.value.replace(
                                /\D/g,
                                "",
                              );
                              setFieldValue(
                                "mobile_number",
                                code + digitsOnly,
                              );
                            }}
                          />
                        </div>
                        <ErrorMessage
                          name="mobile_number"
                          component="div"
                          className="text-red-500 absolute top-[62px] text-xs"
                        />
                      </div>
                    </div>

                    {/* Email & Password */}
                    <div className="w-full flex flex-col md:flex-row gap-6 mb-4">
                      <div className="w-full relative">
                        <p className="text-white text-xs font-medium mb-1.5">
                          Email
                        </p>
                        <Field
                          type="email"
                          name="email"
                          placeholder="Janedoe@gmail.com"
                          className="hover:shadow-hoverInputShadow focus:border-primary-600 w-full h-[38px] border border-gray-700 rounded-[4px] text-white text-xs placeholder-gray-400 px-3 bg-black outline-none"
                        />
                        <ErrorMessage
                          name="email"
                          component="div"
                          className="text-red-500 absolute top-[62px] text-xs"
                        />
                      </div>

                      <div className="w-full relative">
                        <p className="text-white text-xs font-medium mb-1.5">
                          Password
                        </p>
                        <Field
                          type={showPassword ? "text" : "password"}
                          name="password"
                          placeholder="********"
                          className="hover:shadow-hoverInputShadow focus:border-primary-600 w-full h-[38px] border border-gray-700 rounded-[4px] text-white text-xs placeholder-gray-400 px-3 bg-black outline-none"
                        />
                        {showPassword ? (
                          <FaRegEye
                            onClick={togglePasswordVisibility}
                            className="absolute top-8 right-3 text-gray-400 text-[15px] cursor-pointer"
                          />
                        ) : (
                          <FaRegEyeSlash
                            onClick={togglePasswordVisibility}
                            className="absolute top-8 right-3 text-gray-400 text-[15px] cursor-pointer"
                          />
                        )}
                        <ErrorMessage
                          name="password"
                          component="div"
                          className="text-red-500 absolute top-[62px] text-xs"
                        />
                      </div>
                    </div>

                    {/* Role Dropdown */}
                    <div className="w-full md:w-[49%] relative mb-6">
                      <p className="text-white text-xs font-medium mb-1.5">
                        Role
                      </p>
                      <Select
                        options={roleOptions}
                        value={
                          roleOptions.find(
                            (option) => option.value === values.roleLevel,
                          ) || null
                        }
                        onChange={(selectedOption) =>
                          setFieldValue(
                            "roleLevel",
                            selectedOption ? selectedOption.value : "",
                          )
                        }
                        onBlur={() =>
                          setFieldValue("roleLevel", values.roleLevel)
                        }
                        isSearchable={false}
                        isClearable
                        placeholder="Select Role"
                        styles={customSelectStyles}
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="w-full flex gap-6">
                      <div className="w-full flex justify-between">
                        <div className="w-full md:w-[49%]">
                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-[38px] bg-primary-600 rounded-[4px] text-white text-xs font-semibold hover:bg-primary-700 cursor-pointer transition flex items-center justify-center"
                          >
                            {isSubmitting ? "Submitting..." : "Submit"}
                          </button>
                        </div>
                        <div className="hidden md:block w-[49%]"></div>
                      </div>
                    </div>
                  </div>
                </Form>
              )}
            </Formik>
            <ToastContainer />
          </div>
        </>
      ),
    },
  ];

  if (isChecking) {
    return (
      <div className="h-screen flex flex-col gap-5 justify-center items-center bg-white">
        <Image
          src="/images/crmlogo.png"
          alt="Loading"
          width={150}
          height={150}
          className="animate-pulse rounded"
        />
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end min-h-screen">
        <LeftSideBar />
        {/* Main content right section */}
        <div className="ml-[97px] w-full md:w-[90%] m-auto min-h-[500px] rounded p-4 mt-0">
          <DesktopHeader />
          <div className="w-full flex justify-center relative">
            <div className="w-full min-h-[600px] rounded-[25px]">
              <div className="p-2 md:p-0">
                <Tabs tabs={tabs} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
