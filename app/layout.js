import { Roboto } from "next/font/google"; // Import Roboto instead of Inter
import "./globals.css";
import AuthProvider from "./providers/AuthProvider";
import { SessionProvider } from "next-auth/react";
import { dbConnect } from "@/services/mongo";
import ThemeProvider from "./providers/ThemeProvider";
import TopNavbar from "@/components/TopNavbar";
import ResponseProvider from "./providers/ResponseProvider";
import TopNavBarWarper from "@/components/TopNavBarWarper";
import ThemeWrapper from "@/components/ThemeWrapper";

// Initialize Roboto with desired subsets and weights
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"], // Specify weights you need
  style: ["normal", "italic"], // Optional: include italic if needed
  display: "swap", // Improves loading performance
});

export const metadata = {
  title: "Recruiter Reply",
  description: "Recruiter Reply",
  icons: {
    icon: ["/favicon.ico?v=4"],
    apple: ["/apple-touch-icon.png?v=4"],
    shortcut: ["/apple-touch-icon.png"],
  },
};

export default async function RootLayout({ children }) {
  console.log("Hi")
  await dbConnect();
  return (
    <html lang="en">
      <body className={roboto.className}>
        {" "}
        {/* Apply Roboto to the body */}
        <SessionProvider>
          <ResponseProvider>
            <ThemeProvider>
              <AuthProvider>
                <ThemeWrapper>
                  <TopNavbar />
                  <TopNavBarWarper>{children}</TopNavBarWarper>
                </ThemeWrapper>
              </AuthProvider>
            </ThemeProvider>
          </ResponseProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
