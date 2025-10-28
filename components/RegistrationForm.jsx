"use client";

// Import necessary dependencies and utilities
import { getAllUsers2, registerUser } from "@/app/actions"; // Server actions for fetching users and registering a new user
import colors from "@/app/color/color"; // Theme-based color configurations
import { useAuth } from "@/app/hooks/useAuth"; // Custom hook for managing Google authentication state
import { useTheme } from "@/app/hooks/useTheme"; // Custom hook for theme management
import { signIn, useSession } from "next-auth/react"; // NextAuth hook for session management
import Link from "next/link"; // Next.js Link component for navigation
import { useRouter } from "next/navigation"; // Next.js router for programmatic navigation
import { useEffect, useState } from "react"; // React hooks for state and side effects
import EachField from "./EachField"; // Reusable form field component
import Image from "next/image";
import { set } from "mongoose";

// Function to hash password using SHA-256 with a fixed salt
async function hashPassword(password, iterations = 10000) {
  try {
    // Define a fixed salt for consistent hashing
    const fixedSalt = "fixedSalt1234567890abcdef";
    // Encode password and salt to Uint8Array for cryptographic operations
    const encodedPassword = new TextEncoder().encode(password);
    const encodedSalt = new TextEncoder().encode(fixedSalt);

    // Combine password and salt into a single array
    const combined = new Uint8Array(
      encodedPassword.length + encodedSalt.length
    );
    combined.set(encodedPassword, 0);
    combined.set(encodedSalt, encodedPassword.length);

    // Iteratively hash the combined data using SHA-256
    let data = combined;
    for (let i = 0; i < iterations; i++) {
      data = new Uint8Array(await crypto.subtle.digest("SHA-256", data));
    }

    // Convert the hash to a hexadecimal string
    const hash = Array.from(data)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hash;
  } catch (error) {
    // Log and rethrow any errors during hashing
    console.error("Error hashing password:", error);
    throw error;
  }
}

