"use client";

import { useState } from "react";
import { Item } from "@/types/item";
import ItemRow from "@/components/ItemRow";
import { useRouter } from "next/navigation";

export default function Screen1() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [items, setItems] = useState<Item[]>([]);

  const addItem = () => {
    setItems([
      ...items,
      { item: "", spec: "", unit: "", qty: 0, unitPrice: 0 }
    ]);
  };

  const updateItem = (index: number, updated: Partial<Item>) => {
    setItems(prev =>
      prev.map((it, i) => (i === index ? { ...it, ...updated } : it))
    );
  };

  const deleteItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const total = items.reduce(
    (sum, it) => sum + it.qty * it.unitPrice,
    0
  );

  const goNext = () => {
    if (!title) return alert("건명을 입력하세요");
    if (items.length === 0) return alert("품목을 하나 이상 추가하세요");
    if (items.some(it => it.qty <= 0 || it.unitPrice <= 0))
      return alert("수량과 단가는 0보다 커야 합니다");

    router.push("/confirm");
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-center text-xl font-bold">재정 품의 및 청구서</h1>

      <label>건명</label>
      <input
        className="border p-2 w-full"
        placeholder="청구 목적을 입력하세요"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />

      <div className="flex justify-between items-center">
        <span>구매한 품목을 추가하세요</span>
        <button
          onClick={addItem}
          className="bg-blue-600 text-white px-3 py-1 rounded"
        >
          + 품목 추가
        </button>
      </div>

      <div className="border p-2">
        {items.map((it, idx) => (
          <ItemRow
            key={idx}
            index={idx}
            item={it}
            onUpdate={updateItem}
            onDelete={deleteItem}
          />
        ))}
      </div>

      <div className="text-right font-bold">
        총 금액: {total.toLocaleString()}
      </div>

      <button
        onClick={goNext}
        className="bg-blue-600 text-white w-full py-3 rounded"
      >
        다음
      </button>
    </div>
  );
}
