"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, message, Typography } from "antd";

const { Title, Text } = Typography;

export default function PaymentConfirmationPage() {
  const [studentInfo, setStudentInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [messageApi, contextHolder] = message.useMessage();

  useEffect(() => {
    const storedInfo = localStorage.getItem("studentInfo");
    if (storedInfo) {
      setStudentInfo(JSON.parse(storedInfo));
    } else {
      router.push("/"); // Redirect if no student info
    }
  }, []);

  const handlePaymentConfirmation = async () => {
    if (!studentInfo) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/confirm-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: studentInfo.studentId,
          name: studentInfo.name,
        }),
      });

      const result = await response.json();

      if (result.success) {
        messageApi.success("결제 확인 완료!");
        router.push("/menu");
      } else {
        messageApi.error(result.message || "결제 확인 실패");
      }
    } catch (error) {
      messageApi.error("시스템 오류가 발생했습니다.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!studentInfo) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column", // Align items vertically
        justifyContent: "center",
        alignItems: "center",
        height: "85vh",
        // backgroundColor: "#f0f2f5",
        padding: "20px",
      }}
    >
      {contextHolder}

      {/* Title with added style */}
      <h1
        style={{
          marginBottom: "20px", // Space between title and card
          fontSize: "24px",
          fontWeight: "bold",
          color: "#333",
          textAlign: "center",
        }}
      >
        {studentInfo.option}
      </h1>

      <Card
        title="결제 확인"
        style={{
          width: 400,
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <Title level={4}>첫 결제 대상자</Title>
          <Text>
            {studentInfo.name}님의 구독 서비스 이용을 위해 결제를 완료해주세요.
          </Text>
        </div>

        <Button
          type="primary"
          block
          size="large"
          loading={isLoading}
          onClick={handlePaymentConfirmation}
        >
          {isLoading ? "처리 중..." : "결제 완료"}
        </Button>
      </Card>
    </div>
  );
}
