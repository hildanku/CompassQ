import { requireUser } from '@/lib/auth'

import { HistoryLibrary } from './history-library'

export default async function HistoryPage() {
    await requireUser()

    return <HistoryLibrary />
}
