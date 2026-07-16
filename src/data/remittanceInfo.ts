export interface RemittanceInfo {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  taxId: string;
  note: string;
}

export const REMITTANCE_INFO: RemittanceInfo = {
  bankName: '永豐銀行 萬華分行',
  bankCode: '807',
  accountNumber: '105-001-0014900-4',
  accountName: '淞品生技股份有限公司',
  taxId: '27522811',
  note: '匯款後請於客服時間 09:00–17:00 來電或私訊告知，並提供訂單編號以利對帳。',
};

export const remittanceLines = [
  `銀行名稱：${REMITTANCE_INFO.bankName}`,
  `銀行代碼：${REMITTANCE_INFO.bankCode}`,
  `匯款帳號：${REMITTANCE_INFO.accountNumber}`,
  `戶名：${REMITTANCE_INFO.accountName}`,
  `統一編號：${REMITTANCE_INFO.taxId}`,
  `備註：${REMITTANCE_INFO.note}`,
];
