const PENDING = 'pending',
	  DONWLOADING = 'downloading',
	  READY = 'ready',
	  NOT_FOUND = '404'

export const STATES = {
	PENDING,
	DONWLOADING,
	READY
}

export type LyricToDownload = {
	title: string,
	url: string,
	state: string
}

export type LyricWithHTML = LyricToDownload & {
	html: string
}

export type TranslateLyric = LyricWithHTML & {
	art: Array<string>

	sp: Array<string>,
	en: Array<string>,

	text: string,
}

export type AlbumData = {
	title?: string,

	lyrics: Array<LyricToDownload | LyricWithHTML | TranslateLyric>,
	lyricsWithHTML?: Array<LyricWithHTML>,
	fullLyrics?: Array<TranslateLyric> 
}

export type TranslateLines = { 
	en: Array<string>, 
	sp: Array<string> 
}