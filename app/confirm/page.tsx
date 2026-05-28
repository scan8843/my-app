"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";

export default function Screen2() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const data = JSON.parse(searchParams.get("data") || "{}");

  const [bank, setBank] = useState("");
  const [account, setAccount] = useState("");
  const [owner, setOwner] = useState("");

  const today = new Date(
    Date.now() - new Date().getTimezoneOffset() * 60000,
  )
    .toISOString()
    .split("T")[0];
  const [date, setDate] = useState(today);

  const [attachment, setAttachment] = useState<File | null>(null);

  const sigPad = useRef<SignatureCanvas | null>(null);

  const total =
    data.items?.reduce(
      (sum: number, it: any) => sum + it.qty * it.unitPrice,
      0,
    ) ?? 0;

  const submit = async () => {
    if (!bank || !account || !owner || !date) {
      return alert("모든 정보를 입력하세요");
    }

    const signature = sigPad.current
      ?.getTrimmedCanvas()
      .toDataURL("image/png");

    const payload = {
      title: data.title,
      totalamount: total,
      bank,
      account,
      owner,
      date,
      approver1: "담당자",
      items: data.items.map((it: any, idx: number) => ({
        index: idx + 1,
        itemname: it.itemname,
        spec: it.spec,
        unit: it.unit,
        qty: it.qty,
        unitprice: it.unitPrice,
        totalprice: it.qty * it.unitPrice,
        purpose: it.purpose ?? "",
      })),
      signature,
    };

    const res = await fetch("/api/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "청구서.docx";
    a.click();
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-center text-xl font-bold">청구서 확인</h1>

      <div className="space-y-1">
        <label className="font-medium">건명</label>
        <div className="border rounded p-2 bg-gray-50 dark:bg-gray-800 dark:border-gray-600">
          {data.title}
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

        {data.items?.map((it: any, idx: number) => (
          <div key={idx} className="grid grid-cols-5 gap-2 text-sm">
            <div>{it.itemname}</div>
            <div>{it.spec}</div>
            <div>{it.unit}</div>
            <div className="text-right">{it.qty}</div>
            <div className="text-right">
              {it.unitPrice?.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      <div className="text-right font-bold">
        총 금액: {total.toLocaleString()}
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

      <input
        type="file"
        className="border rounded p-2 w-full bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-600"
        onChange={(e) => setAttachment(e.target.files?.[0] || null)}
      />

<div className="space-y-2">
  <p className="font-bold mb-1">서명</p>

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
