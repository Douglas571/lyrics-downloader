import got from 'got'
import { TranslateLyric, LyricToDownload, LyricWithHTML, AlbumData, STATES } from './types'

export async function downloadAllLyrics(albumData: AlbumData, timeDiff = 2.5): Promise<LyricWithHTML[]> {
	let lyrics = JSON.parse(JSON.stringify(albumData.lyrics))

	while(thereLyricsPendin(lyrics)) {
		console.log('there lyrics to download!!')

		let pendingHTMLs = []

		let counter = 0
		for( let idx = 0; idx < lyrics.length; idx++ ) {
			let l = lyrics[idx]

			if( l.state === STATES.PENDING ) {
				let url = l.url
				let onXSec = timeDiff * counter

				pendingHTMLs.push(getLyricHtml(url, idx, onXSec))
				counter++
			}
		}

		const results = await Promise.allSettled(pendingHTMLs)

		for(let res of results) {
			if(res.status === 'fulfilled') {
				let { idx, html } = res.value 

				lyrics[idx].html = html
				lyrics[idx].state = STATES.READY
			}	
		}
	}

	return lyrics
}

function thereLyricsPendin(lyrics: Array<TranslateLyric>) {
	return !lyrics.every( l => l.state == STATES.READY)
}

type DownloadResult = { html: string, idx: number }
async function getLyricHtml(url: string, idx: number, onXSec: number): Promise<DownloadResult>{
	console.log(onXSec)

	return new Promise<DownloadResult>((res, rej) => {
		setTimeout( async () => {
			let req = got(url)

		    let idTimer = setTimeout(() => {
		      req.cancel()
		    }, 30 * 1000)

		    try {

		      console.log(`Searching ${url}`)
		      let response = await req;

		      const { body } = response;

		      console.log('downloaded:' + url)
		      console.log(body.slice(0, 25))

		      clearTimeout(idTimer)
		      res({ html: body.slice(0, 25), idx })

		    } catch(err) {

		      console.log(err.message)

		      if(req.isCanceled) {

		        console.log('the reques is canseled and will be resend:' + url)
		        rej(new Error('the reques is canseled and will be resend:' + url))
		      }
		    }


		}, onXSec * 1000)
	})
}

(async () => {
	let lyrics: LyricToDownload[] = [
		{
			title: '1975',
			url: 'https://www.lyrics.com/lyric/29577373/The+1975/The+1975',
			state: STATES.PENDING
		},
		{
			title: 'Some body else',
			url: 'https://www.lyrics.com/lyric/32632208/Somebody+Else',
			state: STATES.PENDING
		},
		{
			title: 'Love me',
			url: 'https://www.lyrics.com/lyric/33573512/Love+Me',
			state: STATES.PENDING
		},
		{
			title: 'Some body else',
			url: 'https://www.lyrics.com/lyric/32632208/Somebody+Else',
			state: STATES.PENDING
		},
		{
			title: 'Love me',
			url: 'https://www.lyrics.com/lyric/33573512/Love+Me',
			state: STATES.PENDING
		},
	]

	let album = { lyrics }
	album.lyrics = await downloadAllLyrics(album)


	console.log('READY')
	console.log(album)
})();