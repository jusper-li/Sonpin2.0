export interface RemittanceInfo {
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  taxId?: string;
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
  `轉帳銀行：${REMITTANCE_INFO.bankName}（${REMITTANCE_INFO.bankCode}）`,
  `轉帳帳號：${REMITTANCE_INFO.accountNumber}`,
  `戶名：${REMITTANCE_INFO.accountName}`,
  REMITTANCE_INFO.taxId ? `統編：${REMITTANCE_INFO.taxId}` : '',
  REMITTANCE_INFO.note,
].filter(Boolean) as string[];
