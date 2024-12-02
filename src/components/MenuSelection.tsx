"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, Button, Alert, Result } from "antd";
import { CoffeeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

export default function MenuSelection() {
  const [isLoading, setIsLoading] = useState(false);
  const [studentInfo, setStudentInfo] = useState(null);
  const [isValidPeriod, setIsValidPeriod] = useState(false);
  const [feedback, setFeedback] = useState({
    visible: false,
    success: false,
    message: "",
  });
  const router = useRouter();

  useEffect(() => {
    const storedInfo = localStorage.getItem("studentInfo");
    if (storedInfo) {
      const parsedInfo = JSON.parse(storedInfo);
      setStudentInfo(parsedInfo);

      const isWithinRange = validateDateRange(parsedInfo.option);
      setIsValidPeriod(isWithinRange);
    } else {
      setFeedback({
        visible: true,
        success: false,
        message: "등록 정보가 없습니다. 인증을 먼저 해주세요.",
      });
      setTimeout(() => router.push("/student-registration"), 3000);
    }
  }, [router]);

  const validateDateRange = (option: string): boolean => {
    if (!option) return false;

    const dateRangeRegex = /\d{1,2}\.\d{1,2}\(.\)~\d{1,2}\.\d{1,2}\(.\)/;
    const match = option.match(dateRangeRegex);

    if (!match) {
      console.error("Date range format mismatch:", option);
      return false;
    }

    const [startDateStr, endDateStr] = match[0].split("~");

    const formatDate = (date: string) =>
      date.replace(/\./g, "/").replace(/\(.*\)/, ""); // Removes (ddd)

    const currentYear = dayjs().year();
    const formattedStartDate = `${currentYear}/${formatDate(startDateStr)}`;
    const formattedEndDate = `${currentYear}/${formatDate(endDateStr)}`;

    console.log("Parsed Start Date:", formattedStartDate);
    console.log("Parsed End Date:", formattedEndDate);

    const startDate = dayjs(formattedStartDate, "YYYY/M/D");
    const endDate = dayjs(formattedEndDate, "YYYY/M/D");

    if (!startDate.isValid() || !endDate.isValid()) {
      console.error("Invalid date parsing:", {
        formattedStartDate,
        formattedEndDate,
        startDate,
        endDate,
      });
      return false;
    }

    const today = dayjs();
    return (
      today.isAfter(startDate.startOf("day")) &&
      today.isBefore(endDate.endOf("day"))
    );
  };

  const handleBeverageSelection = async (beverage: string) => {
    setIsLoading(true);

    try {
      const studentId = studentInfo.studentId;
      const response = await fetch("/api/place-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ studentId, beverage }),
      });

      const result = await response.json();

      if (result.success) {
        setFeedback({
          visible: true,
          success: true,
          message: "주문이 성공적으로 처리되었습니다.",
        });
      } else {
        setFeedback({
          visible: true,
          success: false,
          message: result.message || "주문 처리에 실패했습니다.",
        });
      }
    } catch (error) {
      setFeedback({
        visible: true,
        success: false,
        message: "시스템 오류가 발생했습니다.",
      });
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        height: "85vh",
        // backgroundColor: "#f0f2f5",
      }}
    >
      <h1
        style={{
          marginBottom: "20px",
          fontSize: "24px",
          fontWeight: "bold",
          color: "#333",
          textAlign: "center",
        }}
      >
        {studentInfo && studentInfo.option}
      </h1>
      {feedback.visible ? (
        <Result
          status={feedback.success ? "success" : "error"}
          title={feedback.success ? "성공" : "오류"}
          subTitle={feedback.message}
          extra={
            feedback.success ? (
              <Button type="primary" onClick={() => router.push("/")}>
                홈으로 가기
              </Button>
            ) : (
              <Button
                type="default"
                onClick={() => router.push("/student-registration")}
              >
                다시 시도하기
              </Button>
            )
          }
        />
      ) : (
        <Card
          title="음료 선택"
          style={{
            width: 400,
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          }}
        >
          {studentInfo && (
            <div style={{ marginBottom: "20px" }}>
              <Alert
                message={`${studentInfo.name}님`}
                type={isValidPeriod ? "info" : "warning"}
                description={
                  isValidPeriod
                    ? "주문 가능한 기간입니다."
                    : "아직 사용기간이 아닙니다. 기간이 시작되면 이용해주세요."
                }
              />
            </div>
          )}

          {isValidPeriod ? (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <Button
                type="primary"
                icon={<CoffeeOutlined />}
                size="large"
                onClick={() => handleBeverageSelection("아메리카노")}
                disabled={isLoading}
                style={{ width: "48%" }}
              >
                아메리카노
              </Button>
              <Button
                type="primary"
                icon={<CoffeeOutlined />}
                size="large"
                onClick={() => handleBeverageSelection("카페라떼")}
                disabled={isLoading}
                style={{ width: "48%" }}
              >
                카페라떼
              </Button>
            </div>
          ) : (
            <Button
              type="default"
              size="large"
              onClick={() => router.push("/")}
              style={{ width: "100%" }}
            >
              홈으로 가기
            </Button>
          )}
        </Card>
      )}
    </div>
  );
}
