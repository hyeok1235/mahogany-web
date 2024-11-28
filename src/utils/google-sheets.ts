import { google } from "googleapis";
import { OAuth2Client } from "googleapis-common";

interface StudentData {
  timestamp: string;
  option: string;
  name: string;
  phone: string;
  studentId: string;
  consent: string;
  usages?: boolean; // Usage changed to a boolean
}

export async function checkStudentEligibility(
  studentId: string
): Promise<(StudentData & { warning?: string; drinksToday?: number }) | null> {
  try {
    const auth = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
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

    // Fetch data from Sheet1
    const response1 = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID,
      range: "Sheet1!A:G", // Adjust based on your sheet structure
    });

    const rows = response1.data.values || [];
    const headers = rows[0];

    // Find index of relevant columns
    const studentIdIndex = headers.indexOf(
      "학번 (연세대학교 학부생만 가능합니다)"
    );
    const optionIndex = headers.indexOf("구독제 옵션 선택");
    const paymentIndex = headers.indexOf("결제 여부");

    // Find matching row
    const matchedRowIndex = rows.findIndex(
      (row, index) => index > 0 && row[studentIdIndex] === studentId
    );

    if (matchedRowIndex === -1) return null;

    const matchedRow = rows[matchedRowIndex];
    const studentData = {
      timestamp: matchedRow[0],
      option: matchedRow[optionIndex],
      name: matchedRow[2],
      phone: matchedRow[3],
      studentId: matchedRow[studentIdIndex],
      consent: matchedRow[5],
      warning:
        matchedRow[paymentIndex] !== "O" ? "첫 결제 대상자에요!" : undefined,
    };

    // Fetch data from Sheet2 for drinks count and usage time
    const response2 = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.NEXT_PUBLIC_GOOGLE_SHEETS_ID,
      range: "Sheet2!A:C", // Adjust based on your sheet structure
    });

    const rowsSheet2 = response2.data.values || [];
    const today = new Date().toISOString().split("T")[0]; // Today's date in "YYYY-MM-DD" format

    // Helper function to parse date in "YYYY-MM-DD" format
    const parseDateToISO = (timestamp: string): string | null => {
      try {
        // Parse custom timestamp format: "2024. 11. 28. 오후 07:29:15"
        const parts = timestamp.match(
          /(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(오전|오후)\s*(\d{1,2}):(\d{1,2}):(\d{1,2})/
        );

        if (!parts) throw new Error("Invalid timestamp format");

        const [_, year, month, day, period, hour, minute, second] = parts;
        let parsedHour = parseInt(hour, 10);

        // Convert 12-hour to 24-hour format
        if (period === "오후" && parsedHour < 12) parsedHour += 12;
        if (period === "오전" && parsedHour === 12) parsedHour = 0;

        // Create a Date object
        const date = new Date(
          year,
          parseInt(month, 10) - 1, // Month is 0-based
          day,
          parsedHour,
          parseInt(minute, 10),
          parseInt(second, 10)
        );

        // Return the date in "YYYY-MM-DD" format
        return date.toISOString().split("T")[0];
      } catch (error) {
        console.error("Failed to parse timestamp:", timestamp, error);
        return null; // Return null if parsing fails
      }
    };

    // Find the most recent usage timestamp for the student
    const recentUsageRow = rowsSheet2
      .filter((row) => row[0] === studentId)
      .sort((a, b) => {
        const dateA = parseDateToISO(a[2]);
        const dateB = parseDateToISO(b[2]);
        return dateB && dateA
          ? new Date(dateB).getTime() - new Date(dateA).getTime()
          : 0;
      })[0]; // Get the most recent entry

    let isUsageValid = false;

    if (recentUsageRow) {
      const recentTimestamp = recentUsageRow[2];
      const recentDate = parseDateToISO(recentTimestamp);

      if (recentDate) {
        const recentDateTime = new Date(recentDate).getTime();
        const currentTime = new Date().getTime();
        const timeDiff = (currentTime - recentDateTime) / (1000 * 60); // Time difference in minutes

        // Check if the usage is older than 30 minutes
        isUsageValid = timeDiff >= 30;
      }
    }

    // Calculate drinks count for today
    const drinksToday = rowsSheet2.filter((row) => {
      const studentIdMatch = row[0] === studentId;
      const dateMatch = parseDateToISO(row[2]) === today;
      return studentIdMatch && dateMatch;
    }).length;

    return { ...studentData, drinksToday, usages: isUsageValid };
  } catch (error) {
    console.error("Error checking student eligibility:", error);
    return null;
  }
}
