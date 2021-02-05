import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import fetch from 'node-fetch'

function l(s: string, ...args: string[]) {
    console.log('\x1b[31;1m[*]\x1b[32;1m ' + s.replace(/{}/g, () => '\x1b[34;1m' + args.shift() + '\x1b[32;1m'))
}
l('Reading out HAR...')
let p = JSON.parse(readFileSync('teams.microsoft.com.har').toString())
l('We have {} entries', p.log.entries.length)
let pr = p.log.entries.filter(e => e.request.url.includes('GetPresentation'))
l('Got {} ppts', pr.length)
let data = pr.map(e => JSON.parse(e.response.content.text))
let pp0 = data[0]
let slides = pp0.Result.sldLst.map(e => e.sldInfo)
l('Got {} slides', slides.length)
let haxrq = p.log.entries.find(e => e.request.url.includes('GetSlide')).request
let slh = haxrq.headers.filter(e => e.name[0] != ':').map(e => [e.name, e.value])
let ep = haxrq.url
let pdata = JSON.parse(haxrq.postData.text)
l('Got {} headers, we are ready to fake requests...', slh.length)
async function harCachedFetch(slide: string) {
    pdata.slideInfoId = slide
    let tgrq = p.log.entries.find(e => e.request.url.includes('GetSlide') && e.request.postData.text.includes(slide))
    if (!tgrq) {
        l('HCF: {} [MISS]', slide)
        let a = await fetch(ep, {
            headers: slh,
            method: 'POST',
            body: JSON.stringify(pdata),
        })
        let res = await a.json()
        if (!res.Error) {
            p.log.entries.push({
                request: {
                    url: 'http://example.com/fake/GetSlide',
                    postData: { text: JSON.stringify(pdata) },
                },
                response: {
                    content: {
                        text: JSON.stringify(res),
                    },
                },
            })
            writeFileSync('teams.microsoft.com.har', JSON.stringify(p, null, '\t'))
        }
        return res
    } else {
        l('HCF: {} [HIT]', slide)
        return JSON.parse(tgrq.response.content.text)
    }
}
;(async () => {
    let i = 1
    for (let r of slides) {
        l('Getting slide {}', i.toString())
        let res = await harCachedFetch(r)
        if (res.Error) {
            l('Error: {}', res.Error.Message)
            i++
            continue
        }
        writeFileSync(
            `hax/${i}.html`,
            `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Document</title>
</head>
<body>
${res.Result.sld[0].outline}
</body>
</html>`
        )
        l('Owned slide {}!', i.toString())
        i++
    }
    l('Genrating {}', 'index.html')
    let idex = []
    for (let j = 1; j < 1 + slides.length; j++) {
        idex.push(`${j}.html`)
    }
    writeFileSync(
        'hax/index.html',
        `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Document</title>
</head>
<body style="margin: 0">
<table>
<tr>
<td><button onclick="n()">Next</button>
<button onclick="p()">Prev</button></td>
</tr>
<tr>
<iframe id="x" style="border: 0; width: 100vw; height: 600px"></iframe>
</tr>
<script>
let table = ${JSON.stringify(idex)}
let i = 0;
function o() {
document.getElementById('x').src = table[i]
}
function n() { i++; o() }
function p() { i--; o() }
document.body.onkeydown = ({ key }) => {
if (key == 'ArrowLeft') p()
if (key == 'ArrowRight') n()
}
</script>
</body>
</html>`
    )
    l('running python -m http.server')
    execSync('python -m http.server', { stdio: 'inherit', cwd: 'hax' })
})()
