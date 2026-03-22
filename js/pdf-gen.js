// js/pdf-gen.js — PDF vectorial con pdf-lib (texto seleccionable, sin html2canvas)
import { PDFDocument, rgb, StandardFonts } from 'https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.esm.min.js';

export async function generarFacturaPDF(factura, perfilEmisor, esFree = false) {
  const doc  = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const fonts = {
    bold:    await doc.embedFont(StandardFonts.HelveticaBold),
    regular: await doc.embedFont(StandardFonts.Helvetica)
  };

  const { width, height } = page.getSize();
  const margin = 50;
  let y = height - margin;

  // Header — datos emisor
  page.drawText('FACTURA', { x: margin, y, font: fonts.bold, size: 22, color: rgb(0.05, 0.47, 0.40) });
  y -= 30;

  page.drawText(perfilEmisor.nombre || perfilEmisor.empresa || 'Sin nombre', { x: margin, y, font: fonts.bold, size: 12 });
  y -= 16;
  page.drawText(`NIF: ${perfilEmisor.nif || '-'}`, { x: margin, y, font: fonts.regular, size: 10 });
  y -= 14;
  page.drawText(perfilEmisor.direccion || '', { x: margin, y, font: fonts.regular, size: 10 });
  y -= 30;

  // Datos factura
  page.drawText(`N\u00BA Factura: ${factura.numero}`, { x: margin, y, font: fonts.bold, size: 11 });
  page.drawText(`Fecha: ${factura.fecha}`, { x: width - margin - 150, y, font: fonts.regular, size: 11 });
  y -= 20;

  // Datos cliente
  page.drawText('DATOS DEL CLIENTE', { x: margin, y, font: fonts.bold, size: 10, color: rgb(0.5, 0.5, 0.5) });
  y -= 16;
  page.drawText(factura.cliente_nombre || '', { x: margin, y, font: fonts.bold, size: 11 });
  y -= 14;
  if (factura.cliente_nif) {
    page.drawText(`NIF: ${factura.cliente_nif}`, { x: margin, y, font: fonts.regular, size: 10 });
    y -= 14;
  }
  y -= 20;

  // Líneas header
  page.drawText('CONCEPTO', { x: margin, y, font: fonts.bold, size: 10 });
  page.drawText('IMPORTE', { x: width - margin - 80, y, font: fonts.bold, size: 10 });
  y -= 4;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
  y -= 16;

  const lineas = factura.lineas || [];
  for (const linea of lineas) {
    const desc = linea.descripcion || linea.concepto || '';
    const importe = Number(linea.importe || (linea.cantidad || 1) * (linea.precio || 0));
    page.drawText(desc, { x: margin, y, font: fonts.regular, size: 10 });
    page.drawText(`${importe.toFixed(2)} \u20AC`, { x: width - margin - 80, y, font: fonts.regular, size: 10 });
    y -= 16;
  }

  y -= 10;
  page.drawLine({ start: { x: margin, y }, end: { x: width - margin, y }, thickness: 0.5, color: rgb(0.8, 0.8, 0.8) });
  y -= 20;

  // Totales
  page.drawText(`Base imponible: ${Number(factura.base_imponible).toFixed(2)} \u20AC`, { x: width - margin - 200, y, font: fonts.regular, size: 10 });
  y -= 16;
  if (factura.tipo_iva > 0) {
    page.drawText(`IVA (${factura.tipo_iva}%): ${Number(factura.cuota_iva).toFixed(2)} \u20AC`, { x: width - margin - 200, y, font: fonts.regular, size: 10 });
    y -= 16;
  }
  if (factura.tipo_irpf > 0) {
    page.drawText(`IRPF (-${factura.tipo_irpf}%): -${Number(factura.cuota_irpf).toFixed(2)} \u20AC`, { x: width - margin - 200, y, font: fonts.regular, size: 10, color: rgb(0.8, 0.2, 0.2) });
    y -= 16;
  }
  y -= 6;
  page.drawText(`TOTAL: ${Number(factura.total).toFixed(2)} \u20AC`, { x: width - margin - 200, y, font: fonts.bold, size: 14, color: rgb(0.05, 0.47, 0.40) });

  // Marca de agua plan Free
  if (esFree) {
    page.drawText('GESTORAI.PRO \u2014 PLAN FREE', {
      x: 100, y: height / 2,
      font: fonts.bold, size: 40,
      color: rgb(0.85, 0.85, 0.85),
      rotate: { type: 'degrees', angle: 35 },
      opacity: 0.15
    });
  }

  // Footer
  page.drawText('Documento generado por GestorAI.pro \u00B7 by MolvicStudios', {
    x: margin, y: 30,
    font: fonts.regular, size: 8,
    color: rgb(0.6, 0.6, 0.6)
  });

  // VERIFACTU 2027
  if (factura.verifactu_hash) {
    page.drawText(`VERIFACTU: ${factura.verifactu_hash}`, { x: margin, y: 20, font: fonts.regular, size: 7, color: rgb(0.7, 0.7, 0.7) });
  }

  const pdfBytes = await doc.save();
  return pdfBytes;
}

// Descargar PDF en el navegador
export function descargarPDF(pdfBytes, nombreFichero) {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = nombreFichero;
  a.click();
  URL.revokeObjectURL(url);
}
