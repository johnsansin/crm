export function escapeHtml(value: any): string {
  if (value === null || value === undefined) return ''
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function fmt(value: any): string {
  if (value === null || value === undefined || value === '') return '0.00'
  const n = Number(value)
  return Number.isFinite(n) ? n.toFixed(2) : String(value)
}

export interface ReportItem {
  name: string
  description?: string | null
  qty: any
  rate: any
  discount: any
  tax: any
  total: any
}

export interface ReportTotalsRow {
  label: string
  value: any
  grand?: boolean
}

export interface ReportOptions {
  title: string
  docNo: string
  fileNamePrefix: string
  companyName: string
  companyAddress: string
  billToLabel: string
  billTo: string
  metaLines: string[]
  items: ReportItem[]
  totals: ReportTotalsRow[]
  sections: string[]
}

export function renderReport(opts: ReportOptions): string {
  const itemsHtml = opts.items
    .map((item, i) => {
      const desc = item.description
        ? `<div class="item-desc">${escapeHtml(item.description)}</div>`
        : ''
      return `<tr>
        <td>${i + 1}</td>
        <td class="item-name">${escapeHtml(item.name)}${desc}</td>
        <td>${Number(item.qty)}</td>
        <td class="num">${fmt(item.rate)}</td>
        <td class="num">${fmt(item.discount)}</td>
        <td class="num">${fmt(item.tax)}</td>
        <td class="num">${fmt(item.total)}</td>
      </tr>`
    })
    .join('')

  const totalsHtml = opts.totals
    .map(
      (r) => `<tr${r.grand ? ' class="grand"' : ''}><td>${escapeHtml(r.label)}</td><td class="num">${fmt(r.value)}</td></tr>`
    )
    .join('')

  const sectionsHtml = opts.sections.join('')
  const address = opts.companyAddress ? `<div class="company-address">${opts.companyAddress}</div>` : ''
  const metaHtml = opts.metaLines.map((l) => `<div>${l}</div>`).join('')

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(opts.docNo || opts.title)}</title>
<style>
*{box-sizing:border-box}
body{font-family:Arial,'Helvetica Neue',Helvetica,sans-serif;margin:24px;color:#333;line-height:1.5}
.report{max-width:920px;margin:0 auto}
.header{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-start;gap:16px;margin-bottom:20px}
.company{font-size:22px;font-weight:bold;color:#1a1a2e;word-break:break-word}
.company-address{font-size:12px;color:#666;margin-top:4px;word-break:break-word}
.brand{text-align:right}
.title{font-size:26px;font-weight:bold;color:#1a1a2e;margin-bottom:4px}
.meta{color:#666;font-size:14px;word-break:break-word}
.meta-box{width:100%;border-collapse:collapse;margin:0 0 12px}
.meta-box td{vertical-align:top;padding:8px 12px;word-break:break-word}
.meta-box td.meta-left{width:50%}
.meta-box td.meta-right{width:50%}
.meta-box .label{font-weight:bold}
.items-table{width:100%;border-collapse:collapse;margin:14px 0;table-layout:fixed}
.items-table th{background:#1a1a2e;color:#fff;padding:8px 6px;text-align:left;font-size:12px}
.items-table th:nth-child(1){width:5%}
.items-table th:nth-child(2){width:36%}
.items-table th:nth-child(3){width:9%}
.items-table th:nth-child(4){width:12%}
.items-table th:nth-child(5){width:12%}
.items-table th:nth-child(6){width:12%}
.items-table th:nth-child(7){width:14%}
.items-table th.num{text-align:right}
.items-table td{padding:7px 6px;border-bottom:1px solid #eee;word-break:break-word;overflow-wrap:break-word;vertical-align:top}
.items-table td:first-child{text-align:center}
.items-table td:nth-child(3){text-align:center}
.items-table .item-name{font-weight:600}
.items-table .num{text-align:right;white-space:nowrap}
.item-desc{font-size:11px;color:#666;font-weight:normal;margin-top:2px;word-break:break-word}
.totals{width:100%;max-width:300px;margin-left:auto;border-collapse:collapse}
.totals td{padding:5px 10px;border:none;word-break:break-word}
.totals tr.grand td{font-size:17px;font-weight:bold;color:#1a1a2e;border-top:2px solid #1a1a2e}
.section{margin-top:22px;word-break:break-word}
.section .label{font-weight:bold}
.section p{margin:6px 0 0;white-space:pre-wrap;word-break:break-word}
.footer{margin-top:30px;border-top:2px solid #1a1a2e;padding-top:12px;font-size:12px;color:#666}
@media(max-width:600px){
body{margin:10px}
.header{flex-direction:column}
.brand{text-align:left}
.title{font-size:22px}
.company{font-size:19px}
.items-table th{font-size:10px;padding:6px 3px}
.items-table td{font-size:12px;padding:6px 3px}
.items-table th:nth-child(2){width:30%}
.items-table th:nth-child(7){width:15%}
.meta-box td{display:block;width:100%!important;padding:4px 8px}
.totals{max-width:100%}
}
@media print{
@page{size:A4;margin:12mm}
body{margin:0;font-size:12px}
.header{page-break-inside:avoid}
.items-table tr{page-break-inside:avoid}
.totals{page-break-inside:avoid}
}
</style></head><body>
<div class="report">
<div class="header">
<div><div class="company">${escapeHtml(opts.companyName)}</div>${address}</div>
<div class="brand"><div class="title">${escapeHtml(opts.title)}</div><div class="meta">${escapeHtml(opts.docNo)}</div></div>
</div>
<table class="meta-box"><tr>
<td class="meta-left"><span class="label">${escapeHtml(opts.billToLabel)}</span><br>${opts.billTo || 'N/A'}</td>
<td class="meta-right">${metaHtml}</td>
</tr></table>
<table class="items-table"><thead><tr><th>#</th><th>Item</th><th>Qty</th><th class="num">Rate</th><th class="num">Disc</th><th class="num">Tax</th><th class="num">Total</th></tr></thead><tbody>${itemsHtml}</tbody></table>
<table class="totals">${totalsHtml}</table>
${sectionsHtml}
<div class="footer">Generated by BizForce CRM &middot; ${new Date().toLocaleString()}</div>
</div>
</body></html>`
}
