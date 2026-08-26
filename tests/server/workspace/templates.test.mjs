import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import * as fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'
import * as XLSX from 'xlsx'

XLSX.set_fs(fs)

const templates = [
  ['monthly-energy.xlsx', ['月份', '用电量kWh', '电费元']],
  ['load-curve.xlsx', ['时间', '负荷kW']],
  ['enterprises.xlsx', ['企业名称', '行业']],
  ['projects.xlsx', ['项目名称', '类型', '状态']],
]

test('template builder produces four readable workbooks with fixed required columns', () => {
  const run = spawnSync(process.execPath, ['scripts/build-workspace-templates.mjs'], {
    cwd: fileURLToPath(new URL('../../../', import.meta.url)),
    encoding: 'utf8',
  })
  assert.equal(run.status, 0, run.stderr)

  for (const [filename, requiredHeaders] of templates) {
    const workbook = XLSX.readFile(fileURLToPath(new URL(`../../../public/templates/${filename}`, import.meta.url)))
    assert.deepEqual(workbook.SheetNames, ['数据模板', '填写说明'])
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets.数据模板, { header: 1 })
    for (const header of requiredHeaders) assert.ok(rows[0].includes(header), `${filename} is missing ${header}`)
  }
})
