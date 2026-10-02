// Render react-icons (Font Awesome 5 set) to PNG in the palette colours used by the deck.
const path = require('path');
const NM = path.join(__dirname, 'node_modules'); // needs: npm i react react-dom react-icons sharp
const React = require(path.join(NM, 'react'));
const RDS = require(path.join(NM, 'react-dom', 'server'));
const sharp = require(path.join(NM, 'sharp'));
const fa = require(path.join(NM, 'react-icons', 'fa'));
const names = ['FaPlaneDeparture','FaDatabase','FaFingerprint','FaShieldAlt','FaBalanceScale','FaChartLine',
  'FaClock','FaCheckCircle','FaLayerGroup','FaCogs','FaLandmark','FaUsers','FaRoute','FaRupeeSign','FaLeaf',
  'FaMicrochip','FaGlobeAsia','FaFileContract','FaSearch','FaCloud','FaCodeBranch','FaBan','FaLock',
  'FaExchangeAlt','FaCalendarAlt','FaBullseye','FaHandshake','FaBroom','FaBook','FaUniversity','FaPlane',
  'FaClipboardCheck','FaSitemap','FaTags','FaRegCircle','FaAdjust','FaCircle','FaTachometerAlt','FaLightbulb'];
const colors = { w:'FFFFFF', n:'0B2545', b:'0070C0', g:'138A3E', a:'C77700', o:'E8731A', m:'5A6878' };
(async () => {
  let n = 0;
  for (const nm of names) {
    const C = fa[nm]; if (!C) { console.log('missing', nm); continue; }
    for (const [k, hex] of Object.entries(colors)) {
      const svg = RDS.renderToStaticMarkup(React.createElement(C, { color: '#' + hex, size: 256 }));
      await sharp(Buffer.from(svg)).resize(256, 256, { fit: 'contain', background: { r:0,g:0,b:0,alpha:0 } })
        .png().toFile(path.join(__dirname, 'icons', `${nm}_${k}.png`));
      n++;
    }
  }
  console.log('icons written:', n);
})();
