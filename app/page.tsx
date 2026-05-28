"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Item = {
  itemname: string;
  spec: string;
  unit: string;
  qty: number;
  unitPrice: number;
  purpose: string;
};

export default function Page() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [items, setItems] = useState<Item[]>([
    {
      itemname: "",
      spec: "",
      unit: "EA(개)",
      qty: 1,
      unitPrice: 0,
      purpose: "",
    },
  ]);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        itemname: "",
        spec: "",
        unit: "EA(개)",
        qty: 1,
        unitPrice: 0,
        purpose: "",
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (
    index: number,
    field: keyof Item,
    value: string | number,
  ) => {
    setItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const totalAmount = items.reduce(
    (sum, item) => sum + item.qty * item.unitPrice,
    0,
  );

  const next = () => {
    
    if (!title.trim()) {
      alert("건명을 입력하세요");
      return;
    }

    const valid = items.every(
      (it) => it.itemname.trim() && it.qty > 0 && it.unitPrice > 0,
    );

    if (!valid) {
      alert("품명, 수량, 단가를 올바르게 입력하세요");
      return;
    }

    const data = { title, items };
    router.push(`/confirm?data=${encodeURIComponent(JSON.stringify(data))}`);
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-5">
      <h1 className="text-center text-xl font-bold">청구서 작성</h1>

      <div className="space-y-1">
        <label className="font-medium">청구목적(건명)</label>
        <input
          className="border rounded p-2 w-full bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-600"
          placeholder="예: 6월 회식비 등 청구 목적을 작성하세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="border rounded-xl p-4 space-y-3 shadow-sm dark:border-gray-600"
          >
            <div className="flex justify-between items-center">
              <span className="font-semibold">품목 {idx + 1}</span>

              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeItem(idx)}
                  className="text-red-500 text-sm"
                >
                  삭제
                </button>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-500 dark:text-gray-300">
                품명
              </label>
              <input
                className="border rounded p-2 w-full bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-600"
                placeholder="모니터, 마이크 등"
                value={item.itemname}
                onChange={(e) =>
                  updateItem(idx, "itemname", e.target.value)
                }
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-500 dark:text-gray-300">
                규격
              </label>
              <input
                className="border rounded p-2 w-full bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-600"
                placeholder="모델명, 사이즈, 사양 등"
                value={item.spec}
                onChange={(e) => updateItem(idx, "spec", e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-500 dark:text-gray-300">
                단위
              </label>
              <select
                className="border rounded p-2 w-full bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-600"
                value={item.unit}
                onChange={(e) => updateItem(idx, "unit", e.target.value)}
              >
                <option value="EA(개)">EA(개)</option>
                <option value="SET(셋)">SET(셋)</option>
                <option value="BOX(박스)">BOX(박스)</option>
                <option value="명">명</option>
                <option value="회">회</option>
                <option value="식">식</option>
                <option value="기타">기타</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-sm text-gray-500 dark:text-gray-300">
                  수량
                </label>
                <input
                  type="number"
                  min={1}
                  className="border rounded p-2 w-full bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  value={item.qty}
                  onChange={(e) =>
                    updateItem(idx, "qty", Number(e.target.value))
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm text-gray-500 dark:text-gray-300">
                  단가(원)
                </label>
                <input
                  type="number"
                  min={0}
                  className="border rounded p-2 w-full bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-600"
                  placeholder="0"
                  value={item.unitPrice}
                  onChange={(e) =>
                    updateItem(idx, "unitPrice", Number(e.target.value))
                  }
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-500 dark:text-gray-300">
                사용 목적
              </label>
              <input
                className="border rounded p-2 w-full bg-white text-black dark:bg-gray-800 dark:text-white dark:border-gray-600"
                placeholder="예: 회의용 장비, 행사 진행, 업무용 구매 등"
                value={item.purpose}
                onChange={(e) =>
                  updateItem(idx, "purpose", e.target.value)
                }
              />
            </div>

            <div className="text-right text-sm font-medium text-gray-600 dark:text-gray-300">
              소계: {(item.qty * item.unitPrice).toLocaleString()}원
            </div>
          </div>
        ))}
      </div>

      <div className="text-right font-bold text-lg">
        총 금액: {totalAmount.toLocaleString()}원
      </div>

      <button
        type="button"
        onClick={addItem}
        className="bg-green-600 text-white w-full py-3 rounded"
      >
        + 품목 추가
      </button>

      <button
        type="button"
        onClick={next}
        className="bg-blue-600 text-white w-full py-3 rounded"
      >
        다음
      </button>
    </div>
  );
}