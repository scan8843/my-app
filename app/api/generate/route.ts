import { NextResponse } from "next/server";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  // 1) 클라이언트에서 보낸 데이터 받기
  const body = await req.json();

  // 2) 템플릿 파일 경로 설정
  const templatePath = path.join(
    process.cwd(),
    "public/template/expensetemplate.docx"
  );

  // 3) 템플릿 파일 읽기
  const content = fs.readFileSync(templatePath, "binary");

  // 4) docxtemplater로 템플릿 로드
  const zip = new PizZip(content);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });

  // 5) 템플릿에 데이터 채우기
  doc.render(body);

  // 6) docx 파일 생성
  const buf = doc.getZip().generate({
    type: "nodebuffer",
  });

  // 7) 파일을 응답으로 반환
  return new NextResponse(buf, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": "attachment; filename=expense.docx",
    },
  });
}
