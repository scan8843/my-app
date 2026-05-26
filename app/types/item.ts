export interface Item {
  itemname: string;   // 품명
  spec: string;       // 규격
  unit: string;       // 단위
  qty: number;        // 수량
  unitPrice: number;  // 단가
  purpose?: string;   // 용도
}
