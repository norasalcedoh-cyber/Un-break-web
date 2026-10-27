const fs = require('node:fs');
const path = require('node:path');
const file = path.join(__dirname, '../index.html');
const svg = `<svg class="logo-organic" viewBox="0 0 1000 530" xmlns="http://www.w3.org/2000/svg" focusable="false">
            <defs>
              <g id="live-letters" class="live-letters">
                <text x="0" y="220">UN-</text>
                <text class="live-break" x="0" y="440">BREAK</text>
              </g>
              <mask id="live-positive" maskUnits="userSpaceOnUse" x="-30" y="-30" width="1060" height="590" style="mask-type:luminance">
                <rect x="-30" y="-30" width="1060" height="590" fill="white"/>
                <rect class="live-band-cut" x="0" y="260" width="1000" height="0" fill="black"/>
              </mask>
              <mask id="live-negative" maskUnits="userSpaceOnUse" x="-30" y="-30" width="1060" height="590" style="mask-type:luminance">
                <rect x="-30" y="-30" width="1060" height="590" fill="black"/>
                <rect class="live-band-cut" x="0" y="260" width="1000" height="0" fill="white"/>
                <use href="#live-letters" fill="black"/>
              </mask>
              <g id="live-ink">
                <use href="#live-letters" fill="currentColor" mask="url(#live-positive)"/>
                <rect width="1000" height="530" fill="currentColor" mask="url(#live-negative)"/>
              </g>
              <mask id="live-erasure" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="530" style="mask-type:luminance">
                <rect width="1000" height="530" fill="white"/>
                <rect class="live-erase" x="285" y="0" width="715" height="0" fill="black"/>
                <rect class="live-erase" x="475" y="440" width="150" height="0" fill="black"/>
              </mask>
            </defs>
            <g class="live-fragments" mask="url(#live-erasure)"></g>
          </svg>`;
const html = fs.readFileSync(file, 'utf8');
fs.writeFileSync(file, html.replace(/<svg class="logo-organic"[\s\S]*?<\/svg>/, svg));
