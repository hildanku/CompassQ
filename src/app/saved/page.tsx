import { requireUser } from '@/lib/auth'

import { SavedLibrary } from './saved-library'

export default async function SavedPage() {
    await requireUser()

    return <SavedLibrary />
}
