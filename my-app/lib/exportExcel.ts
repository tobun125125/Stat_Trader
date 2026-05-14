import type ExcelJS from 'exceljs';

/**
 * Apply professional styling to an ExcelJS worksheet.
 * Shared between monthly and yearly exports to avoid duplication.
 */
export function applyWorksheetStyling(
  worksheet: ExcelJS.Worksheet,
  colCount: number = 5
): void {
  const lastRow = worksheet.rowCount;

  worksheet.eachRow((row, rowNumber) => {
    // จัดรูปแบบเฉพาะคอลัมน์ที่กำหนดเท่านั้น ป้องกันเซลล์เปล่าล้นออกไปทางขวา
    for (let colNumber = 1; colNumber <= colCount; colNumber++) {
      const cell = row.getCell(colNumber);

      // --- Border ---
      const isLastRow = rowNumber === lastRow;
      cell.border = {
        top: isLastRow ? { style: 'medium' } : { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };

      // --- Header Row ---
      if (rowNumber === 1) {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF0F172A' }
        };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        continue;
      }

      // --- Summary Row (last row) ---
      if (isLastRow) {
        cell.font = { bold: true, size: 12 };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF1F5F9' }
        };
      } else if (rowNumber % 2 === 0) {
        // --- Alternating row color (แถวคู่) ---
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' }
        };
      }

      // --- Column-specific formatting ---
      if (colNumber === 1) {
        cell.alignment = { vertical: 'middle', horizontal: isLastRow ? 'left' : 'center' };
      } else if (colNumber === 2 || colNumber === 3) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.numFmt = '#,##0';
      } else if (colNumber === 4) {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.numFmt = '0.00%';
      } else if (colNumber === 5) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        cell.numFmt = '#,##0.00';

        const val = Number(cell.value);
        if (val > 0) {
          cell.font = { ...cell.font, color: { argb: 'FF16A34A' } };
        } else if (val < 0) {
          cell.font = { ...cell.font, color: { argb: 'FFDC2626' } };
        }
      }
    }

    // กำหนดความสูงแถวสรุป (ใช้ row.height ไม่ใช่ cell.height)
    if (rowNumber === lastRow) {
      row.height = 25;
    }
  });
}

/**
 * Standard column definitions for trading summary exports.
 */
export const TRADING_SUMMARY_COLUMNS = [
  { header: 'วันที่ (Date)', key: 'date', width: 35 },
  { header: 'จำนวนเทรด (Trades)', key: 'trades', width: 20 },
  { header: 'ชนะ (Win)', key: 'wins', width: 15 },
  { header: 'Win Rate (%)', key: 'winRate', width: 15 },
  { header: 'กำไร/ขาดทุนสุทธิ (Net Profit)', key: 'profit', width: 30 }
];

/**
 * Standard column definitions for yearly summary exports.
 */
export const YEARLY_SUMMARY_COLUMNS = [
  { header: 'เดือน (Month)', key: 'month', width: 35 },
  { header: 'จำนวนเทรด (Trades)', key: 'trades', width: 20 },
  { header: 'ชนะ (Win)', key: 'wins', width: 15 },
  { header: 'Win Rate (%)', key: 'winRate', width: 15 },
  { header: 'กำไร/ขาดทุนสุทธิ (Net Profit)', key: 'profit', width: 30 }
];
