import { format } from "date-fns"
import { useState } from "react"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Button } from "../ui/button"
import { CalendarIcon } from "lucide-react"
import { Calendar } from "../ui/calendar"
import { ptBR } from "date-fns/locale"

function formatDate(date: Date | undefined) {
  if (!date) {
    return ''
  }

  return format(date, 'dd/MM/yyyy')
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false
  }

  return !isNaN(date.getTime())
}

interface DatePickerProps {
  label: string;
  date: Date | undefined;
  onChange: (date: Date | undefined) => void;
}

export const DatePicker = ({ label, date, onChange }: DatePickerProps) => {
  const [open, setOpen] = useState(false)
  // const [date, setDate] = useState<Date | undefined>(new Date())
  const [month, setMonth] = useState<Date | undefined>(date)
  const [value, setValue] = useState(formatDate(date))

  return (
    <div className='w-full max-w-xs space-y-2'>
      <Label htmlFor='date' className='px-1'>
        {label}
      </Label>
      <div className='relative flex gap-2'>
        <Input
          id='date'
          value={value}
          placeholder='01/01/2025'
          className='bg-background pr-10'
          onChange={e => {
            const date = new Date(e.target.value)

            setValue(e.target.value)

            if (isValidDate(date)) {
              onChange(date)
              setMonth(date)
            }
          }}
          onKeyDown={e => {
            if (e.key === 'ArrowDown') {
              e.preventDefault()
              setOpen(true)
            }
          }}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button id='date-picker' variant='ghost' className='absolute top-1/2 right-2 -translate-y-1/2 px-2 py-1'>
              <CalendarIcon className='w-4 h-4' />
              <span className='sr-only'>Pick a date</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-auto overflow-hidden p-0' align='end' alignOffset={-8} sideOffset={10}>
            <Calendar
              mode='single'
              selected={date}
              month={month}
              onMonthChange={setMonth}
              locale={ptBR}
              onSelect={date => {
                onChange(date)
                setValue(formatDate(date))
                setOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}