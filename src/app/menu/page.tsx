import React from "react";
import MenuSelection from "@/components/MenuSelection";
import { Toaster } from "sonner";
import { Button } from "antd";
import Link from "next/link";

export default function MenuPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 flex-col">
      <Link href="/">
        <Button type="primary" style={{ marginTop: "20px" }}>
          홈으로 가기
        </Button>
      </Link>
      <MenuSelection />
      <Toaster richColors position="top-center" />
    </div>
  );
}
