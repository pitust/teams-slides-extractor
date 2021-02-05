# teams-slides-extractor
In teams, there is a switch for only the presenter to be able to step through the presentation. This software gets around that by manually getting every slide and rendering it to a nice HTML file.

## Usage
1. Go to the network tab in devtools
2. Wait for it to contain a request to GetPresentation
3. Export the HAR
4. Copy it into a checkout of this repo
5. `npm i;ts-node -T index.ts`
6. Go to localhost:8000, and see all the slides. Navigate with arrow keys. See all the slides (ok, this part needs some work to look better.)
