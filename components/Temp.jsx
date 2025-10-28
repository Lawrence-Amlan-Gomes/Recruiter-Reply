"use client";

import { getAllUsers2, registerUser } from "@/app/actions";
import colors from "@/app/color/color";
import { useAuth } from "@/app/hooks/useAuth";
import { useTheme } from "@/app/hooks/useTheme";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import EachField from "./EachField";
import Image from "next/image";

async function hashPassword(password, iterations = 10000) {
  try {
    const fixedSalt = "fixedSalt1234567890abcdef";
    const encodedPassword = new TextEncoder().encode(password);
    const encodedSalt = new TextEncoder().encode(fixedSalt);

    const combined = new Uint8Array(encodedPassword.length + encodedSalt.length);
    combined.set(encodedPassword, 0);
    combined.set(encodedSalt, encodedPassword.length);

    let data = combined;
    for (let i = 0; i < iterations; i++) {
      data = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
    }

    return Array.from(data)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch (error) {
    console.error("Error hashing password:", error);
    throw error;
  }
}

const RegistrationForm = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const { googleAuth, setGoogleAuth } = useAuth();
  const { data: session } = useSession();

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isGoogleDivClicked, setIsGoogleDivClicked] = useState(false);
  const [googleError, setGoogleError] = useState({ isError: false, error: "" });
  const [successMessage, setSuccessMessage] = useState("");

  const [name, setName] = useState("");
  const [noError, setNoError] = useState(false);
  const [nameError, setNameError] = useState({ iserror: true, error: "Name is required" });
  const [firstTimeEmailCheck, setFirstTimeEmailCheck] = useState(true);
  const [email, setEmail] = useState("");
  const [allEmails, setAllEmails] = useState([]);
  const [emailError, setEmailError] = useState({ iserror: true, error: "Email is required" });
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState({ iserror: true, error: "Your password must be at least 8 characters" });

  useEffect(() => {
    if (session?.user) {
      setGoogleAuth({
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      });
    }
  }, [session, setGoogleAuth]);

  useEffect(() => {
    const setAllEmailsInArray = async () => {
      const Emails = [];
      const users = await getAllUsers2({ email: email });
      for (let user of users) {
        Emails.push(user.email);
      }
      setAllEmails(Emails);
    };
    setAllEmailsInArray();
  }, [email]);

  useEffect(() => {
    setNameError(name === "" ? { iserror: true, error: "Name is required" } : { iserror: false, error: "" });
  }, [name]);

  useEffect(() => {
    if (email === "") {
      setEmailError({ iserror: true, error: "Email is required" });
    } else if (email !== email.toLowerCase()) {
      setEmailError({ iserror: true, error: "Email must be in lowercase letters" });
    } else if (email.slice(-10) !== "@gmail.com") {
      setEmailError({ iserror: true, error: "Use @gmail.com as your email format" });
    } else {
      setEmailError({ iserror: false, error: "" });
    }
  }, [email]);

  useEffect(() => {
    if (allEmails.length > 0 && email !== "" && firstTimeEmailCheck) {
      if (allEmails.includes(email)) {
        setEmailError({ iserror: true, error: "This email is already taken" });
      }
      setFirstTimeEmailCheck(false);
    }
  }, [allEmails, email, firstTimeEmailCheck]);

  useEffect(() => {
    setPasswordError(password.length < 8 ? { iserror: true, error: "Your password must be at least 8 characters" } : { iserror: false, error: "" });
  }, [password]);

  useEffect(() => {
    setNoError(!nameError.iserror && !emailError.iserror && !passwordError.iserror);
  }, [nameError.iserror, emailError.iserror, passwordError.iserror]);

  // Success message → redirect after 2s
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        router.push("/login");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, router]);

  const submitForm = async () => {
    if (!noError) return;
    const sureSubmit = confirm("Are you sure to Register?");
    if (!sureSubmit) return;

    setIsLoading(true);
    try {
      const hashedPassword = await hashPassword(password);
      await registerUser({
        name,
        email,
        password: hashedPassword,
        photo: "",
        paymentType: "Free",
        createdAt: new Date(),
        isAdmin: false,
        firstTimeLogin: true,
        history: [],
        expiredAt: "",
      });

      setSuccessMessage(`${email} successfully registered`);
    } catch (error) {
      if (error.message?.includes("E11000")) {
        setEmailError({ iserror: true, error: "This email is already registered" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setIsLoadingGoogle(true);
    setIsGoogleDivClicked(true);
    setGoogleError({ isError: false, error: "" });
    try {
      if (!session?.user) {
        await signIn("google");
      }
    } catch (error) {
      setGoogleError({ isError: true, error: "Google sign-in failed." });
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  useEffect(() => {
    if (session?.user && isGoogleDivClicked) {
      setIsLoadingGoogle(true);
      const autoRegister = async () => {
        try {
          const userEmail = session.user.email;
          const userName = userEmail.split("@")[0];

          const users = await getAllUsers2();
          const existingEmails = users.map(u => u.email);

          if (existingEmails.includes(userEmail)) {
            setGoogleError({ isError: true, error: `${userEmail} is already registered. Please log in.` });
            return;
          }

          const hashedEmpty = await hashPassword("");
          await registerUser({
            name: userName,
            email: userEmail,
            password: hashedEmpty,
            photo: session.user.image || "",
            paymentType: "Free",
            createdAt: new Date(),
            isAdmin: false,
            firstTimeLogin: true,
            history: [],
            expiredAt: "",
          });

          setSuccessMessage(`${userEmail} successfully registered`);
        } catch (error) {
          setGoogleError({ isError: true, error: "Auto-registration failed." });
        } finally {
          setIsLoadingGoogle(false);
          setIsGoogleDivClicked(false);
        }
      };

      autoRegister();
    }
  }, [isGoogleDivClicked, session]);

  useEffect(() => {
    if (googleError.isError) {
      const timer = setTimeout(() => {
        setGoogleError({ isError: false, error: "" });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [googleError.isError]);

  return (
    <div
      onKeyDown={(e) => e.key === "Enter" && submitForm()}
      className={`h-screen w-full sm:pt-[5%] pt-[30%] sm:px-0 px-[10%] overflow-y-auto lg:overflow-hidden lg:flex lg:justify-center lg:items-center ${
        theme ? `${colors.bgLight} ${colors.bgLight}` : `${colors.bgDark} ${colors.bgDark}`
      }`}
    >
      <div
        className={`sm:p-10 p-5 overflow-hidden rounded-lg sm:my-[5%] sm:w-[80%] sm:mx-[10%] lg:w-[700px] xl:w-[800px] 2xl:w-[900px] lg:my-0 text-center ${
          theme ? `${colors.cardLight}` : `${colors.cardDark}`
        }`}
      >
        <div className="w-full overflow-hidden">
          <div className="text-[20px] lg:text-[25px] 2xl:text-[40px] font-bold sm:mb-5 w-full float-left flex justify-center items-center">
            Registration
          </div>
          <div className="opacity-0">
            <EachField label="fake" type="email" name="email" isReal={false} placeholder="Enter your email" value={email} setValue={setEmail} />
            <EachField label="fake" type="password" name="password" isReal={false} placeholder="Enter your password" value={password} setValue={setPassword} />
          </div>
        </div>

        {/* Mobile */}
        <div className="w-full sm:hidden block overflow-hidden">
          <EachField
            label="Name"
            type="name"
            name="name"
            isReal={true}
            placeholder="Enter your name"
            value={name}
            setValue={setName}
            iserror={nameError.iserror}
            error={nameError.error}
          />
          <EachField
            label="Email"
            type="email"
            name="email"
            isReal={true}
            placeholder="Enter your email"
            value={email}
            setValue={setEmail}
            iserror={emailError.iserror}
            error={emailError.error}
          />
          <EachField
            label="Password"
            type="password"
            name="password"
            isReal={true}
            placeholder="Enter your password"
            value={password}
            setValue={setPassword}
            iserror={passwordError.iserror}
            error={passwordError.error}
          />
          <button
            onClick={submitForm}
            className={`text-[12px] cursor-pointer rounded-md mt-5 py-2 px-4 w-full ${
              noError ? "bg-green-800 hover:bg-green-700 text-white" : theme ? "bg-[#dbdbdb] text-[#808080]" : "bg-[#1a1a1a] text-[#696969]"
            }`}
          >
            {isLoading ? `Registering...` : `Register`}
          </button>
        </div>

        {/* Desktop */}
        <div className="float-left w-[50%] sm:block hidden pr-5">
          <EachField
            label="Email"
            type="email"
            name="email"
            isReal={true}
            placeholder="Enter your email"
            value={email}
            setValue={setEmail}
            iserror={emailError.iserror}
            error={emailError.error}
          />
          <EachField
            label="Password"
            type="password"
            name="password"
            isReal={true}
            placeholder="Enter your password"
            value={password}
            setValue={setPassword}
            iserror={passwordError.iserror}
            error={passwordError.error}
          />
        </div>

        <div className="float-left w-[50%] sm:block hidden pl-5">
          <EachField
            label="Name"
            type="name"
            name="name"
            isReal={true}
            placeholder="Enter your name"
            value={name}
            setValue={setName}
            iserror={nameError.iserror}
            error={nameError.error}
          />
          <button
            onClick={submitForm}
            className={`text-[12px] lg:text-[16px] 2xl:text-[25px] cursor-pointer rounded-md sm:mt-10 py-2 px-6 w-full ${
              noError ? "bg-green-800 hover:bg-green-700 text-white" : theme ? "bg-[#dbdbdb] text-[#808080]" : "bg-[#1a1a1a] text-[#696969]"
            }`}
          >
            {isLoading ? `Registering...` : `Register`}
          </button>
        </div>

        {/* Google Button + Messages */}
        <div className="w-full flex flex-col items-center justify-center mt-6">
          <button
            onClick={handleGoogleRegister}
            className={`text-[12px] lg:text-[16px] 2xl:text-[25px] flex items-center gap-4 lg:h-[60px] h-[40px] cursor-pointer rounded-md py-2 px-4 lg:px-6 w-full sm:w-[70%] ${
              theme ? `${colors.keyColorBg} ${colors.keyColortBgHover}` : `${colors.keyColorBg} ${colors.keyColortBgHover}`
            } text-white`}
          >
            <div className="h-full flex justify-center items-center">
              <div className="h-[30px] sm:h-[50px] w-[30px] sm:w-[50px] relative">
                <Image priority src="/googleIcon.png" alt="Google Icon" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 30vw" className="object-cover" />
              </div>
            </div>
            <div className="h-full text-center flex justify-center items-center">
              <div>{isLoadingGoogle ? `Registering...` : `Register with Google`}</div>
            </div>
          </button>

          {/* Success Message */}
          {successMessage && (
            <div className="mt-3 text-green-700 text-[12px] lg:text-[16px] 2xl:text-[24px] font-medium animate-pulse">
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {googleError.isError && (
            <div className="mt-2 text-red-600 text-[10px] lg:text-[14px] 2xl:text-[22px]">
              {googleError.error}
            </div>
          )}
        </div>

        <div className="float-left w-full overflow-hidden">
          <p className="sm:mt-10 mt-5 text-[12px] lg:text-[16px] 2xl:text-[26px]">
            Already Have An Account?{" "}
            <Link href="/login" className={`${colors.keyColorText} ${colors.keyColortTextHover}`}>
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;