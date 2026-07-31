"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/component/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/component/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/component/ui/popover"

export interface ComboboxOption {
  value: string
  label: string
}

/**
 * Combobox — trigger + daftar pencarian shadcn (Popover + Command), dengan
 * `<input type="hidden">` yang disinkronkan supaya tetap ikut submit di form
 * `<form method="get">` biasa (lihat SaringanLowongan: filter harus tetap
 * bisa dibookmark lewat URL tanpa JavaScript khusus untuk submit-nya).
 */
export function Combobox({
  name,
  options,
  defaultValue = "",
  placeholder = "Pilih…",
  searchPlaceholder = "Cari…",
  emptyText = "Tidak ditemukan.",
  className,
  id,
}: Readonly<{
  name: string
  options: ComboboxOption[]
  defaultValue?: string
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  id?: string
}>) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState(defaultValue)

  const terpilih = options.find((o) => o.value === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <input type="hidden" name={name} value={value} />
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-12 w-full justify-between border-tanah-300 font-normal",
            !terpilih && "text-tanah-500",
            className
          )}
        >
          <span className="truncate">{terpilih ? terpilih.label : placeholder}</span>
          <ChevronsUpDown className="size-4 shrink-0 text-tanah-500" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value || "__semua__"}
                  value={option.label}
                  onSelect={() => {
                    setValue(option.value)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "size-4 shrink-0",
                      option.value === value ? "opacity-100" : "opacity-0"
                    )}
                    aria-hidden
                  />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
