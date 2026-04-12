import { checkInCategoryValues } from '@/lib/contracts'

export const checkInCategoryLabels: Record<
    (typeof checkInCategoryValues)[number],
    string
> = {
    anxiety: 'Anxiety',
    gratitude: 'Gratitude',
    patience: 'Patience',
    guidance: 'Guidance',
    hope: 'Hope',
    discipline: 'Discipline',
    feeling_distant: 'Feeling Distant',
    need_comfort: 'Need Comfort',
}
