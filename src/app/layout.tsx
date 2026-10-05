import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "도와줘요 안전히어로즈",
  description: "만5세용 소방관 경찰관 안전교육 3D 게임 - 글자를 몰라도 소리로 배워요",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
