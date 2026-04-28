import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Order } from '../types';

export const generateInvoice = (order: Order) => {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    // --- Header / Brand Identity ---
    // Branding Bar - Split design (Black Left, White Right)
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, 140, 45, 'F'); // Covers logo area only

    // Logo Placeholder or Text Branding
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.text("KNOTTY TOWN", 15, 20);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(220, 220, 220);
    doc.text("LUXURY WITH PERSONALITY | EST 2026", 15, 28);

    // Business Info (Right side of header) - Now Black Text on White Background
    doc.setTextColor(0, 0, 0); // Set text to black
    doc.setFontSize(8);
    doc.text("KNOTTY TOWN CLOTHING", 195, 15, { align: 'right' });
    doc.text("#3-21-1835/2 Swastik, Student Lane", 195, 19, { align: 'right' });
    doc.text("Alveres Road, Near Kadri Market", 195, 23, { align: 'right' });
    doc.text("Kadri, Mangalore - 575002", 195, 27, { align: 'right' });
    doc.text("Karnataka, India", 195, 31, { align: 'right' });
    doc.text("knottytown64@gmail.com", 195, 36, { align: 'right' });

    // --- Divider / Title ---
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("TAX INVOICE", 15, 60);

    // --- Invoice Meta Information ---
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text(`INVOICE NO:`, 130, 60);
    doc.setFont("helvetica", "normal");
    doc.text(`${order.id}`, 160, 60);

    doc.setFont("helvetica", "bold");
    doc.text(`DATE:`, 130, 66);
    doc.setFont("helvetica", "normal");
    doc.text(`${new Date(order.date).toLocaleDateString()}`, 160, 66);

    doc.setFont("helvetica", "bold");
    doc.text(`PAYMENT:`, 130, 72);
    doc.setFont("helvetica", "normal");
    doc.text(`${order.paymentMethod.toUpperCase()}`, 160, 72);

    // --- Billing Details ---
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.line(15, 80, 195, 80);

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO:", 15, 90);

    doc.setFontSize(9);
    doc.text(order.customer.name.toUpperCase(), 15, 96);
    doc.setFont("helvetica", "normal");
    doc.text(order.customer.address, 15, 101);
    doc.text(`${order.customer.city} - ${order.customer.pincode}`, 15, 106);
    doc.text(`Phone: ${order.customer.phone}`, 15, 111);
    doc.text(`Email: ${order.customer.email.toLowerCase()}`, 15, 116);

    // --- Shipping Details ---
    doc.setFont("helvetica", "bold");
    doc.text("SHIP TO:", 110, 90);
    doc.setFont("helvetica", "normal");
    doc.text(order.customer.name.toUpperCase(), 110, 96);
    doc.text(order.customer.address, 110, 101);
    doc.text(`${order.customer.city} - ${order.customer.pincode}`, 110, 106);
    doc.text(`Delivery Mob: ${order.customer.phone}`, 110, 111);

    // --- Items Table ---
    const tableColumn = ["#", "ITEM DESCRIPTION", "SIZE", "QTY", "RATE", "TOTAL"];
    const tableRows = order.items.map((item, index) => [
        index + 1,
        item.name.toUpperCase(),
        item.selectedSize || 'N/A',
        item.quantity,
        `Rs. ${Number(item.price).toFixed(2)}`,
        `Rs. ${(item.price * item.quantity).toFixed(2)}`
    ]);

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 125,
        theme: 'plain', // Cleaner look for professional printing
        styles: {
            font: "helvetica",
            fontSize: 8,
            cellPadding: 4,
            lineColor: [220, 220, 220],
            lineWidth: 0.1,
            valign: 'middle'
        },
        headStyles: {
            fillColor: [0, 0, 0],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            halign: 'left'
        },
        columnStyles: {
            0: { cellWidth: 10, halign: 'center' },
            1: { cellWidth: 80 },
            2: { halign: 'center' },
            3: { halign: 'center' },
            4: { halign: 'right' },
            5: { halign: 'right' }
        },
        margin: { left: 15, right: 15 } // Ensure margins match header
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;

    // --- Calculation Summary ---
    const subtotal = order.total - (Number(order.shipping_price) || 0);
    const shipping = Number(order.shipping_price) || 0;
    const total = order.total;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");

    const summaryX = 120;
    doc.text("Total Item Rate:", summaryX, finalY);
    doc.text(`Rs. ${subtotal.toFixed(2)}`, 195, finalY, { align: 'right' });

    doc.text("Shipping & Handling:", summaryX, finalY + 6);
    doc.text(`Rs. ${shipping.toFixed(2)}`, 195, finalY + 6, { align: 'right' });

    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(summaryX, finalY + 10, 195, finalY + 10);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("AMOUNT PAID:", summaryX, finalY + 18);
    doc.text(`Rs. ${total.toFixed(2)}`, 195, finalY + 18, { align: 'right' });

    // --- Footer / Terms ---
    const footerY = 250;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(20, footerY, 190, footerY);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(150, 150, 150);
    doc.text("Terms & Conditions:", 20, footerY + 10);
    doc.text("1. All sales are final. 2. Please report defects within 24 hours of delivery.", 20, footerY + 15);
    doc.text("3. This is a computer-generated invoice and does not require a physical signature.", 20, footerY + 20);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("STAY KNOTTY.", 105, footerY + 35, { align: 'center' });

    doc.save(`Invoice_${order.id}.pdf`);
};

