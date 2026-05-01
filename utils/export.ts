import type { DayPlan } from '../types/itinerary'
import { buildSchedule, formatMinutes } from './time'

export type PosterTemplate = 'classic' | 'timeline' | 'compact'

type ExportRow = Array<string | number | undefined>

const textEncoder = new TextEncoder()

export const csvCell = (value?: string | number) => `"${String(value ?? '').replace(/"/g, '""')}"`

export const buildTextSummary = (days: DayPlan[]) => {
  return days.map(day => {
    const daySchedule = buildSchedule(day)
    const lines = [
      `${day.title}｜${day.date || '未設定日期'}｜出發 ${day.startTime || '09:00'}`,
      day.notes ? `備註：${day.notes}` : '',
      ...day.items.map((item, idx) => {
        const slot = daySchedule[idx]
        const stay = formatMinutes(item.stayDuration || 60)
        const travel = item.travelTime ? `｜下一站 ${item.travelTime}` : ''
        const note = item.notes ? `\n  備註：${item.notes}` : ''
        return `${idx + 1}. ${slot?.start || ''}-${slot?.end || ''} ${item.name}｜停留 ${stay}${travel}\n  ${item.address}${note}`
      }),
    ].filter(Boolean)
    return lines.join('\n')
  }).join('\n\n')
}

export const buildLineShareText = (days: DayPlan[]) => {
  const summary = buildTextSummary(days)
  return `旅遊行程分享\n\n${summary}\n\n由 Travel Architect 規劃`
}

export const buildCsv = (days: DayPlan[]) => {
  const header = ['Day', 'Date', 'Start', 'End', 'Place', 'Address', 'StayMinutes', 'TravelToNext', 'Notes']
  const rows = buildExportRows(days)
  return [header, ...rows].map(row => row.map(csvCell).join(',')).join('\n')
}

