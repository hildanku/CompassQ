import { requireUser } from '@/lib/auth'
import { HistoryLibrary } from '@/lib/ui/history/history-library'

export default async function HistoryPage() {
    await requireUser()

    return <HistoryLibrary />
}
