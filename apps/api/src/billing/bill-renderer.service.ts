import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class BillRendererService {
  private readonly logger = new Logger(BillRendererService.name);
  private readonly storageDir = path.resolve(process.cwd(), 'uploads', 'bills');

  constructor(private readonly db: DatabaseService) {
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }
  }

  generateHtmlTemplate(sale: any): string {
    const formattedDate = new Date(sale.entry_at).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    const formattedDueDate = new Date(sale.due_date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const linesHtml = sale.lines
      .map(
        (line: any, idx: number) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #EFEAE3; text-align: center;">${idx + 1}</td>
          <td style="padding: 10px; border-bottom: 1px solid #EFEAE3;"><strong>${line.item_name}</strong></td>
          <td style="padding: 10px; border-bottom: 1px solid #EFEAE3; text-align: right; font-variant-numeric: tabular-nums;">${line.pieces}</td>
          <td style="padding: 10px; border-bottom: 1px solid #EFEAE3; text-align: right; font-variant-numeric: tabular-nums;">${parseFloat(line.weight_kg).toFixed(3)} Kg</td>
          <td style="padding: 10px; border-bottom: 1px solid #EFEAE3; text-align: right; font-variant-numeric: tabular-nums;">₹${parseFloat(line.rate).toLocaleString('en-IN')}</td>
          <td style="padding: 10px; border-bottom: 1px solid #EFEAE3; text-align: right; font-variant-numeric: tabular-nums; font-weight: 700;">₹${parseFloat(line.amount).toLocaleString('en-IN')}</td>
        </tr>`,
      )
      .join('');

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Helvetica Neue', Arial, sans-serif; }
        body { background: #FFFFFF; color: #2B2B2B; width: 800px; padding: 40px; margin: 0 auto; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #9B1C31; padding-bottom: 24px; }
        .brand-name { font-size: 32px; font-weight: 800; color: #9B1C31; letter-spacing: -0.5px; }
        .brand-sub { font-size: 13px; color: #B8893B; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; }
        .bill-badge { text-align: right; }
        .bill-badge h2 { font-size: 24px; color: #2B2B2B; font-weight: 700; }
        .bill-badge p { font-size: 14px; color: #7A7268; margin-top: 4px; }
        .party-box { background: #FBF7F2; border-radius: 8px; padding: 18px 24px; margin: 28px 0; display: flex; justify-content: space-between; }
        .party-box div { font-size: 14px; }
        .table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
        .table th { background: #F5EFEB; color: #5C554E; padding: 12px 10px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        .totals-row { margin-top: 24px; display: flex; justify-content: flex-end; }
        .totals-box { width: 300px; background: #FBF7F2; padding: 18px; border-radius: 8px; }
        .totals-line { display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 8px; }
        .grand-total { font-size: 18px; font-weight: 800; color: #9B1C31; border-top: 2px solid #EFEAE3; padding-top: 8px; margin-top: 8px; }
        .footer { margin-top: 40px; border-top: 1px solid #EFEAE3; padding-top: 16px; font-size: 12px; color: #7A7268; text-align: center; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="brand-name">Kumkum Payal</div>
          <div class="brand-sub">Exclusive Jewellery & Job Work</div>
          <div style="font-size: 12px; color: #7A7268; margin-top: 6px;">Johri Bazaar, Jaipur · GSTIN: 08AAAPK1234F1Z0</div>
        </div>
        <div class="bill-badge">
          <h2>INVOICE #${sale.bill_no}</h2>
          <p>Date: <strong>${formattedDate}</strong></p>
          <p>Due Date: <strong style="color: #9B1C31;">${formattedDueDate}</strong></p>
        </div>
      </div>

      <div class="party-box">
        <div>
          <div style="color: #7A7268; font-size: 11px; text-transform: uppercase; font-weight: 700;">Billed To:</div>
          <div style="font-size: 18px; font-weight: 700; color: #2B2B2B; margin-top: 4px;">${sale.party_name}</div>
          <div style="color: #5C554E; margin-top: 2px;">Phone: ${sale.party_phone || 'N/A'}</div>
        </div>
        <div style="text-align: right;">
          <div style="color: #7A7268; font-size: 11px; text-transform: uppercase; font-weight: 700;">Status:</div>
          <div style="display: inline-block; padding: 4px 12px; border-radius: 12px; font-weight: 700; font-size: 12px; background: #FEF3C7; color: #92400E; margin-top: 4px;">
            ${sale.status}
          </div>
        </div>
      </div>

      <table class="table">
        <thead>
          <tr>
            <th style="text-align: center; width: 40px;">#</th>
            <th>Item Description</th>
            <th style="text-align: right;">Pieces</th>
            <th style="text-align: right;">Weight (Kg)</th>
            <th style="text-align: right;">Rate (₹)</th>
            <th style="text-align: right;">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          ${linesHtml}
        </tbody>
      </table>

      <div class="totals-row">
        <div class="totals-box">
          <div class="totals-line">
            <span>Subtotal</span>
            <span>₹${parseFloat(sale.total_amount).toLocaleString('en-IN')}</span>
          </div>
          <div class="totals-line grand-total">
            <span>Total Payable</span>
            <span>₹${parseFloat(sale.total_amount).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>This is a computer-generated tax invoice. Date and time are recorded automatically.</p>
        <p style="margin-top: 4px;">Thank you for your business! · Kumkum Payal Jewellery</p>
      </div>
    </body>
    </html>`;
  }

  async renderBillToJpg(sale: any): Promise<Buffer> {
    const html = this.generateHtmlTemplate(sale);

    try {
      // Dynamic import puppeteer to handle container and non-container environments
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({
        headless: 'new',
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });

      const page = await browser.newPage();
      await page.setViewport({ width: 800, height: 1000, deviceScaleFactor: 2 });
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const imageBuffer = await page.screenshot({ type: 'jpeg', quality: 95, fullPage: true });
      await browser.close();

      return imageBuffer;
    } catch (err) {
      this.logger.warn(`Puppeteer browser launch failed (${err.message}). Using sharp fallback.`);
      
      // Fallback: render SVG card converted to high-res JPG via Sharp
      const sharp = require('sharp');
      const svg = `
        <svg width="800" height="900" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#FBF7F2"/>
          <rect x="20" y="20" width="760" height="860" rx="16" fill="#FFFFFF" stroke="#EFEAE3" stroke-width="2"/>
          <text x="50" y="80" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="#9B1C31">KUMKUM PAYAL</text>
          <text x="50" y="105" font-family="Arial, sans-serif" font-size="14" fill="#B8893B">INVOICE #${sale.bill_no}</text>
          <line x1="50" y1="125" x2="750" y2="125" stroke="#9B1C31" stroke-width="2"/>
          <text x="50" y="160" font-family="Arial, sans-serif" font-size="16" fill="#2B2B2B">Billed to: ${sale.party_name}</text>
          <text x="50" y="190" font-family="Arial, sans-serif" font-size="14" fill="#7A7268">Due Date: ${sale.due_date}</text>
          <text x="50" y="240" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#2B2B2B">Total Amount: ₹${parseFloat(sale.total_amount).toLocaleString('en-IN')}</text>
          <text x="50" y="820" font-family="Arial, sans-serif" font-size="12" fill="#7A7268">Date and time are recorded automatically.</text>
        </svg>
      `;
      return await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toBuffer();
    }
  }

  async saveAndRecordBill(sale: any): Promise<{ filePath: string; fileName: string }> {
    const buffer = await this.renderBillToJpg(sale);
    const fileName = `bill_${sale.bill_no}_${sale.id}.jpg`;
    const filePath = path.join(this.storageDir, fileName);

    fs.writeFileSync(filePath, buffer);

    await this.db.query(
      `INSERT INTO bill_images (sale_id, file_path) VALUES ($1, $2)`,
      [sale.id, filePath],
    );

    return { filePath, fileName };
  }
}
