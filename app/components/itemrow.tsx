"use client";

import { useState } from "react";

interface ItemRowProps {
  index: number;
  item: any;
  onChange: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
}

export default function ItemRow({ index, item, onChange, onRemove }: ItemRowProps) {
  return (
    <div className="grid grid-cols-6 gap-2 mb-2">
      <input
        className="border p-2"
        placeholder="품명"
        value={item.item}
        onChange={(e) => onChange(index, "item", e.target.value)}
      />

      <input
        className="border p-2"
        placeholder="규격"
        value={item.spec}
        onChange={(e) => onChange(index, "spec", e.target.value)}
      />

      <input
        className="border p-2"
        placeholder="단위"
        value={item.unit}
        onChange={(e) => onChange(index, "unit", e.target.value)}
      />

      <input
        type="number"
        className="border p-2 text-right"
        placeholder="수량"
        value={item.qty}
        onChange={(e) => onChange(index, "qty", Number(e.target.value))}
      />

      <input
        type="number"
        className="border p-2 text-right"
        placeholder="단가"
        value={item.unitPrice}
        onChange={(e) => onChange(index, "unitPrice", Number(e.target.value))}
      />

      <button
        onClick={() => onRemove(index)}
        className="bg-red-500 text-white px-3 rounded"
      >
        삭제
      </button>
    </div>
  );
}
