import { requireUser } from '@/lib/auth'
import { SavedLibrary } from '@/lib/ui/saved/saved-library'

export default async function SavedPage() {
    await requireUser()

    return <SavedLibrary />
}
