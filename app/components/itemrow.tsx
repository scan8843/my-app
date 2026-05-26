"use client";

import { Item } from "@/types/item";

interface Props {
  index: number;
  item: Item;
  onUpdate: (index: number, updated: Partial<Item>) => void;
  onDelete: (index: number) => void;
}

export default function ItemRow({ index, item, onUpdate, onDelete }: Props) {
  return (
    <div className="grid grid-cols-6 gap-2 mb-2">
      <input
        className="border p-1"
        placeholder="품명"
        value={item.itemname}
        onChange={e => onUpdate(index, { itemname: e.target.value })}
      />
      <input
        className="border p-1"
        placeholder="규격"
        value={item.spec}
        onChange={e => onUpdate(index, { spec: e.target.value })}
      />
      <input
        className="border p-1"
        placeholder="단위"
        value={item.unit}
        onChange={e => onUpdate(index, { unit: e.target.value })}
      />
      <input
        className="border p-1 text-right"
        type="number"
        placeholder="수량"
        value={item.qty}
        onChange={e => onUpdate(index, { qty: Number(e.target.value) })}
      />
      <input
        className="border p-1 text-right"
        type="number"
        placeholder="단가"
        value={item.unitPrice}
        onChange={e => onUpdate(index, { unitPrice: Number(e.target.value) })}
      />

      <button
        className="bg-red-500 text-white rounded"
        onClick={() => onDelete(index)}
      >
        삭제
      </button>
    </div>
  );
}
