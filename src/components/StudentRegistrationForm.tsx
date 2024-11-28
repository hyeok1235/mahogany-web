"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Form, Input, Button, message } from "antd";
import { UserOutlined } from "@ant-design/icons";

export default function StudentRegistrationForm() {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const [messageApi, contextHolder] = message.useMessage();

  const handleSubmit = async (values: { studentId: string }) => {
    const { studentId } = values;
    setIsLoading(true);

    try {
      const response = await fetch("/api/check-student", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ studentId }),
      });

      const result = await response.json();

      // 사용자가 2잔을 이미 마신 경우
      if (result.studentData.drinksToday >= 2) {
        messageApi.open({
          type: "error",
          content: `${result.studentData.name}님은 이미 2잔을 마셨어요.`,
        });
        return;
      }

      if (result.studentData.usages === false) {
        messageApi.open({
          type: "error",
          content: `${result.studentData.name}님이 음료수를 마신지 30분이 안지났어요.`,
        });
        return;
      }

      if (result.success) {
        localStorage.setItem("studentInfo", JSON.stringify(result.studentData));

        // If there's a warning (unpaid), redirect to payment page
        if (result.studentData.warning) {
          router.push("/payment");
        } else {
          router.push("/menu");
        }
      } else {
        messageApi.open({
          type: "error",
          content: result.message || "사용자 인증에 실패했습니다.",
        });
      }
    } catch (error) {
      messageApi.open({
        type: "error",
        content: "시스템 오류가 발생했습니다.",
      });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "85vh",
        // backgroundColor: "#f0f2f5",
      }}
    >
      <Card
        title="사용자 인증"
        style={{
          width: 400,
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}
      >
        {contextHolder}

        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            name="studentId"
            rules={[
              {
                required: true,
                message: "학번을 입력해주세요.",
              },
            ]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="학번을 입력하세요"
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={isLoading}>
              {isLoading ? "확인 중..." : "확인"}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