export const buildXlsxBlob = (days: DayPlan[]) => {
  const header = ['Day', 'Date', 'Start', 'End', 'Place', 'Address', 'StayMinutes', 'TravelToNext', 'Notes']
  const rows = [header, ...buildExportRows(days)]
  const sheetRows = rows.map((row, rowIdx) => {
    const cells = row.map((value, colIdx) => {
      const ref = `${columnName(colIdx + 1)}${rowIdx + 1}`
      const text = escapeXml(String(value ?? ''))
      return `<c r="${ref}" t="inlineStr"><is><t>${text}</t></is></c>`
    }).join('')
    return `<row r="${rowIdx + 1}">${cells}</row>`
  }).join('')

  return zipFiles({
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
    '_rels/.rels': `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="TravelPlan" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
    'xl/worksheets/sheet1.xml': `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`,
  }, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
}

export const buildIcs = (days: DayPlan[]) => {
  const now = toIcsDateTime(new Date().toISOString().slice(0, 10), '00:00')
  const events = days.flatMap(day => {
    const date = day.date || new Date().toISOString().slice(0, 10)
    const daySchedule = buildSchedule(day)
    return day.items.map((item, idx) => {
      const slot = daySchedule[idx]
      const start = toIcsDateTime(date, slot?.start || day.startTime || '09:00')
      const end = toIcsDateTime(date, slot?.end || day.startTime || '10:00')
      return [
        'BEGIN:VEVENT',
        `UID:${escapeIcs(`${day.id}-${item.id}@travel-architect`)}`,
        `DTSTAMP:${now}Z`,
        `DTSTART:${start}`,
        `DTEND:${end}`,
        `SUMMARY:${escapeIcs(`${day.title} - ${item.name}`)}`,
        `LOCATION:${escapeIcs(item.address || item.name)}`,
        `DESCRIPTION:${escapeIcs([item.notes, item.travelTime ? `下一站交通：${item.travelTime}` : ''].filter(Boolean).join('\\n'))}`,
        'END:VEVENT',
      ].join('\r\n')
    })
  })

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Travel Architect//Itinerary//ZH-TW',
    'CALSCALE:GREGORIAN',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')
}

export const buildGoogleCalendarUrl = (days: DayPlan[]) => {
  const firstDay = days.find(day => day.items.length > 0) || days[0]
  if (!firstDay) return ''
  const daySchedule = buildSchedule(firstDay)
  const date = firstDay.date || new Date().toISOString().slice(0, 10)
  const start = toGoogleDateTime(date, firstDay.startTime || '09:00')
  const end = toGoogleDateTime(date, daySchedule[daySchedule.length - 1]?.end || firstDay.startTime || '10:00')
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Travel Architect：${days.map(day => day.title).join(' / ')}`,
    dates: `${start}/${end}`,
    details: buildTextSummary(days),
    location: firstDay.items[0]?.address || '',
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

export const encodeSharePayload = async (days: DayPlan[], travelMode: string) => {
  const payload = JSON.stringify({
    d: days.map(d => ({
      t: d.title,
      s: d.startTime,
      dt: d.date,
      no: d.notes,
      i: d.items.map(item => ({
        p: item.id,
        n: item.name,
        a: item.address,
        lt: roundCoord(item.lat),
        lg: roundCoord(item.lng),
        no: item.notes,
        sd: item.stayDuration,
        ty: item.type,
      })),
    })),
    m: travelMode,
  })

  if ('CompressionStream' in window) {
    const stream = new Blob([payload]).stream().pipeThrough(new (window as any).CompressionStream('gzip'))
    const buffer = await new Response(stream).arrayBuffer()
    return `gz.${bytesToBase64Url(new Uint8Array(buffer))}`
  }

  return `b64.${bytesToBase64Url(textEncoder.encode(payload))}`
}

export const decodeSharePayload = async (encoded: string) => {
  if (encoded.startsWith('gz.') && 'DecompressionStream' in window) {
    const bytes = base64UrlToBytes(encoded.slice(3))
    const stream = new Blob([bytes]).stream().pipeThrough(new (window as any).DecompressionStream('gzip'))
    const text = await new Response(stream).text()
    return JSON.parse(text)
  }

  if (encoded.startsWith('b64.')) {
    return JSON.parse(new TextDecoder().decode(base64UrlToBytes(encoded.slice(4))))
  }

  return JSON.parse(decodeURIComponent(atob(encoded)))
}

const buildExportRows = (days: DayPlan[]): ExportRow[] => {
  return days.flatMap(day => {
    const daySchedule = buildSchedule(day)
    return day.items.map((item, idx) => [
      day.title,
      day.date || '',
      daySchedule[idx]?.start,
      daySchedule[idx]?.end,
      item.name,
      item.address,
      item.stayDuration || 60,
      item.travelTime || '',
      item.notes || '',
    ])
  })
}

const roundCoord = (value: number) => Math.round(value * 1000000) / 1000000

const xmlEscapeMap: Record<string, string> = { '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }

const escapeXml = (value: string) => value.replace(/[<>&'"]/g, char => xmlEscapeMap[char] || char)

const escapeIcs = (value: string) => value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;')

const toIcsDateTime = (date: string, time: string) => `${date.replace(/-/g, '')}T${time.replace(':', '')}00`

const toGoogleDateTime = (date: string, time: string) => `${date.replace(/-/g, '')}T${time.replace(':', '')}00`

const columnName = (index: number) => {
  let name = ''
  while (index > 0) {
    const rem = (index - 1) % 26
    name = String.fromCharCode(65 + rem) + name
    index = Math.floor((index - 1) / 26)
  }
  return name
}

const bytesToBase64Url = (bytes: Uint8Array) => {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.slice(i, i + 0x8000))
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

const base64UrlToBytes = (value: string) => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

const crcTable = Array.from({ length: 256 }, (_, index) => {
  let c = index
  for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})

const crc32 = (bytes: Uint8Array) => {
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i += 1) crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

const zipFiles = (files: Record<string, string>, type: string) => {
  const localParts: Uint8Array[] = []
  const centralParts: Uint8Array[] = []
  let offset = 0

  Object.entries(files).forEach(([name, content]) => {
    const nameBytes = textEncoder.encode(name)
    const data = textEncoder.encode(content)
    const crc = crc32(data)
    const local = zipHeader(0x04034b50, nameBytes, crc, data.length, offset)
    localParts.push(local, nameBytes, data)
    centralParts.push(zipHeader(0x02014b50, nameBytes, crc, data.length, offset), nameBytes)
    offset += local.length + nameBytes.length + data.length
  })

  const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0)
  const end = new Uint8Array(22)
  const view = new DataView(end.buffer)
  view.setUint32(0, 0x06054b50, true)
  view.setUint16(8, Object.keys(files).length, true)
  view.setUint16(10, Object.keys(files).length, true)
  view.setUint32(12, centralSize, true)
  view.setUint32(16, offset, true)

  return new Blob([...localParts, ...centralParts, end], { type })
}

const zipHeader = (signature: number, nameBytes: Uint8Array, crc: number, size: number, offset: number) => {
  const isCentral = signature === 0x02014b50
  const bytes = new Uint8Array(isCentral ? 46 : 30)
  const view = new DataView(bytes.buffer)
  view.setUint32(0, signature, true)
  if (isCentral) view.setUint16(4, 20, true)
  view.setUint16(isCentral ? 6 : 4, 20, true)
  view.setUint16(isCentral ? 8 : 6, 0x0800, true)
  view.setUint16(isCentral ? 10 : 8, 0, true)
  view.setUint32(isCentral ? 16 : 14, crc, true)
  view.setUint32(isCentral ? 20 : 18, size, true)
  view.setUint32(isCentral ? 24 : 22, size, true)
  view.setUint16(isCentral ? 28 : 26, nameBytes.length, true)
  if (isCentral) view.setUint32(42, offset, true)
  return bytes
}
