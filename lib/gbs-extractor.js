/**
 * Trích xuất kết quả Sàng lọc GBS từ nội dung file PDF gốc
 * Quy tắc:
 * Trong phần "Khuyến cáo lâm sàng:", dòng 2)
 * - Nếu có dấu "*" ở cuối (ví dụ: "2)Tham vấn với bác sĩ chuyên khoa về kết quả của xét nghiệm này.*") -> Dương tính
 * - Nếu không có dấu "*" -> Âm tính
 */

export function extractGbsResultFromText(text) {
  if (!text) return 'Âm tính';

  // 1. Tìm trực tiếp dòng 2) có chứa dấu *
  const matchDirect = text.match(/2\)\s*Tham\s*vấn[^\n\r]*\*/i) ||
                      text.match(/2\)[^\n\r]*\*/i);
  if (matchDirect) {
    return 'Dương tính';
  }

  // 2. Tìm trong khối "Khuyến cáo lâm sàng"
  const kcMatch = text.match(/Khuyến\s*cáo\s*lâm\s*sàng[:\s]*([\s\S]*?)(?:Trang\s+[0-9]+|Chữ\s*ký|GIÁM\s*ĐỐC|Người\s*XN|$)/i);
  if (kcMatch && kcMatch[1]) {
    const kcBlock = kcMatch[1];
    const line2Match = kcBlock.match(/2\)[^\n\r]+/);
    if (line2Match && line2Match[0].includes('*')) {
      return 'Dương tính';
    }
  }

  return 'Âm tính';
}
