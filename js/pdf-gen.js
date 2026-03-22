// js/pdf-gen.js — Generador PDF client-side con jsPDF + html2canvas
// CDN imports
let jsPDF = null;
let html2canvas = null;

async function loadDeps() {
  if (!jsPDF) {
    const mod = await import('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.2/jspdf.umd.min.js');
    jsPDF = window.jspdf?.jsPDF || mod.jsPDF;
  }
  if (!html2canvas) {
    await import('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    html2canvas = window.html2canvas;
  }
}

// Generar PDF desde un elemento HTML
export async function generarPDF({ elementId, filename = 'documento.pdf', marcaAgua = false }) {
  await loadDeps();

  const element = document.getElementById(elementId);
  if (!element) throw new Error(`Elemento #${elementId} no encontrado`);

  // Añadir marca de agua si es plan Free
  if (marcaAgua) {
    element.classList.add('marca-agua-free');
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff'
  });

  if (marcaAgua) {
    element.classList.remove('marca-agua-free');
  }

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  let heightLeft = pdfHeight;
  let position = 0;
  const pageHeight = pdf.internal.pageSize.getHeight();

  pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position -= pageHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;
  }

  pdf.save(filename);
  return true;
}

// Generar PDF de factura con datos estructurados
export async function generarFacturaPDF({ factura, perfil, marcaAgua = false }) {
  await loadDeps();

  const pdf = new jsPDF('p', 'mm', 'a4');
  const w = pdf.internal.pageSize.getWidth();
  let y = 20;

  // Cabecera
  pdf.setFontSize(20);
  pdf.setTextColor(13, 121, 102);
  pdf.text('FACTURA', 20, y);
  pdf.setFontSize(11);
  pdf.setTextColor(100);
  pdf.text(factura.numero || '', w - 20, y, { align: 'right' });
  y += 12;

  // Datos emisor
  pdf.setFontSize(10);
  pdf.setTextColor(50);
  pdf.text(perfil.empresa || perfil.nombre || '', 20, y); y += 5;
  pdf.text(`NIF: ${perfil.nif || ''}`, 20, y); y += 5;
  pdf.text(perfil.direccion || '', 20, y); y += 5;
  pdf.text(`${perfil.codigo_postal || ''} ${perfil.ciudad || ''}`, 20, y); y += 10;

  // Datos cliente
  pdf.setFontSize(10);
  pdf.setTextColor(100);
  pdf.text('FACTURAR A:', w / 2 + 10, y - 20);
  pdf.setTextColor(50);
  pdf.text(factura.cliente_nombre || '', w / 2 + 10, y - 15);
  pdf.text(`NIF: ${factura.cliente_nif || ''}`, w / 2 + 10, y - 10);
  pdf.text(factura.cliente_direccion || '', w / 2 + 10, y - 5);

  // Fecha
  pdf.text(`Fecha: ${factura.fecha}`, 20, y);
  if (factura.fecha_vencimiento) {
    pdf.text(`Vencimiento: ${factura.fecha_vencimiento}`, w / 2 + 10, y);
  }
  y += 10;

  // Línea separadora
  pdf.setDrawColor(200);
  pdf.line(20, y, w - 20, y);
  y += 8;

  // Cabecera tabla
  pdf.setFontSize(9);
  pdf.setTextColor(100);
  pdf.text('Concepto', 20, y);
  pdf.text('Uds.', 110, y, { align: 'right' });
  pdf.text('Precio', 135, y, { align: 'right' });
  pdf.text('Total', w - 20, y, { align: 'right' });
  y += 6;
  pdf.line(20, y - 2, w - 20, y - 2);

  // Líneas
  pdf.setTextColor(30);
  const lineas = factura.lineas || [];
  for (const linea of lineas) {
    pdf.text(String(linea.concepto || ''), 20, y);
    pdf.text(String(linea.cantidad || 1), 110, y, { align: 'right' });
    pdf.text(`${(linea.precio || 0).toFixed(2)} €`, 135, y, { align: 'right' });
    pdf.text(`${((linea.cantidad || 1) * (linea.precio || 0)).toFixed(2)} €`, w - 20, y, { align: 'right' });
    y += 6;
  }

  y += 6;
  pdf.line(20, y, w - 20, y);
  y += 8;

  // Totales
  const x = w - 20;
  pdf.setFontSize(10);
  pdf.text(`Base imponible:`, x - 60, y);
  pdf.text(`${(factura.base_imponible || 0).toFixed(2)} €`, x, y, { align: 'right' });
  y += 6;
  pdf.text(`IVA (${factura.tipo_iva || 21}%):`, x - 60, y);
  pdf.text(`${(factura.cuota_iva || 0).toFixed(2)} €`, x, y, { align: 'right' });
  y += 6;
  if (factura.tipo_irpf > 0) {
    pdf.text(`IRPF (−${factura.tipo_irpf}%):`, x - 60, y);
    pdf.text(`−${(factura.cuota_irpf || 0).toFixed(2)} €`, x, y, { align: 'right' });
    y += 6;
  }
  y += 2;
  pdf.setFontSize(13);
  pdf.setTextColor(13, 121, 102);
  pdf.text(`TOTAL: ${(factura.total || 0).toFixed(2)} €`, x, y, { align: 'right' });

  // Marca de agua Free
  if (marcaAgua) {
    pdf.setFontSize(50);
    pdf.setTextColor(200, 200, 200);
    pdf.text('GestorAI FREE', w / 2, 150, { align: 'center', angle: 35 });
  }

  // Pie
  pdf.setFontSize(7);
  pdf.setTextColor(150);
  pdf.text('Documento generado por GestorAI.pro — gestorai.pro', w / 2, 285, { align: 'center' });

  pdf.save(`${factura.numero || 'factura'}.pdf`);
}