export const generateShippingLabel = (order: Order) => {
    // 4x6 inch label is 101.6mm x 152.4mm
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [101.6, 152.4]
    });

    // Outer Border
    doc.setDrawColor(0);
    doc.setLineWidth(1.5);
    doc.rect(2, 2, 97.6, 148.4);

    // Header Section
    doc.setFillColor(0, 0, 0);
    doc.rect(2, 2, 97.6, 25, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("KNOTTY TOWN", 4, 18);

    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text("KT-EXPRESS | PREMIUM DELIVERY", 4, 23);

    // Sender Section (Small)
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("RETURN ADDRESS:", 5, 33);
    doc.setFont("helvetica", "normal");
    doc.text("KNOTTY TOWN CLOTHING", 5, 37);
    doc.text("#3-21-1835/2 Swastik, Student Lane, Alveres Road", 5, 40);
    doc.text("Near Kadri Market, Kadri, Mangalore - 575002", 5, 43);

    doc.setLineWidth(0.5);
    doc.line(2, 45, 99.6, 45);

    // Recipient Section (Large)
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("SHIP TO:", 5, 55);

    doc.setFontSize(16);
    doc.text(order.customer.name.toUpperCase(), 10, 65);

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    const splitAddress = doc.splitTextToSize(order.customer.address, 85);
    doc.text(splitAddress, 10, 75);

    const addressOffset = splitAddress.length * 6;
    doc.setFont("helvetica", "bold");
    doc.text(`${order.customer.city} - ${order.customer.pincode}`, 10, 75 + addressOffset);

    doc.setFontSize(14);
    doc.text(`MOB: ${order.customer.phone}`, 10, 85 + addressOffset);

    // Divider
    doc.setLineWidth(0.8);
    doc.line(2, 110, 99.6, 110);

    // Order/Tracking Info
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`ORDER ID:`, 5, 120);
    doc.setFont("helvetica", "normal");
    doc.text(order.id, 30, 120);

    doc.setFont("helvetica", "bold");
    doc.text(`METHOD:`, 5, 128);
    doc.setFont("helvetica", "normal");
    doc.text(order.paymentMethod.toUpperCase(), 30, 128);

    doc.setFont("helvetica", "bold");
    doc.text(`WEIGHT:`, 5, 136);
    doc.setFont("helvetica", "normal");
    doc.text("~0.5 KG", 30, 136);

    // Barcode / Delivery Code Visual
    doc.setFillColor(0, 0, 0);
    doc.rect(65, 115, 30, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("KT", 73, 130);
    doc.setFontSize(8);
    doc.text("READY", 72, 138);

    doc.save(`ShippingLabel_${order.id}.pdf`);
};

