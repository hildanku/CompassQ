const surahNames = [
    'Al-Fatihah',
    'Al-Baqarah',
    'Ali Imran',
    'An-Nisa',
    "Al-Ma'idah",
    "Al-An'am",
    "Al-A'raf",
    'Al-Anfal',
    'At-Tawbah',
    'Yunus',
    'Hud',
    'Yusuf',
    "Ar-Ra'd",
    'Ibrahim',
    'Al-Hijr',
    'An-Nahl',
    'Al-Isra',
    'Al-Kahf',
    'Maryam',
    'Ta-Ha',
    'Al-Anbiya',
    'Al-Hajj',
    "Al-Mu'minun",
    'An-Nur',
    'Al-Furqan',
    "Ash-Shu'ara",
    'An-Naml',
    'Al-Qasas',
    'Al-Ankabut',
    'Ar-Rum',
    'Luqman',
    'As-Sajdah',
    'Al-Ahzab',
    'Saba',
    'Fatir',
    'Ya-Sin',
    'As-Saffat',
    'Sad',
    'Az-Zumar',
    'Ghafir',
    'Fussilat',
    'Ash-Shura',
    'Az-Zukhruf',
    'Ad-Dukhan',
    'Al-Jathiyah',
    'Al-Ahqaf',
    'Muhammad',
    'Al-Fath',
    'Al-Hujurat',
    'Qaf',
    'Adh-Dhariyat',
    'At-Tur',
    'An-Najm',
    'Al-Qamar',
    'Ar-Rahman',
    'Al-Waqiah',
    'Al-Hadid',
    'Al-Mujadilah',
    'Al-Hashr',
    'Al-Mumtahanah',
    'As-Saff',
    'Al-Jumuah',
    'Al-Munafiqun',
    'At-Taghabun',
    'At-Talaq',
    'At-Tahrim',
    'Al-Mulk',
    'Al-Qalam',
    'Al-Haqqah',
    'Al-Maarij',
    'Nuh',
    'Al-Jinn',
    'Al-Muzzammil',
    'Al-Muddaththir',
    'Al-Qiyamah',
    'Al-Insan',
    'Al-Mursalat',
    'An-Naba',
    'An-Naziat',
    'Abasa',
    'At-Takwir',
    'Al-Infitar',
    'Al-Mutaffifin',
    'Al-Inshiqaq',
    'Al-Buruj',
    'At-Tariq',
    "Al-A'la",
    'Al-Ghashiyah',
    'Al-Fajr',
    'Al-Balad',
    'Ash-Shams',
    'Al-Layl',
    'Ad-Duha',
    'Ash-Sharh',
    'At-Tin',
    'Al-Alaq',
    'Al-Qadr',
    'Al-Bayyinah',
    'Az-Zalzalah',
    'Al-Adiyat',
    'Al-Qariah',
    'At-Takathur',
    'Al-Asr',
    'Al-Humazah',
    'Al-Fil',
    'Quraysh',
    "Al-Ma'un",
    'Al-Kawthar',
    'Al-Kafirun',
    'An-Nasr',
    'Al-Masad',
    'Al-Ikhlas',
    'Al-Falaq',
    'An-Nas',
] as const

export function parseAyahKey(ayahKey: string) {
    const [surahNumberText, ayahNumberText] = ayahKey.split(':')
    const surahNumber = Number.parseInt(surahNumberText ?? '', 10)
    const ayahNumber = Number.parseInt(ayahNumberText ?? '', 10)

    if (!Number.isInteger(surahNumber) || !Number.isInteger(ayahNumber)) {
        return null
    }

    return {
        surahNumber,
        ayahNumber,
    }
}

export function getSurahName(surahNumber: number) {
    return surahNames[surahNumber - 1] ?? `Surah ${surahNumber}`
}

export function getAyahReference(ayahKey: string) {
    const parsedAyahKey = parseAyahKey(ayahKey)

    if (!parsedAyahKey) {
        return null
    }

    return {
        ...parsedAyahKey,
        surahName: getSurahName(parsedAyahKey.surahNumber),
    }
}
