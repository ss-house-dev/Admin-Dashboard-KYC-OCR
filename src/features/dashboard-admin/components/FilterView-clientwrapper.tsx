"use client"
import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { FilterView } from "./FilterView"

const toYmd = (d?: Date) =>
  d ? new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0,10) : ""

export function FilterViewClient({ defaultValues }: { defaultValues?: { status?: string; startDate?: string; endDate?: string } }) {
  const router = useRouter()
  const sp = useSearchParams()

  const [status, setStatus] = React.useState(defaultValues?.status ?? "all")
  const [start, setStart]   = React.useState<Date | undefined>(defaultValues?.startDate ? new Date(defaultValues.startDate) : undefined)
  const [end, setEnd]       = React.useState<Date | undefined>(defaultValues?.endDate ? new Date(defaultValues.endDate) : undefined)

  const onApply = () => {
    const params = new URLSearchParams(sp.toString())
    status && status !== "all" ? params.set("status", status) : params.delete("status")
    start ? params.set("start", toYmd(start)) : params.delete("start")
    end   ? params.set("end",   toYmd(end))   : params.delete("end")
    router.push(`?${params.toString()}`, { scroll: false })
  }

  const onClear = () => {
    setStatus("all"); setStart(undefined); setEnd(undefined)
    const params = new URLSearchParams(sp.toString())
    params.delete("status"); params.delete("start"); params.delete("end")
    router.push(`?${params.toString()}`, { scroll: false })
  }

  return (
    <FilterView
      status={status}
      start={start}
      end={end}
      onChangeStatus={setStatus}
      onChangeStart={setStart}
      onChangeEnd={setEnd}
      onApply={onApply}        
      onClear={onClear}
    />
  )
}
