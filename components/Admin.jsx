"use client";
import { useAuth } from "@/app/hooks/useAuth";
import { useTheme } from "@/app/hooks/useTheme";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { createProductAction, checkProductById, checkProductBySku } from "@/app/actions";
import Image from "next/image";

export default function Admin() {
  const { auth } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!auth) {
      router.push("/login");
    }
  }, [auth, router]);

  // If not admin, show restricted message
  if (!auth?.isAdmin) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          theme ? "bg-[#ffffff] text-[#333333]" : "bg-[#000000] text-[#eeeeee]"
        }`}
      >
        <p className="text-lg font-semibold">
          Only an admin can manage this page
        </p>
      </div>
    );
  }

  // Admin product creation form
  return (
    <div
      className={`min-h-screen pt-[10%] px-[10%] py-[5%] ${
        theme ? "bg-[#ffffff] text-[#333333]" : "bg-[#000000] text-[#eeeeee]"
      }`}
    >
      <h1
        className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-8 ${
          theme ? "text-[#333333]" : "text-[#dddddd]"
        }`}
      >
        Admin Page
      </h1>
    </div>
  );
}