// Main RegistrationForm component
const RegistrationForm = () => {
  // Access theme and router
  const { theme } = useTheme(); // Get current theme (light/dark)
  const router = useRouter(); // Router for navigation
  const { googleAuth, setGoogleAuth } = useAuth(); // Manage Google auth data
  const { data: session } = useSession(); // Get session data from NextAuth

  // State management for form fields and errors
  const [isLoading, setIsLoading] = useState(false); // Track form submission loading state
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [isGoogleDivClicked, setIsGoogleDivClicked] = useState(false);
  const [googleError, setGoogleError] = useState({
    isError: false,
    error: "",
  });
  const [name, setName] = useState(""); // Store name input
  const [noError, setNoError] = useState(false); // Track if form has no errors
  const [nameError, setNameError] = useState({
    iserror: true,
    error: "Name is required",
  }); // Name field error state
  const [firstTimeEmailCheck, setFirstTimeEmailCheck] = useState(true); // Flag for initial email uniqueness check
  const [email, setEmail] = useState(""); // Store email input
  const [allEmails, setAllEmails] = useState([]); // Store list of existing emails
  const [emailError, setEmailError] = useState({
    iserror: true,
    error: "Email is required",
  }); // Email field error state
  const [password, setPassword] = useState(""); // Store password input
  const [passwordError, setPasswordError] = useState({
    iserror: true,
    error: "Your password must be at least 8 characters",
  }); // Password field error state
  const [successMessage, setSuccessMessage] = useState("");

  // Sync Google auth data from session
  useEffect(() => {
    if (session?.user) {
      // Update auth context with Google user data
      setGoogleAuth({
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      });
    }
  }, [session, setGoogleAuth]);

  // Fetch all user emails for uniqueness check
  useEffect(() => {
    const setAllEmailsInArray = async () => {
      const Emails = [];
      // Fetch users from server action
      const users = await getAllUsers2({ email: email });
      // Extract emails into array
      for (let user of users) {
        Emails.push(user.email);
      }
      setAllEmails(Emails);
    };
    setAllEmailsInArray();
  }, [email]);

  // Validate name input
  useEffect(() => {
    if (name === "") {
      // Set error if name is empty
      setNameError({ iserror: true, error: "Name is required" });
    } else {
      // Clear error if name is provided
      setNameError({ iserror: false, error: "" });
    }
  }, [name]);

  // Validate email input
  useEffect(() => {
    if (email === "") {
      // Set error if email is empty
      setEmailError({ iserror: true, error: "Email is required" });
    } else if (email !== email.toLowerCase()) {
      // Ensure email is lowercase
      setEmailError({
        iserror: true,
        error: "Email must be in lowercase letters",
      });
    } else if (email.slice(-10) !== "@gmail.com") {
      // Restrict to Gmail addresses
      setEmailError({
        iserror: true,
        error: "Use @gmail.com as your email format",
      });
    } else {
      // Clear error if email is valid
      setEmailError({ iserror: false, error: "" });
    }
  }, [email]);

  // Check email uniqueness after initial fetch
  useEffect(() => {
    if (allEmails.length > 0 && email !== "") {
      // Delay check to avoid rapid API calls
      if (allEmails.includes(email)) {
        // Set error if email is already taken
        setEmailError({
          iserror: true,
          error: "This email is already taken",
        });
      }
      setFirstTimeEmailCheck(false); // Prevent repeated checks
    }
  }, [allEmails, email, firstTimeEmailCheck]);

  // Validate password input
  useEffect(() => {
    if (password.length < 8) {
      // Set error if password is too short
      setPasswordError({
        iserror: true,
        error: "Your password must be at least 8 characters",
      });
    } else {
      // Clear error if password is valid
      setPasswordError({ iserror: false, error: "" });
    }
  }, [password]);

  useEffect(() => {
    if (googleError.isError) {
      const timer = setTimeout(() => {
        setGoogleError({
          isError: false,
          error: "",
        });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [googleError.isError]);

  // Success message → redirect after 2s
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        router.push("/login");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, router]);

  // Determine if form is valid
  useEffect(() => {
    // Enable submission only if no errors exist
    setNoError(
      !nameError.iserror && !emailError.iserror && !passwordError.iserror
    );
  }, [nameError.iserror, emailError.iserror, passwordError.iserror]);

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
        setEmailError({
          iserror: true,
          error: "This email is already registered",
        });
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
          const existingEmails = users.map((u) => u.email);

          if (existingEmails.includes(userEmail)) {
            setGoogleError({
              isError: true,
              error: `${userEmail} is already registered. Please log in.`,
            });
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

  // Render the registration form
  return (
    <div
      // Handle Enter key to submit form
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          submitForm();
        }
      }}
      // Responsive container with theme-based styling
      className={`h-screen w-full sm:pt-[5%] pt-[30%] sm:px-0 px-[10%] overflow-y-auto lg:overflow-hidden lg:flex lg:justify-center lg:items-center ${
        theme
          ? `${colors.bgLight} ${colors.bgLight}`
          : `${colors.bgDark} ${colors.bgDark}`
      }`}
    >
      <div
        // Form card with responsive padding and theme-based styling
        className={`sm:p-10 p-5 overflow-hidden rounded-lg sm:my-[5%] sm:w-[80%] sm:mx-[10%] lg:w-[700px] xl:w-[800px] 2xl:w-[900px] lg:my-0 text-center ${
          theme ? `${colors.cardLight}` : `${colors.cardDark}`
        }`}
      >
        <div className="w-full overflow-hidden">
          {/* Form title */}
          <div className="text-[20px] lg:text-[25px] 2xl:text-[40px] font-bold sm:mb-5 w-full float-left flex justify-center items-center">
            Registration
          </div>
          {/* Hidden fake fields to prevent browser autofill */}
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
        </div>

        {/* Mobile layout: Stacked fields */}
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
          {/* Submit button for mobile */}
          <button
            onClick={submitForm}
            className={`text-[12px] cursor-pointer rounded-md mt-5 py-2 px-4 ${
              noError
                ? "bg-green-800 hover:bg-green-700 text-white"
                : theme
                ? "bg-[#dbdbdb] text-[#808080]"
                : "bg-[#1a1a1a] text-[#696969]"
            }`}
          >
            {isLoading ? `Registering...` : `Register`}
          </button>
        </div>

        {/* Desktop layout: Two-column fields */}
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
          {/* Submit button for desktop */}
          <button
            onClick={submitForm}
            className={`text-[12px] lg:text-[16px] 2xl:text-[25px] cursor-pointer rounded-md sm:mt-10 py-2 px-6 ${
              noError
                ? "bg-green-800 hover:bg-green-700 text-white"
                : theme
                ? "bg-[#dbdbdb] text-[#808080]"
                : "bg-[#1a1a1a] text-[#696969]"
            }`}
          >
            {isLoading ? `Registering...` : `Register`}
          </button>
        </div>
        <div className="w-full flex flex-col items-center justify-center">
          <button
            onClick={handleGoogleRegister}
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
              <div>
                {isLoadingGoogle ? `Registering...` : `Register in with Google`}
              </div>
            </div>
          </button>
          {/* Success Message */}
          {successMessage && (
            <div className="mt-3 text-green-700 text-[12px] lg:text-[16px] 2xl:text-[24px] font-medium animate-pulse">
              {successMessage}
            </div>
          )}
          {googleError.isError && (
            <div className="mt-2 text-red-600 text-[10px] lg:text-[14px] 2xl:text-[22px]">
              {googleError.error}
            </div>
          )}
        </div>

        {/* Link to login page */}
        <div className="float-left w-full overflow-hidden">
          <p className="sm:mt-10 mt-5 text-[12px] lg:text-[16px] 2xl:text-[26px]">
            Already Have An Account?{" "}
            <Link
              href="/login"
              className={`${colors.keyColorText} ${colors.keyColortTextHover}`}
            >
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

// Export the component
export default RegistrationForm;
