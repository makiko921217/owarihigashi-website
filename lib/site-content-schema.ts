import { z } from 'zod'

/**
 * 管理画面とトップページで共有する型と上限値。
 * クライアント側からも読み込むので、ここにサーバー専用のコードを置かないこと。
 */

export const MAX_EVENTS = 20
export const MAX_EXAM_BUTTONS = 3
export const MAX_PDF_BYTES = 10 * 1024 * 1024

export const eventSchema = z.object({
  id: z.string().min(1).max(64),
  date: z.string().trim().max(40),
  title: z.string().trim().max(120),
  place: z.string().trim().max(120),
})

/**
 * 受け付けるのは次の2つだけ:
 *   - `/xxx.pdf`  … public/ に直接置いてある従来のPDF
 *   - `https://…` … 管理画面からアップロードされたPDF（Vercel Blob 上）
 * `javascript:` などを弾くため、ここは URL 全般ではなくこの2形式に絞る。
 */
const pdfUrlSchema = z
  .string()
  .max(600)
  .refine(
    (value) => /^\/[^/]/.test(value) || /^https:\/\/[^\s]+$/i.test(value),
    'PDFが選ばれていないボタンがあります。'
  )

export const examButtonSchema = z.object({
  id: z.string().min(1).max(64),
  label: z.string().trim().min(1, 'ボタンの文章が空のものがあります。').max(160),
  pdfUrl: pdfUrlSchema,
  pdfName: z.string().trim().max(200).default(''),
})

export const contentSchema = z.object({
  events: z.array(eventSchema).max(MAX_EVENTS),
  examButtons: z.array(examButtonSchema).max(MAX_EXAM_BUTTONS),
})

export type EventItem = z.infer<typeof eventSchema>
export type ExamButton = z.infer<typeof examButtonSchema>
export type SiteContent = z.infer<typeof contentSchema>
