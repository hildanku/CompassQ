'use client'

import { Sparkles } from 'lucide-react'

type ResonanceRatingProps = {
    value: number | null
    onChange: (score: number | null) => void
    disabled?: boolean
}

export function ResonanceRating({
    value,
    onChange,
    disabled = false,
}: ResonanceRatingProps) {
    return (
        <div className="space-y-3">
            <div className="space-y-1">
                <p className="text-sm font-medium text-zinc-900">
                    How deeply did this verse resonate?
                </p>
                <p className="text-sm text-zinc-500">
                    Rate from 1 (a little) to 5 (deeply moved). This helps
                    CompassQ learn what resonates with you.
                </p>
            </div>

            <div
                className="flex items-center gap-2"
                role="radiogroup"
                aria-label="Resonance score from 1 to 5"
            >
                {[1, 2, 3, 4, 5].map((score) => {
                    const isSelected = value != null && score <= value

                    return (
                        <button
                            key={score}
                            type="button"
                            role="radio"
                            aria-checked={value === score}
                            aria-label={`${score} out of 5`}
                            disabled={disabled}
                            onClick={() => {
                                onChange(value === score ? null : score)
                            }}
                            className={`flex h-10 w-10 items-center justify-center rounded-full border transition sm:h-11 sm:w-11 ${
                                isSelected
                                    ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                                    : 'border-zinc-200 bg-white text-zinc-300 hover:border-emerald-300 hover:text-emerald-400'
                            } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                        >
                            <Sparkles
                                className={`h-5 w-5 ${isSelected ? 'fill-emerald-200' : ''}`}
                            />
                        </button>
                    )
                })}

                {value != null ? (
                    <span className="ml-2 text-sm font-medium text-emerald-700">
                        {value}/5
                    </span>
                ) : null}
            </div>
        </div>
    )
}
