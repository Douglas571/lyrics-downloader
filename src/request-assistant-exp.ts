let PENDIN = 0
let DOWNLOADING = 1
let READY = 2

type Lyric = {
	title: String,
	url: string,

	html?: string,
	state: number
	
}

type downloadResult = {
	html: string,
	idx: number
}

async function downloadAllLyricsPages(lyrics: Array<Lyric>, offset: number): Promise<Lyric[]> {
	let newLyrics = JSON.parse(JSON.stringify(lyrics))

	while(thereLyricsPendin(newLyrics)) {
		//console.log('there lyrics pending')
		let pendingHTMLs = []

		for(let idx = 0; idx < newLyrics.length; idx++) {
			let l = newLyrics[idx]
			let onXSec = idx + offset

			if(l.state === PENDIN || l.state === DOWNLOADING){
				l.state = DOWNLOADING
				pendingHTMLs.push(getHTML2(newLyrics[idx].url, idx, onXSec))
			}
		}

		const results = await Promise.allSettled(pendingHTMLs)
		console.log(results)


		for(let res of results) {
			if(res.status === 'fulfilled') {
				console.log(res)
				let { idx, html } = res.value 

				newLyrics[idx].html = html
				newLyrics[idx].state = READY
			}
			
		}

		console.log(newLyrics)

	}

	return newLyrics
	
}

function thereLyricsPendin(lyrics: Array<Lyric>) {
	return !lyrics.every( l => l.state == READY)
}

async function getHTML(url: string, onXSec: number): Promise<string>{
	console.log(onXSec)

	return new Promise<string>((res, rej) => {
		setTimeout(() => {
			if(canReturn()) {
				res("succes got " + url)

			} else {
				rej(new Error("can't!!"))

			}
		}, onXSec * 1000)
	})
}

async function getHTML2(url: string, idx: number, onXSec: number): Promise<downloadResult> {
	console.log(onXSec)

	return new Promise<downloadResult>((res, rej) => {
		setTimeout(() => {
			if(canReturn()) {
				console.log("succes got " + url, idx)
				res({ html: "succes got " + url, idx})

			} else {
				rej(new Error("can't!!:" + idx))

			}
		}, onXSec * 1000)
	})
}

// Retorna un número aleatorio entre min (incluido) y max (excluido)
function canReturn(): boolean {
	let random = getRandom(0, 10)
	return random >= 5
}

function getRandom(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

(async () => {

	let lyrics = 
	[
		{
			title: '1',
			url: '1111',
			state: PENDIN
		},
		{
			title: '2',
			url: '2222',
			state: PENDIN
		},
		{
			title: '3',
			url: '3333',
			state: PENDIN
		},
		{
			title: '4',
			url: '4444',
			state: PENDIN
		},
		{
			title: '5',
			url: '5555',
			state: PENDIN
		},
		{
			title: '6',
			url: '6666',
			state: PENDIN
		}
	]

	let newLyrics = await downloadAllLyricsPages(lyrics, 2)
	console.log(newLyrics)

})();



/*

PROBLEM
	realizar 20 request con X segundos de diferencia de forma asincrona

INPUT
	lista de urls

PROCESS

	mientras haya peticiones en peticiones
		mandar una petición
			{
				si la petición falla
					mandarla a la lista de peticiones
				si_no
					mandar el resultado a la lista de espera

			}
		esperar 2 segundos

OUTPUT
	html



conseguir la lista de url

descargar una de forma asincrona
esperar 2 segundos
mandar otra petición

*/