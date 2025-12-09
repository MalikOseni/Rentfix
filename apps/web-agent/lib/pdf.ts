import jsPDF from 'jspdf';
import { EvidenceRecord } from './types';

export function exportEvidenceToPdf(evidence: EvidenceRecord[], ticketId: string) {
  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text(`Evidence Export - Ticket ${ticketId}`, 10, 16);
  doc.setFontSize(12);
  evidence.forEach((item, index) => {
    const y = 28 + index * 24;
    doc.text(`Item ${index + 1}: ${item.type.toUpperCase()}`, 10, y);
    doc.text(`Captured by: ${item.capturedBy} @ ${new Date(item.capturedAt).toLocaleString()}`, 10, y + 8);
    doc.text(`Hash: ${item.hash}`, 10, y + 16);
  });
  doc.save(`ticket-${ticketId}-evidence.pdf`);
}
