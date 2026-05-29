"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { supabase } from "@/lib/supabaseClient";

type Item = {
  itemname: string;
  spec: string;
  unit: string;
  qty: number;
  unitPrice: number;
  purpose?: string;
};

type StoredAttachment = {
  index?: number;
  type: string;
  name: string;
  image: string;
};

type AttachmentRow = {
  id: number;
  type: string;
  file: File | null;
};

type FormData = {
  id?: string; // uuid
  title?: string;
  items?: Item[];
  bank?: string;
  account?: string;
  owner?: string;
  date?: string;
  attachments?: StoredAttachment[];
  approver1?: string;
};

export default function ConfirmPage() {
  const router = useRouter();
  const sigPad = useRef<SignatureCanvas | null>(null);

  const [loadedData, setLoadedData] = useState<FormData | null>(null);

  const today = new Date(
    Date.now() - new Date().getTimezoneOffset() * 60000,
  )
    .toISOString()
    .split("T")[0];

  const [bank, setBank] = useState("");
  const [account, setAccount] = useState("");
  const [owner, setOwner] = useState("");
  const [date, setDate] = useState(today);

  const [attachments, setAttachments] = useState<AttachmentRow[]>([
    { id: 1, type: "", file: null },
  ]);

  useEffect(() => {
    const raw = sessionStorage.getItem("invoiceData");

    if (!raw) {
      alert("불러온 문서 데이터가 없습니다.");
      router.push("/");
      return;
    }

    try {
      const parsed: FormData = JSON.parse(raw);
      setLoadedData(parsed);
      setBank(parsed.bank || "");
      setAccount(parsed.account || "");
      setOwner(parsed.owner || "");
      setDate(parsed.date || today);
    } catch (error) {
      console.error("invoiceData 파싱 오류:", error);
      alert("문서 데이터를 불러오지 못했습니다.");
      router.push("/");
    }
  }, [router, today]);

  const total = useMemo(() => {
    return (
      loadedData?.items?.reduce(
        (sum, it) => sum + Number(it.qty) * Number(it.unitPrice),
        0,
      ) ?? 0
    );
  }, [loadedData]);

  const formatKrw = (amount: number) => `₩${amount.toLocaleString()}`;

  const numberToKoreanMoney = (num: number) => {
    if (num === 0) return "영";

    const units = ["", "만", "억", "조"];
    const nums = ["", "일", "이", "삼", "사", "오", "육", "칠", "팔", "구"];
    const smallUnits = ["", "십", "백", "천"];

    let result = "";
    let unitIndex = 0;
    let value = num;

    while (value > 0) {
      const part = value % 10000;

      if (part > 0) {
        let partStr = "";
        const digits = String(part).split("").reverse();

        for (let i = 0; i < digits.length; i++) {
          const digit = Number(digits[i]);
          if (digit === 0) continue;

          if (digit === 1 && i > 0) {
            partStr = smallUnits[i] + partStr;
          } else {
            partStr = nums[digit] + smallUnits[i] + partStr;
          }
        }

        result = partStr + units[unitIndex] + result;
      }

      value = Math.floor(value / 10000);
      unitIndex++;
    }

    return result;
  };

  const totalAmountFormatted = formatKrw(total);
  const totalAmountKorean = numberToKoreanMoney(total);

  const existingAttachments = loadedData?.attachments || [];
  const existingSignature = loadedData?.approver1 || "";

  const addAttachmentRow = () => {
    setAttachments((prev) => [
      ...prev,
      { id: Date.now(), type: "", file: null },
    ]);
  };

  const removeAttachmentRow = (id: number) => {
    setAttachments((prev) => prev.filter((row) => row.id !== id));
  };

  const updateAttachmentType = (id: number, value: string) => {
    setAttachments((prev) =>
      prev.map((row) => (row.id === id ? { ...row, type: value } : row)),
    );
  };

  const updateAttachmentFile = (id: number, file: File | null) => {
    setAttachments((prev) =>
      prev.map((row) => (row.id === id ? { ...row, file } : row)),
    );
  };

  const fileToDataURL = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const submit = async () => {
    if (!loadedData) {
      alert("문서 데이터가 없습니다.");
      return;
    }

    if (!bank || !account || !owner || !date) {
      alert("모든 정보를 입력하세요");
      return;
    }

    const signature =
      !sigPad.current || sigPad.current.isEmpty()
        ? existingSignature
        : sigPad.current.getTrimmedCanvas().toDataURL("image/png");

    if (!signature) {
      alert("서명을 입력하세요");
      return;
    }

    const validAttachments = attachments.filter(
      (row) => row.type && row.file,
    );

    const attachmentPayload: StoredAttachment[] =
      validAttachments.length > 0
        ? await Promise.all(
            validAttachments.map(async (row, idx) => ({
              index: idx + 1,
              type: row.type,
              name: row.file!.name,
              image: await fileToDataURL(row.file!),
            })),
          )
        : existingAttachments;

    const payload = {
      title: loadedData.title ?? "",
      amount: total,
      totalamount: total,
      bank,
      account,
      owner,
      date,
      approver1: signature,
      items:
        loadedData.items?.map((it, idx) => ({
          index: idx + 1,
          itemname: it.itemname,
          spec: it.spec,
          unit: it.unit,
          qty: it.qty,
          unitprice: it.unitPrice,
          totalprice: it.qty * it.unitPrice,
          purpose: it.purpose ?? "",
        })) ?? [],
      attachments: attachmentPayload,
    };

    let saveError: Error | null = null;

    if (loadedData.id) {
      const result = await supabase
        .from("invoices")
        .update(payload)
        .eq("id", loadedData.id);

      saveError = result.error as Error | null;
    } else {
      const result = await supabase
        .from("invoices")
        .insert([payload]);

      saveError = result.error as Error | null;
    }

    if (saveError) {
      console.error("Supabase 에러:", saveError);
      alert("에러: " + saveError.message);
      return;
    }

    // 최신 데이터 다시 sessionStorage에 저장
    sessionStorage.setItem(
      "invoiceData",
      JSON.stringify({
        ...loadedData,
        ...payload,
      }),
    );

    // 문서 생성 API 호출
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      alert("문서 생성 중 오류가 발생했습니다.");
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "청구서.docx";
    a.click();

    window.URL.revokeObjectURL(url);

    alert("저장 및 문서 생성이 완료되었습니다.");
  };

  if (!loadedData) {
    return (
      <div className="max-w-md mx-auto p-6">
        <p>문서 데이터를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-center text-xl font-bold">청구서 확인</h1>

      <div className="space-y-1">
        <label className="font-medium">건명</label>
        <div className="border rounded p-2 bg-gray-50 dark:bg-gray-800 dark:border-gray-600">
          {loadedData.title}
        </div>
      </div>

      <div className="border rounded p-3 space-y-2 dark:border-gray-600">
        <div className="grid grid-cols-5 gap-2 text-sm font-bold">
          <div>품명</div>
          <div>규격</div>
          <div>단위</div>
          <div className="text-right">수량</div>
          <div className="text-right">단가</div>
        </div>

        {loadedData.items?.map((it, idx) => (
          <div key={idx} className="grid grid-cols-5 gap-2 text-sm">
            <div>{it.itemname}</div>
            <div>{it.spec}</div>
            <div>{it.unit}</div>
            <div className="text-right">{it.qty}</div>
            <div className="text-right">{it.unitPrice.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className="text-right font-bold text-lg">
        총 금액: {total.toLocaleString()}원
      </div>

      <div className="text-right text-sm text-gray-600 dark:text-gray-300">
        금 {totalAmountKorean} ({totalAmountFormatted})
      </div>

      <select
        className="border rounded p-2 w-full bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-600"
        value={bank}
        onChange={(e) => setBank(e.target.value)}
      >
        <option value="">은행 선택</option>
        <option value="대구은행">대구은행</option>
        <option value="기업은행">기업은행</option>
        <option value="카카오뱅크">카카오뱅크</option>
      </select>

      <input
        className="border rounded p-2 w-full bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-600"
        placeholder="계좌번호 입력"
        value={account}
        onChange={(e) => setAccount(e.target.value)}
      />

      <input
        className="border rounded p-2 w-full bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-600"
        placeholder="계좌주 입력"
        value={owner}
        onChange={(e) => setOwner(e.target.value)}
      />

      <input
        type="date"
        className="border rounded p-2 w-full bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-600"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />

      {/* 기존 첨부가 있으면 표시 */}
      {existingAttachments.length > 0 && (
        <div className="space-y-2">
          <label className="font-medium">기존 유첨 파일</label>
          <div className="space-y-2">
            {existingAttachments.map((att, idx) => (
              <div
                key={idx}
                className="border rounded p-2 text-sm dark:border-gray-600"
              >
                {att.type} - {att.name}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 새 첨부 추가 */}
      <div className="space-y-2">
        <label className="font-medium">유첨 파일 추가/변경</label>

        {attachments.map((row, idx) => (
          <div
            key={row.id}
            className="border rounded p-3 space-y-2 dark:border-gray-600"
          >
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold">유첨 {idx + 1}</span>
              {attachments.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeAttachmentRow(row.id)}
                  className="text-red-500 text-sm"
                >
                  삭제
                </button>
              )}
            </div>

            <div className="flex gap-2 items-center">
              <select
                className="border rounded p-2 flex-1 bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-600"
                value={row.type}
                onChange={(e) => updateAttachmentType(row.id, e.target.value)}
              >
                <option value="">유첨 종류 선택</option>
                <option value="부품사진">부품사진</option>
                <option value="영수증">영수증</option>
                <option value="거래명세표">거래명세표</option>
                <option value="기타">기타</option>
              </select>

              <label className="bg-gray-600 text-white px-4 py-2 rounded cursor-pointer whitespace-nowrap">
                파일 선택
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    updateAttachmentFile(row.id, e.target.files?.[0] || null)
                  }
                />
              </label>
            </div>

            {row.file && (
              <div className="text-sm text-gray-600 dark:text-gray-300">
                선택 파일: {row.file.name}
              </div>
            )}
          </div>
        ))}

        <button
          type="button"
          onClick={addAttachmentRow}
          className="bg-green-600 text-white w-full py-2 rounded"
        >
          + 유첨 추가
        </button>
      </div>

      <div className="space-y-2">
        <p className="font-bold mb-1">서명</p>

        {existingSignature && (
          <div className="text-sm text-gray-600 dark:text-gray-300">
            기존 서명이 저장되어 있습니다. 새로 그리지 않으면 기존 서명이 유지됩니다.
          </div>
        )}

        <div className="flex gap-2 items-start">
          <div className="border rounded bg-white inline-block">
            <SignatureCanvas
              ref={sigPad}
              penColor="black"
              canvasProps={{
                width: 320,
                height: 180,
                className: "rounded",
              }}
            />
          </div>

          <button
            type="button"
            onClick={() => sigPad.current?.clear()}
            className="bg-gray-500 text-white px-3 py-2 rounded whitespace-nowrap"
          >
            지우기
          </button>
        </div>
      </div>

      <button
        onClick={submit}
        className="bg-blue-600 text-white w-full py-3 rounded"
      >
        제출
      </button>

      <button
        onClick={() => router.back()}
        className="bg-gray-500 text-white w-full py-3 rounded"
      >
        수정
      </button>
    </div>
  );
}