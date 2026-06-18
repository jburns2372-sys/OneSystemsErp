const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({ margin: 50 });
const outputPath = path.join(__dirname, '..', 'public', 'Accomplishment_Report_Seed.pdf');

doc.pipe(fs.createWriteStream(outputPath));

// Header
doc.fontSize(20).font('Helvetica-Bold').text('PROGRESS ACCOMPLISHMENT REPORT', { align: 'center' });
doc.moveDown();

// Details
doc.fontSize(12).font('Helvetica-Bold').text('Subcontractor: ', { continued: true }).font('Helvetica').text('Mechanical Experts Inc.');
doc.font('Helvetica-Bold').text('Project: ', { continued: true }).font('Helvetica').text('Supply, Delivery, Installation, Testing, and Commissioning of VRF Air-Conditioning for 3rd Floor OR');
doc.font('Helvetica-Bold').text('Period: ', { continued: true }).font('Helvetica').text('June 2026');
doc.moveDown(2);

// Item 1
doc.fontSize(14).font('Helvetica-Bold').text('1. Mobilization and Demobilization');
doc.fontSize(12).font('Helvetica').text('- We have fully mobilized all manpower and brought 100% of the tools and equipment on-site. Temporary facilities have been established.');
doc.text('- Progress for this item is 100% complete.');
doc.moveDown();

// Item 2
doc.fontSize(14).font('Helvetica-Bold').text('2. Site Management Work (a. Project Management)');
doc.fontSize(12).font('Helvetica').text('- Project managers have been on site coordinating with the general contractor. Site layout and shop drawings are currently under review.');
doc.text('- We estimate our overall project management effort is currently at 25%.');
doc.moveDown();

// Item 3
doc.fontSize(14).font('Helvetica-Bold').text('3. Site Management Work (b. Admin Support - Accounting, Procurement, Logistics)');
doc.fontSize(12).font('Helvetica').text('- The admin and procurement team has successfully placed orders for all long-lead materials and secured the delivery schedule.');
doc.text('- We evaluate this item\'s accomplishment at exactly 40%.');
doc.moveDown(3);

// Signature
doc.fontSize(12).text('Prepared by:');
doc.moveDown();
doc.font('Helvetica-Bold').text('Engr. Juan Dela Cruz');
doc.font('Helvetica').text('Mechanical Experts Inc.');

doc.end();

console.log(`PDF created successfully at: ${outputPath}`);
