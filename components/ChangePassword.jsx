"use client";
import { callChangePassword } from "@/app/actions";
import colors from "@/app/color/color";
import { useAuth } from "@/app/hooks/useAuth";
import { useTheme } from "@/app/hooks/useTheme";
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

const ChangePassword = () => {
  const router = useRouter();
  const { theme } = useTheme();
  const { auth, setAuth } = useAuth();
  const [noError, setNoError] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState({
    iserror: true,
    error: "Password is incorrect",
  });
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordError, setNewPasswordError] = useState({
    iserror: true,
    error: "Your password must be at least 8 characters",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState({
    iserror: true,
    error: "Your password must be at least 8 characters",
  });

  useEffect(() => {
    if (!auth) {
      router.push("/login");
    }
  }, [auth, router]);

  useEffect(() => {
    if (newPassword.length < 8) {
      setNewPasswordError({
        iserror: true,
        error: "Your password must be at least 8 characters",
      });
    } else {
      setNewPasswordError({
        iserror: false,
        error: "Your password must be at least 8 characters",
      });
    }
    if (confirmPassword.length < 8) {
      setConfirmPasswordError({
        iserror: true,
        error: "Your password must be at least 8 characters",
      });
    } else {
      if (confirmPassword.length >= 8 && newPassword !== confirmPassword) {
        setConfirmPasswordError({
          iserror: true,
          error: "Isn't matching with new password",
        });
      } else {
        setConfirmPasswordError({
          iserror: false,
          error: "Your password must be at least 8 characters",
        });
      }
    }
  }, [newPassword, confirmPassword]);

  useEffect(() => {
    const checkPassword = async () => {
      if (auth && password) {
        try {
          const hashedPassword = await hashPassword(password);
          if (auth.password !== hashedPassword) {
            setPasswordError({ iserror: true, error: "Password is incorrect" });
          } else {
            setPasswordError({ iserror: false, error: "Password is correct" });
          }
        } catch (error) {
          console.error("Error hashing password:", error);
          setPasswordError({ iserror: true, error: "Error verifying password" });
        }
      } else {
        setPasswordError({ iserror: true, error: "Password is required" });
      }
    };
    checkPassword();
  }, [password, auth]);

  useEffect(() => {
    if (
      !passwordError.iserror &&
      !newPasswordError.iserror &&
      !confirmPasswordError.iserror
    ) {
      setNoError(true);
    } else {
      setNoError(false);
    }
  }, [
    passwordError.iserror,
    newPasswordError.iserror,
    confirmPasswordError.iserror,
  ]);

  const submitForm = async () => {
    if (noError) {
      const sureSubmit = confirm(
        "Are you sure you want to change your password?"
      );
      if (sureSubmit) {
        if (auth) {
          try {
            const hashedNewPassword = await hashPassword(newPassword);
            await callChangePassword(auth.email, hashedNewPassword);
            setAuth({ ...auth, password: hashedNewPassword });
            router.push("/");
          } catch (error) {
            console.error("Error changing password:", error);
            setPasswordError({
              iserror: true,
              error: "Error changing password",
            });
          }
        }
      }
    }
  };

  return auth ? (
    <div
      className={`w-full sm:p-0 p-[5%] mt-[20%] sm:mt-0 overflow-y-auto lg:overflow-hidden lg:flex lg:justify-center lg:items-center sm:pt-[12%]`}
    >
      <div
        className={`p-10 overflow-hidden rounded-lg sm:my-[5%] sm:w-[80%] sm:mx-[10%] lg:w-[700px] xl:w-[800px] 2xl:w-[900px] lg:my-0 text-center ${
          theme ? `${colors.cardLight}` : `${colors.cardDark}`
        }`}
      >
        <div className={"w-full overflow-hidden"}>
          <div className="text-[20px] sm:text-[25px] md:text-[30px] lg:text-[35px] xl:text-[40px] 2xl:text-[45px] font-bold mb-10">
            Change Password
          </div>
          <div className="opacity-0">
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

        <div className="w-full sm:hidden block overflow-hidden">
          <EachField
            label="Old Password"
            type="password"
            name="password"
            isReal={true}
            placeholder="Enter your old Password"
            value={password}
            setValue={setPassword}
            iserror={passwordError.iserror}
            error={passwordError.error}
          />
          <EachField
            label="New Password"
            type="password"
            name="password"
            isReal={true}
            placeholder="Enter your new Password"
            value={newPassword}
            setValue={setNewPassword}
            iserror={newPasswordError.iserror}
            error={newPasswordError.error}
          />
          <EachField
            label="Confirm New Password"
            type="password"
            name="password"
            isReal={true}
            placeholder="Confirm your Password"
            value={confirmPassword}
            setValue={setConfirmPassword}
            iserror={confirmPasswordError.iserror}
            error={confirmPasswordError.error}
          />
          <button
            onClick={submitForm}
            className={`text-[18px] cursor-pointer rounded-lg mt-10 py-2 px-6 mb-5 shadow-md ${
              noError
                ? "bg-green-700 text-white"
                : theme
                ? "bg-[#dbdbdb] text-[#808080]"
                : "bg-[#1a1a1a] text-[#696969]"
            }`}
          >
            Change Password
          </button>
        </div>

        <div
          className={`float-left w-[50%] sm:block hidden overflow-hidden pr-5`}
        >
          <EachField
            label="New Password"
            type="password"
            name="password"
            isReal={true}
            placeholder="Enter your new Password"
            value={newPassword}
            setValue={setNewPassword}
            iserror={newPasswordError.iserror}
            error={newPasswordError.error}
          />
          <EachField
            label="Confirm New Password"
            type="password"
            name="password"
            isReal={true}
            placeholder="Confirm your Password"
            value={confirmPassword}
            setValue={setConfirmPassword}
            iserror={confirmPasswordError.iserror}
            error={confirmPasswordError.error}
          />
        </div>

        <div
          className={`float-left w-[50%] sm:block hidden overflow-hidden pl-5`}
        >
          <EachField
            label="Old Password"
            type="password"
            name="password"
            isReal={true}
            placeholder="Enter your old Password"
            value={password}
            setValue={setPassword}
            iserror={passwordError.iserror}
            error={passwordError.error}
          />
          <button
            onClick={submitForm}
            className={`text-[12px] lg:text-[16px] 2xl:text-[25px] cursor-pointer rounded-lg mt-10 py-2 px-6 mb-5 ${
              noError
                ? "bg-green-700 text-white"
                : theme
                ? "bg-[#dbdbdb] text-[#808080]"
                : "bg-[#1a1a1a] text-[#696969]"
            }`}
          >
            Change Password
          </button>
        </div>
      </div>
    </div>
  ) : (
    <div
      className={`w-full h-full flex justify-center items-center ${
        theme ? "bg-[#ffffff] text-[#0a0a0a]" : "bg-[#000000] text-[#ebebeb]"
      }`}
    >
      <div className="p-10 text-[18px] sm:text-[20px] md:text-[25px] lg:text-[30px] xl:text-[35px] 2xl:text-[40px]">
        You have to login first
      </div>
    </div>
  );
};

export default ChangePassword;