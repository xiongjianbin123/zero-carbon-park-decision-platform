import { mkdir } from 'node:fs/promises'
import * as fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import * as XLSX from 'xlsx'
import { IMPORT_COLUMNS } from '../src/services/importWorkbook.ts'

const templateNames = {
  energy_monthly: 'monthly-energy.xlsx',
  load_curve: 'load-curve.xlsx',
  enterprises: 'enterprises.xlsx',
  projects: 'projects.xlsx',
}

const outputDirectory = new URL('../public/templates/', import.meta.url)
await mkdir(outputDirectory, { recursive: true })
XLSX.set_fs(fs)

for (const [kind, columns] of Object.entries(IMPORT_COLUMNS)) {
  const workbook = XLSX.utils.book_new()
  const dataSheet = XLSX.utils.aoa_to_sheet([
    columns.map((column) => column.header),
    columns.map((column) => column.example),
  ])
  dataSheet['!cols'] = columns.map((column) => ({ wch: Math.max(14, column.header.length * 2 + 2) }))
  dataSheet['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft', state: 'frozen' }
  const guideSheet = XLSX.utils.json_to_sheet(columns.map((column) => ({
    列名: column.header,
    是否必填: column.required ? '是' : '否',
    填写说明: column.description,
    示例: column.example,
  })))
  guideSheet['!cols'] = [{ wch: 24 }, { wch: 12 }, { wch: 34 }, { wch: 24 }]
  XLSX.utils.book_append_sheet(workbook, dataSheet, '数据模板')
  XLSX.utils.book_append_sheet(workbook, guideSheet, '填写说明')
  XLSX.writeFile(workbook, fileURLToPath(new URL(templateNames[kind], outputDirectory)), { compression: true })
}

console.log(`已生成 ${Object.keys(templateNames).length} 份园区数据导入模板。`)
