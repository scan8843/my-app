import { NextResponse } from "next/server";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import fs from "fs";
import path from "path";
import ImageModule from "docxtemplater-image";

function base64DataURLToBuffer(dataURL: string) {
  const base64Regex = /^data:image\/(png|jpg|jpeg|svg\+xml);base64,/;
  if (!base64Regex.test(dataURL)) {
    throw new Error("지원하지 않는 이미지 형식입니다.");
  }

  const base64Data = dataURL.replace(base64Regex, "");
  return Buffer.from(base64Data, "base64");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("=== attachments ===");
    console.log(JSON.stringify(body.attachments, null, 2));

    const templatePath = path.join(
      process.cwd(),
      "public",
      "template",
      "expensetemplate.docx"
    );

    if (!fs.existsSync(templatePath)) {
      return NextResponse.json(
        { error: "템플릿 파일을 찾을 수 없습니다." },
        { status: 500 }
      );
    }

    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);

    const imageOptions = {
      centered: false,
      fileType: "docx",

      getImage(tagValue: string) {
        return base64DataURLToBuffer(tagValue);
      },

      getSize(img: unknown, tagValue: string, tagName: string) {
        // 서명 크기
        if (tagName === "approver1") {
          return [100, 40];
        }

        // 유첨 이미지 크기
        return [672, 462];
      },

      getValue(tagValue: string) {
        return tagValue;
      },
    };

    const imageModule = new ImageModule(imageOptions);

    const doc = new Docxtemplater(zip, {
      modules: [imageModule],
      paragraphLoop: true,
      linebreaks: true,
    });

    doc.render({
      title: body.title ?? "",
      totalamount: body.totalamount ?? "",
      totalAmountFormatted: body.totalAmountFormatted ?? "",
      totalAmountKorean: body.totalAmountKorean ?? "",
      bank: body.bank ?? "",
      account: body.account ?? "",
      owner: body.owner ?? "",
      date: body.date
  ? `${body.date.split("-")[0]}년 ${body.date.split("-")[1]}월 ${body.date.split("-")[2]}일`
  : "",
      approver1: body.approver1 ?? "",
      items: body.items ?? [],
      attachments:
        body.attachments?.map(
          (it: { index: number; type: string; image: string }) => ({
            index: it.index,
            type: it.type,
            image: it.image,
          })
        ) ?? [],
    });

    const buf = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE",
    });

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