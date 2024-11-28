import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { OAuth2Client } from "googleapis-common";

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const { studentId, beverage } = await request.json();

    if (!studentId || !beverage) {
      return NextResponse.json(
        { success: false, message: "학번 또는 메뉴 정보가 없습니다." },
        { status: 400 }
      );
    }

    // Get the current timestamp
    const timestamp_raw = new Date().toISOString(); // ISO 8601 format

    // Convert to Korean time (Asia/Seoul)
    const toKoreanTime = (isoString) => {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "Asia/Seoul",
      }).format(date);
    };

    const timestamp = toKoreanTime(timestamp_raw);

    // Authenticate with Google Sheets
    const auth = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      credentials: {
        client_email: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_PRIVATE_KEY?.replace(
          /\\n/g,
          "\n"
        ),
      },
    });

    const client: OAuth2Client = (await auth.getClient()) as OAuth2Client;
    const sheets = google.sheets({ version: "v4", auth: client });

    // Append new row to Sheet2
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID,
      range: "Sheet2!A:C", // Adjust to match your Sheet2 structure
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [[studentId, beverage, timestamp]], // Add new row with studentId, beverage, and timestamp
      },
    });

    if (response.status === 200) {
      return NextResponse.json(
        { success: true, message: "주문이 완료되었습니다." },
        { status: 200 }
      );
    } else {
      throw new Error("Google Sheets 응답 상태가 비정상입니다.");
    }
  } catch (error) {
    console.error("Error placing order:", error);
    return NextResponse.json(
      { success: false, message: "시스템 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
