import localFont from "next/font/local"

export const calibri = localFont({
  src: [
    { path: "./fonts/Calibri-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/Calibri-Italic.woff2",  weight: "400", style: "italic" },
    { path: "./fonts/Calibri-Bold.woff2",    weight: "700", style: "normal" },
  ],
  variable: "--font-calibri",
  display: "swap",
})
