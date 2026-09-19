'use client'

import { useActionState, useEffect, useMemo, useRef, useState, useTransition } from 'react'
import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  Plus,
  Save,
  Trash2,
  Upload,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveContentAction, uploadPdfAction, type SaveState } from '@/app/admin/actions'
import {
  MAX_EVENTS,
  MAX_EXAM_BUTTONS,
  type EventItem,
  type ExamButton,
  type SiteContent,
} from '@/lib/site-content-schema'

const initialState: SaveState = { ok: false, message: '' }

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function move<T>(items: T[], from: number, to: number): T[] {
  if (to < 0 || to >= items.length) return items
  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

export function ContentEditor({ initial, sha }: { initial: SiteContent; sha: string | null }) {
  const [events, setEvents] = useState<EventItem[]>(initial.events)
  const [buttons, setButtons] = useState<ExamButton[]>(initial.examButtons)
  const [state, formAction, saving] = useActionState(saveContentAction, initialState)

  // GitHub 上のファイルの版。保存のたびに更新し、他所で書き換えられていたら中止させる。
  const [currentSha, setCurrentSha] = useState(sha)

  const payload = useMemo(() => JSON.stringify({ events, examButtons: buttons }), [events, buttons])
  const savedPayload = useRef(payload)
  const dirty = payload !== savedPayload.current

  useEffect(() => {
    if (!state.ok) return
    // 保存が成功した瞬間の内容を「保存済み」として記録する
    savedPayload.current = payload
    if (state.sha !== undefined) setCurrentSha(state.sha)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state])

  // 保存せずにページを閉じようとしたら引き止める
  useEffect(() => {
    if (!dirty) return
    const handler = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [dirty])

  return (
    <form action={formAction} className="space-y-8 pb-32">
      <input type="hidden" name="payload" value={payload} />
      <input type="hidden" name="sha" value={currentSha ?? ''} />

      {/* ---------------- 行事予定 ---------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">直近の行事予定</CardTitle>
          <CardDescription className="text-base">
            トップページのカレンダーの下に出る一覧です。上から順に表示されます。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="hidden gap-3 px-1 text-sm font-medium text-muted-foreground sm:grid sm:grid-cols-[7rem_1fr_1fr_auto]">
            <span>日付</span>
            <span>行事名</span>
            <span>場所</span>
            <span className="w-[9.5rem]" />
          </div>

          {events.map((event, index) => (
            <div
              key={event.id}
              className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[7rem_1fr_1fr_auto] sm:items-center sm:border-0 sm:p-1"
            >
              <LabelledInput
                label="日付"
                placeholder="9/13"
                value={event.date}
                onChange={(value) =>
                  setEvents((prev) => prev.map((item, i) => (i === index ? { ...item, date: value } : item)))
                }
              />
              <LabelledInput
                label="行事名"
                placeholder="三地区稽古会"
                value={event.title}
                onChange={(value) =>
                  setEvents((prev) => prev.map((item, i) => (i === index ? { ...item, title: value } : item)))
                }
              />
              <LabelledInput
                label="場所"
                placeholder="瀬戸武道館"
                value={event.place}
                onChange={(value) =>
                  setEvents((prev) => prev.map((item, i) => (i === index ? { ...item, place: value } : item)))
                }
              />
              <RowButtons
                canMoveUp={index > 0}
                canMoveDown={index < events.length - 1}
                onUp={() => setEvents((prev) => move(prev, index, index - 1))}
                onDown={() => setEvents((prev) => move(prev, index, index + 1))}
                onDelete={() => setEvents((prev) => prev.filter((_, i) => i !== index))}
              />
            </div>
          ))}

          {events.length === 0 ? (
            <p className="rounded-lg bg-muted px-4 py-6 text-center text-muted-foreground">
              予定がありません。下の「行を追加」を押してください。
            </p>
          ) : null}

          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={events.length >= MAX_EVENTS}
            onClick={() => setEvents((prev) => [...prev, { id: newId(), date: '', title: '', place: '' }])}
          >
            <Plus />
            行を追加
          </Button>
        </CardContent>
      </Card>

      {/* ---------------- 審査ボタン ---------------- */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">昇段・昇級審査のお知らせボタン</CardTitle>
          <CardDescription className="text-base">
            トップページの「昇段・昇級審査について」に並ぶボタンです。最大 {MAX_EXAM_BUTTONS} つまで置けます。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {buttons.map((button, index) => (
            <ExamButtonRow
              key={button.id}
              button={button}
              index={index}
              total={buttons.length}
              onChange={(next) => setButtons((prev) => prev.map((item, i) => (i === index ? next : item)))}
              onUp={() => setButtons((prev) => move(prev, index, index - 1))}
              onDown={() => setButtons((prev) => move(prev, index, index + 1))}
              onDelete={() => setButtons((prev) => prev.filter((_, i) => i !== index))}
            />
          ))}

          {buttons.length === 0 ? (
            <p className="rounded-lg bg-muted px-4 py-6 text-center text-muted-foreground">
              ボタンがありません。審査のお知らせが出たら下から追加してください。
            </p>
          ) : null}

          <Button
            type="button"
            variant="outline"
            size="lg"
            disabled={buttons.length >= MAX_EXAM_BUTTONS}
            onClick={() =>
              setButtons((prev) => [...prev, { id: newId(), label: '', pdfUrl: '', pdfName: '' }])
            }
          >
            <Plus />
            ボタンを追加
          </Button>
        </CardContent>
      </Card>

      {/* ---------------- 保存バー ---------------- */}
      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <p
            role="status"
            className={
              state.message
                ? state.ok
                  ? 'flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-500'
                  : 'text-sm font-medium text-destructive'
                : 'text-sm text-muted-foreground'
            }
          >
            {state.message ? (
              <>
                {state.ok ? <CheckCircle2 className="size-4" /> : null}
                {state.message}
              </>
            ) : dirty ? (
              'まだ公開されていない変更があります。'
            ) : (
              '変更はありません。'
            )}
          </p>

          <Button type="submit" size="lg" disabled={saving} className="h-12 min-w-40 text-base">
            {saving ? <Loader2 className="animate-spin" /> : <Save />}
            {saving ? '公開しています…' : '公開する'}
          </Button>
        </div>
      </div>
    </form>
  )
}

/* ------------------------------------------------------------------ */

function LabelledInput({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  placeholder: string
  onChange: (value: string) => void
}) {
  return (
    <div className="space-y-1">
      <span className="text-sm font-medium text-muted-foreground sm:hidden">{label}</span>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        className="h-11 text-base"
      />
    </div>
  )
}

function RowButtons({
  canMoveUp,
  canMoveDown,
  onUp,
  onDown,
  onDelete,
}: {
  canMoveUp: boolean
  canMoveDown: boolean
  onUp: () => void
  onDown: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center gap-1">
      <Button type="button" variant="ghost" size="icon" onClick={onUp} disabled={!canMoveUp} aria-label="上へ移動">
        <ArrowUp />
      </Button>
      <Button type="button" variant="ghost" size="icon" onClick={onDown} disabled={!canMoveDown} aria-label="下へ移動">
        <ArrowDown />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onDelete}
        aria-label="この行を削除"
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        <Trash2 />
      </Button>
    </div>
  )
}

function ExamButtonRow({
  button,
  index,
  total,
  onChange,
  onUp,
  onDown,
  onDelete,
}: {
  button: ExamButton
  index: number
  total: number
  onChange: (next: ExamButton) => void
  onUp: () => void
  onDown: () => void
  onDelete: () => void
}) {
  const [uploading, startUpload] = useTransition()
  const [uploadError, setUploadError] = useState('')

  function handleFile(file: File | undefined) {
    if (!file) return
    setUploadError('')
    const formData = new FormData()
    formData.append('file', file)

    startUpload(async () => {
      const result = await uploadPdfAction(formData)
      if (result.ok && result.url) {
        onChange({ ...button, pdfUrl: result.url, pdfName: result.name ?? file.name })
      } else {
        setUploadError(result.message)
      }
    })
  }

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div className="flex items-start justify-between gap-2">
        <Label htmlFor={`label-${button.id}`} className="pt-2 text-sm font-medium text-muted-foreground">
          ボタンに出る文章
        </Label>
        <RowButtons
          canMoveUp={index > 0}
          canMoveDown={index < total - 1}
          onUp={onUp}
          onDown={onDown}
          onDelete={onDelete}
        />
      </div>

      <Input
        id={`label-${button.id}`}
        value={button.label}
        placeholder="令和8年度 秋季初〜三段段位審査会のお知らせ"
        onChange={(event) => onChange({ ...button, label: event.target.value })}
        className="h-11 text-base"
      />

      <div className="space-y-2">
        <span className="text-sm font-medium text-muted-foreground">PDFファイル</span>

        <div className="flex flex-wrap items-center gap-3">
          {/* 見た目はボタン、実体は label。こうしておくと input が支援技術からも辿れる */}
          <Button
            asChild
            variant="outline"
            className={uploading ? 'pointer-events-none opacity-60' : 'cursor-pointer'}
          >
            <label htmlFor={`pdf-${button.id}`}>
              {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
              {button.pdfUrl ? 'PDFを差し替える' : 'PDFを選ぶ'}
            </label>
          </Button>

          {button.pdfUrl ? (
            <a
              href={button.pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              <FileText className="size-4" />
              {button.pdfName || '添付されているPDF'}
              <ExternalLink className="size-3.5" />
            </a>
          ) : (
            <span className="text-sm text-muted-foreground">まだ選ばれていません</span>
          )}
        </div>

        <input
          id={`pdf-${button.id}`}
          type="file"
          accept="application/pdf,.pdf"
          disabled={uploading}
          className="sr-only"
          onChange={(event) => {
            handleFile(event.target.files?.[0])
            event.target.value = ''
          }}
        />

        {uploadError ? (
          <p role="alert" className="text-sm text-destructive">
            {uploadError}
          </p>
        ) : null}
      </div>
    </div>
  )
}
