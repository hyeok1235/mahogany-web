import { NextRequest, NextResponse } from "next/server";
import { checkStudentEligibility } from "@/utils/google-sheets";

export async function POST(request: NextRequest) {
  try {
    const { studentId } = await request.json();

    if (!studentId) {
      return NextResponse.json(
        {
          error: true,
          message: "학번을 입력해주세요.",
        },
        { status: 200 }
      );
    }

    const studentData = await checkStudentEligibility(studentId);

    if (!studentData) {
      return NextResponse.json(
        {
          error: true,
          message:
            "해당 학번으로 등록되지 않았어요. QR 코드로 신청할 수 있도록 안내해주세요.",
        },
        { status: 200 }
      );
    }

    

    // Additional validation logic (if needed)
    return NextResponse.json({
      success: true,
      studentData,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: true,
        message: "시스템 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
