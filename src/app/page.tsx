import React from "react";
import StudentRegistrationForm from "@/components/StudentRegistrationForm";
import { Toaster } from "sonner";
import { Button } from "antd"; // Correct import of Typography
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 flex-col">
      <Link href="/">
        <Button type="primary" style={{ marginTop: "20px" }}>
          홈으로 가기
        </Button>
      </Link>
      <StudentRegistrationForm />
      <Toaster richColors position="top-center" />
    </div>
  );
}
