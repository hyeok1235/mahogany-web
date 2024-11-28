import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { OAuth2Client } from "googleapis-common";

export async function POST(request: NextRequest) {
  try {
    const { studentId, name } = await request.json();

    // Google Sheets Authentication
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

    // Get the spreadsheet data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID,
      range: "Sheet1!A:G",
    });

    const rows = response.data.values || [];
    const headers = rows[0];

    // Find indices
    const studentIdIndex = headers.indexOf(
      "학번 (연세대학교 학부생만 가능합니다)"
    );

    // Find matching row
    const matchedRowIndex = rows.findIndex(
      (row, index) => index > 0 && row[studentIdIndex] === studentId
    );

    if (matchedRowIndex === -1) {
      return NextResponse.json(
        { success: false, message: "사용자를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Update payment status to column G (7th column)
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID,
      range: `Sheet1!G${matchedRowIndex + 1}`, // Directly use "G" for the 7th column
      valueInputOption: "RAW",
      requestBody: {
        values: [["O"]],
      },
    });

    return NextResponse.json(
      { success: true, message: "결제 확인 완료" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Payment confirmation error:", error);
    return NextResponse.json(
      { success: false, message: "시스템 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
