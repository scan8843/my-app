import { NextResponse } from "next/server";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 템플릿 파일 경로
    const templatePath = path.join(
      process.cwd(),
      "public",
      "template",
      "expensetemplate.docx"
    );

    const content = fs.readFileSync(templatePath, "binary");

    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // 템플릿에 데이터 주입
    doc.render({
      title: body.title,
      totalamount: body.totalamount,
      bank: body.bank,
      account: body.account,
      owner: body.owner,
      date: body.date,
      approver1: body.approver1,
      items: body.items,
      signature: body.signature,
    });

    const buf = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    });

    // NextResponse는 Buffer 타입을 직접 받지 못하므로 any로 캐스팅
    return new NextResponse(buf as any, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": "attachment; filename=expense.docx",
      },
    });
  } catch (error) {
    console.error("Error generating document:", error);
    return NextResponse.json(
      { error: "문서 생성 중 오류 발생" },
      { status: 500 }
    );
  }
}
