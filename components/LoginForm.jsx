"use client";

import { getAllUsers2, performLogin } from "@/app/actions";
import colors from "@/app/color/color";
import { useAuth } from "@/app/hooks/useAuth";
import { useTheme } from "@/app/hooks/useTheme";
import { signIn, useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import EachField from "./EachField";

async function hashPassword(password, iterations = 10000) {
  try {
    const fixedSalt = "fixedSalt1234567890abcdef";
    const encodedPassword = new TextEncoder().encode(password);
    const encodedSalt = new TextEncoder().encode(fixedSalt);

    const combined = new Uint8Array(
      encodedPassword.length + encodedSalt.length
    );
    combined.set(encodedPassword, 0);
    combined.set(encodedSalt, encodedPassword.length);

    let data = combined;
    for (let i = 0; i < iterations; i++) {
      data = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
    }

    const hash = Array.from(data)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hash;
  } catch (error) {
    console.error("Error hashing password:", error);
    throw error;
  }
}

const LoginForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const { theme } = useTheme();
  const { setAuth, auth } = useAuth();
  const router = useRouter();
  const [isTyping, setIsTyping] = useState(true);
  const [email, setEmail] = useState("");
  const [wantTo, setWantTo] = useState(false);
  const [mainError, setMainError] = useState({
    isError: false,
    error: "Email or password is incorrect",
  });
  const [googleError, setGoogleError] = useState({
    isError: false,
    error: "",
  });
  const [emailError, setEmailError] = useState({
    iserror: true,
    error: "Email is required",
  });
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState({
    iserror: true,
    error: "Password is required",
  });

  useEffect(() => {
    if (isTyping) {
      setIsLoading(false);
    }
  }, [isTyping]);

  useEffect(() => {
    if (email !== "") {
      setEmailError({
        iserror: false,
        error: "",
      });
    } else {
      setEmailError({
        iserror: true,
        error: "Email is required",
      });
    }
    if (password !== "") {
      setPasswordError({
        iserror: false,
        error: "",
      });
    } else {
      setPasswordError({
        iserror: true,
        error: "Password is required",
      });
    }
  }, [email, password]);

  useEffect(() => {
    setMainError({
      isError: false,
      error: "Email or password is incorrect",
    });
    setGoogleError({
      isError: false,
      error: "",
    });
    setIsTyping(true);
  }, [email, password]);

  useEffect(() => {
    if (googleError.isError) {
      const timer = setTimeout(() => {
        setGoogleError({
          isError: false,
          error: "",
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [googleError.isError]);

  const submitForm = async () => {
    if (!emailError.iserror && !passwordError.iserror) {
      setIsLoading(true);
      try {
        const hashedPassword = await hashPassword(password);
        const found = await performLogin({
          email: email,
          password: hashedPassword,
        });
        if (found) {
          if (found.firstTimeLogin && session?.user) {
            found.photo = session.user.image;
          }
          setAuth(found);
          router.push("/");
          setIsLoading(false);
        } else {
          setEmailError({
            iserror: true,
            error: "",
          });
          setPasswordError({
            iserror: true,
            error: "",
          });
          setMainError({
            isError: true,
            error: "Email or password is incorrect",
          });
          setIsTyping(false);
        }
      } catch (error) {
        console.log("Something went wrong");
        setMainError({
          isError: true,
          error: "Something Went Wrong",
        });
        setIsLoading(false);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoadingGoogle(true);
    try {
      if (!session?.user) {
        await signIn("google");
      } else {
        const users = await getAllUsers2();
        const matchedUser = users.find(
          (user) => user.email === session.user.email
        );
        if (matchedUser) {
          if (matchedUser.firstTimeLogin) {
            matchedUser.photo = session.user.image;
          }
          setAuth(matchedUser);
          router.push("/");
        } else {
          setGoogleError({
            isError: true,
            error: `Your email ${session.user.email} hasn't registered yet`,
          });
        }
      }
    } catch (error) {
      console.error("Error checking users:", error);
      setGoogleError({
        isError: true,
        error: "Something went wrong while checking user",
      });
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  return (
    <div
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          submitForm();
        }
      }}
      className={`h-screen w-full sm:pt-[5%] pt-[30%] sm:px-0 px-[10%] overflow-y-auto lg:overflow-hidden lg:flex lg:justify-center lg:items-center ${
        theme
          ? `${colors.bgLight} ${colors.bgLight}`
          : `${colors.bgDark} ${colors.bgDark}`
      }`}
    >
      <div
        className={`sm:p-10 p-5 rounded-md sm:my-[5%] sm:w-[50%] sm:mx-[25%] lg:w-[400px] xl:w-[450px] 2xl:w-[500px] lg:my-0 text-center ${
          theme ? `${colors.cardLight}` : `${colors.cardDark}`
        }`}
      >
        <div className="text-[20px] lg:text-[25px] 2xl:text-[40px] font-bold sm:mb-10">
          Login
        </div>
        {/* Trick the browser with fake email and password fields */}
        <div className="opacity-0">
          <EachField
            label="fake"
            type="email"
            name="email"
            isReal={false}
            placeholder="Enter your email"
            value={email}
            setValue={setEmail}
            iserror={emailError.iserror}
            error={emailError.error}
          />
          <EachField
            label="fake"
            type="password"
            name="password"
            isReal={false}
            placeholder="Enter your password"
            value={password}
            setValue={setPassword}
            iserror={passwordError.iserror}
            error={passwordError.error}
          />
        </div>
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
        {mainError.isError ? (
          <div className="mt-3 text-red-600 text-[10px] lg:text-[14px] 2xl:text-[22px]">
            {mainError.error}
          </div>
        ) : (
          <></>
        )}

        <button
          onClick={submitForm}
          className={`text-[12px] lg:text-[16px] 2xl:text-[25px] cursor-pointer rounded-lg mt-6 sm:mt-12 py-2 sm:px-6 px-4 ${
            !emailError.iserror && !passwordError.iserror
              ? "bg-green-800 hover:bg-green-700 text-white"
              : theme
              ? "bg-[#dddddd] text-[#888888]"
              : "bg-[#222222] text-[#888888]"
          }`}
        >
          {isLoading ? `Logging...` : `Login`}
        </button>
        <div className="w-full flex flex-col items-center justify-center">
          <button
            onClick={handleGoogleSignIn}
            className={`text-[12px] lg:text-[16px] 2xl:text-[25px] flex items-center gap-4 lg:h-[60px] h-[40px] cursor-pointer rounded-md mt-10 py-2 px-4 lg:px-6 ${
              theme
                ? `${colors.keyColorBg} ${colors.keyColortBgHover}`
                : `${colors.keyColorBg} ${colors.keyColortBgHover}`
            } text-white`}
          >
            <div className="h-full flex justify-center items-center">
              <div className="h-[30px] sm:h-[50px] w-[30px] sm:w-[50px] relative">
                <Image
                  priority
                  src="/googleIcon.png"
                  alt="Google Icon"
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 30vw"
                  className="object-cover"
                />
              </div>
            </div>
            <div className="h-full text-center flex justify-center items-center">
              <div>{isLoadingGoogle ? `Logging...` : `Log in with Google`}</div>
            </div>
          </button>
          {googleError.isError && (
            <div className="mt-2 text-red-600 text-[10px] lg:text-[14px] 2xl:text-[22px]">
              {googleError.error}
            </div>
          )}
        </div>
        <div className="sm:mt-18 mt-5 text-[12px] lg:text-[16px] 2xl:text-[26px]">
          No Account?{" "}
          <Link
            href="/register"
            className={`${colors.keyColorText} ${colors.keyColortTextHover}`}
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
