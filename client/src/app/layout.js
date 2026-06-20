import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "AI Trip Planner",
  description: "Plan your trips with AI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
