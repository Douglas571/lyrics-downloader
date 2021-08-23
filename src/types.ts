const PENDING = 'pending',
	  DONWLOADING = 'downloading',
	  READY = 'ready'

export const STATES = {
	PENDING,
	DONWLOADING,
	READY
}

export type TranslateLyric = {
	title: string,
	art?: Array<string>

	sp?: Array<string>,
	en?: Array<string>,
	
	url: string,
	html?: string,
	text?: string,

	state: string
}

export type AlbumData = {
	lyrics: Array<TranslateLyric>
}