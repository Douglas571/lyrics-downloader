#!/usr/bin/env node

import { Command } from 'commander'
import Got from 'got'
import fs from 'fs-extra'
import { JSDOM } from 'jsdom'
import { jsPDF } from 'jspdf'
import path from 'path'

//import reqAssist from './request-assistant'

//import LyricFinder from './core/LyricFinder.js'

(async () => { main() })()

async function main() {
	console.log('Init cli...')
	const CLI = new Command()
//	const LF = new LyricFinder()
	const { argv } = process

	//TODO: change for "os.homedir" and else
	const APPDATA = process.env.APPDATA || ''
	const HOMEPATH = process.env.HOMEPATH || ''


	const OUT_DIR = path.join(HOMEPATH, 'LF')

	CLI.option('-a, --download-albums-lyrics <url>', 'print a gretting')
	CLI.parse(argv)

	const opts = CLI.opts()

	console.log(opts)

	if(opts.downloadAlbumsLyrics) {
		console.log('downloading lyric..')
		let URL: string = opts.downloadAlbumsLyrics

		//const res = await Got(URL)
		//const html: string = res.body

		const filePath: string = path.join(OUT_DIR, 'lyric.html')
		const filePathTxt: string = path.join(OUT_DIR, 'lyric.txt')
		const filePathPdf: string = path.join(OUT_DIR, 'lyric.pdf')

		try {

			//const html = await fs.readFile(filePath, 'utf8')
			await downloadAlbumsLyrics(URL, OUT_DIR)

			//await downloadTranslateLyric(URL, OUT_DIR, html)

		} catch(err) {
			console.log(err)
		}
	}
}

type LyricToDownload = {
		title: string,
		url: string
	}

type AlbumData = {
	lyrics: Array<LyricToDownload>
}

async function downloadAlbumsLyrics( url: string, outDir: string ) {
	//const res = await Got(url)
	//const html: string = res.body

	const filePath = path.join(outDir, 'album.html')	

	//await fs.outputFile(filePath, html)

	const html: string = await fs.readFile(filePath, 'utf8')
	const virtualDom: DocumentFragment = JSDOM.fragment(html)


	const albumData: AlbumData = getAlbumData(virtualDom)

	console.log(albumData.lyrics)
}

function getAlbumData(virtualDom: DocumentFragment) {
	let albumData: AlbumData = { lyrics: []}

	let tracks = virtualDom.querySelectorAll('li[id*="track_"]')
  tracks.forEach( track => {
    let lyric

    if( track ) {
    	lyric = { title: '', url: '' }

    	//lyric.state = 1
    	//lyric.track = Number(track.querySelector('div.mui-cell__index-view')!.textContent)
    	lyric.url = 'https://www.musixmatch.com' + track.querySelector('a')!.getAttribute('href')
    	lyric.title = track.querySelector('h2.mui-cell__title')!.textContent || ''

    	albumData.lyrics.push({ title: lyric.title, url: lyric.url })
    }

    //albumData.lyricsToDownload.push(lyric)
  })

  return albumData
}

async function downloadTranslateLyric( url:string, outDir: string, html: string ): Promise<TranslateLyric>{
	const lyric: TranslateLyric = {
		title: '',
		art: [],
		sp: [],
		en: []
	}

	const virtualDom = createVirtualDom(html)

	let translateLines: { 
		en: Array<string>, 
		sp: Array<string> 
	} = getTranslateLines(virtualDom)

	lyric.en = translateLines.en
	lyric.sp = translateLines.sp  	

  lyric.art = getLyricArtists(virtualDom) 
   lyric.title = getTitle(virtualDom)
	
	lyric.text = getTextFormated(lyric)
	
	let pdfDoc = new jsPDF()
	pdfDoc.text(lyric.text, 10, 10)

	let filePath: string = path.join(outDir, `${lyric.title} (${lyric.art.join('-')}).pdf`) 

	pdfDoc.save(filePath)

	//await fs.outputFile(filePath, lyric.text)
	console.log('Success!!')

	return lyric
}

type TranslateLyric = {
	title: string,
	art: Array<string>

	sp: Array<string>,
	en: Array<string>,
	text?: string
}

function createVirtualDom( html: string ): DocumentFragment {
	const frag = JSDOM.fragment(html)
	console.log(frag)

	return frag
}

type TranslateLines = { 
	en: Array<string>, 
	sp: Array<string> 
}

function getTranslateLines(virtualDom: DocumentFragment): TranslateLines {

	const lineNodes = virtualDom.querySelectorAll('div.mxm-translatable-line-readonly')
	const lines = Array.from(lineNodes)
	const translateLines: TranslateLines = { en: [], sp: [] }

	lines.forEach( line => {
	    const node = line.querySelectorAll('div.col-xs-6')
	    translateLines
	      .en
	      .push(node[0].textContent || '')
	    
	    translateLines
	      .sp
	      .push(node[1].textContent || '')
	  })

	translateLines.en = translateLines.en.map( line => line + '\n')
  	translateLines.sp = translateLines.sp.map( line => line + '\n')

  	return translateLines
}

function getLyricArtists(virtualDom: DocumentFragment) {
	let artist = virtualDom.querySelectorAll('a.mxm-track-title__artist-link')
	let arrayArtis: Array<string> = []

    artist.forEach( link => {
      arrayArtis.push(link.textContent || '')
    }) 

    return arrayArtis
}

function getTitle(virtualDom: DocumentFragment) {
	let title = virtualDom.querySelector('h1.mxm-track-title__track')!.textContent || 'no title'
    title = title.replace('Letra', '')  
    title = title.replace(' y traducción', '').trim()

    if(title.indexOf(' (fe') > -1) title = title.slice(0, title.indexOf(' (fe'))

    return title
}

function getTextFormated(lyric: TranslateLyric): string {
	let lyricText: string = ''
	lyricText += lyric.title + '\n'
	lyricText += lyric.art.join(', ') + '\n\n'

  	lyric.en.map( (line, idx) => {
  		line = line.trim()

  		lyricText += line

  		if(lyric.sp[idx].trim() !== '') {
  			lyricText += '\n -' + lyric.sp[idx] + '\n'
  		} else {
  			lyricText += lyric.sp[idx]
  		}
  	}) 

  	return lyricText
}