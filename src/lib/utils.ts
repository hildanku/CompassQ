const safeRedirectOrigin = 'http://local.test'

export function getSafeRedirect(next: string | null | undefined) {
    if (!next) {
        return '/'
    }

    if (!next.startsWith('/') || next.startsWith('//') || next.includes('\\')) {
        return '/'
    }

    try {
        const url = new URL(next, safeRedirectOrigin)

        if (url.origin !== safeRedirectOrigin) {
            return '/'
        }

        return `${url.pathname}${url.search}${url.hash}`
    } catch {
        return '/'
    }
}

const utcTimestampFormatter = new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
})

const shortUtcDateFormatter = new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
})

const shortUtcDateWithYearFormatter = new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
})

function getDatePartsInTimeZone(timezone: string) {
    const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    })

    const parts = formatter.formatToParts(new Date())

    return {
        year: Number(parts.find((part) => part.type === 'year')?.value ?? '0'),
        month: Number(
            parts.find((part) => part.type === 'month')?.value ?? '1',
        ),
        day: Number(parts.find((part) => part.type === 'day')?.value ?? '1'),
    }
}

export function addDaysToIsoDate(dateText: string, days: number) {
    const date = new Date(`${dateText}T00:00:00Z`)
    date.setUTCDate(date.getUTCDate() + days)

    return date.toISOString().slice(0, 10)
}

export function formatUtcTimestamp(value: string) {
    return `${utcTimestampFormatter.format(new Date(value))} UTC`
}

export function formatUtcDateRange(start: string, end: string) {
    return `${shortUtcDateFormatter.format(new Date(`${start}T00:00:00Z`))} - ${shortUtcDateWithYearFormatter.format(new Date(`${end}T00:00:00Z`))}`
}

export function getCurrentWeekStartInTimeZone(timezone: string) {
    const { year, month, day } = getDatePartsInTimeZone(timezone)
    const localDate = new Date(Date.UTC(year, month - 1, day))
    const weekday = localDate.getUTCDay()
    const mondayOffset = (weekday + 6) % 7

    localDate.setUTCDate(localDate.getUTCDate() - mondayOffset)

    return localDate.toISOString().slice(0, 10)
}

export function getLocalDateInTimeZone(timezone: string) {
    const { year, month, day } = getDatePartsInTimeZone(timezone)

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
