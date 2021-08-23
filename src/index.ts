#!/usr/bin/env node
require('source-map-support').install()

import { Command } from 'commander'
import Got from 'got'
import fs from 'fs-extra'
import { JSDOM } from 'jsdom'
import { jsPDF } from 'jspdf'
import path from 'path'

import sanitize from 'sanitize-filename'

import { AlbumData, TranslateLyric, TranslateLines, LyricWithHTML, STATES } from './types'
import { downloadAllLyrics } from './request-assistant'

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
			await downloadAlbumLyrics(URL, OUT_DIR)

			//await downloadTranslateLyric(URL, OUT_DIR, html)

		} catch(err) {
			console.log(err)
		}
	}
}

async function downloadAlbumLyrics( url: string, outDir: string ) {
	//const res = await Got(url)
	//const html: string = res.body

	const filePath = path.join(outDir, 'album.json')	
	const filePath2 = path.join(outDir, 'album2.json')	
	//await fs.outputFile(filePath, html)

	try {
		const res = await Got(url)
		const html: string = res.body

		const virtualDom: DocumentFragment = JSDOM.fragment(html)

		let albumData: AlbumData = getAlbumData(virtualDom)

		albumData.lyrics.map( l => {
			l.url += '/traduccion/espanol'
			return l
		})

		albumData.lyricsWithHTML = await downloadAllLyrics(albumData, 4)

		albumData.lyricsWithHTML.forEach(async(l, idx) => {
			let filename = sanitize(l.title + "-" + idx + ".html")
			
			let folder = albumData.title || String(Date.now())
			folder = folder.slice(0, 30).trim()
			folder = sanitize(folder)

			await fs.outputFile(path.join(outDir, folder , filename), l.html)
		})

		albumData.fullLyrics = albumData.lyricsWithHTML.map( l => extractTranslateLyric(JSON.parse(JSON.stringify(l))))

		console.log(albumData.lyrics)

		albumData.fullLyrics.forEach( async (l, idx) => {
			let filename = sanitize(l.title + "-" + idx + ".txt")
			
			let folder = albumData.title || String(Date.now())
			folder = folder.slice(0, 30).trim()
			folder = sanitize(folder)

			await fs.outputFile(path.join(outDir, folder, filename), l.text)
		})

		await fs.outputFile(filePath2, JSON.stringify(albumData))

	} catch(err) {
		console.log(err)
	}
}

function getAlbumData(virtualDom: DocumentFragment) {
	let albumData: AlbumData = { lyrics: []}

	albumData.title = virtualDom.querySelector('div.mxm-album-banner__title h1')!.textContent || "sin-nombre"

	let tracks = virtualDom.querySelectorAll('li[id*="track_"]')
  tracks.forEach( track => {
    let lyric

    if( track ) {
    	lyric = { title: '', url: '' }

    	//lyric.state = 1
    	//lyric.track = Number(track.querySelector('div.mui-cell__index-view')!.textContent)
    	lyric.url = 'https://www.musixmatch.com' + track.querySelector('a')!.getAttribute('href')
    	lyric.title = track.querySelector('h2.mui-cell__title')!.textContent || ''

    	albumData.lyrics.push({ title: lyric.title, url: lyric.url, state: STATES.PENDING})
    }

    //albumData.lyricsToDownload.push(lyric)
  })

  return albumData
}

function extractTranslateLyric(lyricWithHTML: LyricWithHTML): TranslateLyric{
	let lyric = JSON.parse(JSON.stringify(lyricWithHTML))

	const virtualDom = createVirtualDom(lyric.html)

	let translateLines = getTranslateLines(virtualDom)

	lyric.en = translateLines.en
	lyric.sp = translateLines.sp  	

  lyric.art = getLyricArtists(virtualDom) 
  lyric.title = getTitle(virtualDom)
	
	lyric.text = getTextFormated(lyric)
	
	console.log('Success!!')

	return lyric
}

function createVirtualDom( html: string ): DocumentFragment {
	const frag = JSDOM.fragment(html)
	console.log(frag)

	return frag
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

	translateLines.en = translateLines.en.map( line => line + '\r\n')
  translateLines.sp = translateLines.sp.map( line => line + '\r\n')

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
	lyricText += lyric.title + '\r\n'
	lyricText += lyric.art.join(', ') + '\r\n\n\n'

  	lyric.en.map( (line, idx) => {
  		line = line.trim()

  		lyricText += line

  		if(lyric.sp[idx].trim() !== '') {
  			lyricText += '\r\n -' + lyric.sp[idx] + '\r\n'
  		} else {
  			lyricText += lyric.sp[idx]
  		}
  	}) 

  	return lyricText
}