// Andreas: his island, run like a Dungeon Master runs a map. Fog of war hides everything nobody has seen yet.
// A token runs the course and clears it; the visitor's pointer carries a light of its own, and a click casts a
// brighter one. What has been seen keeps its colour, a little dimmer than what's lit now; in time the fog rolls back.
import { context, program, fullscreen, noiseTexture, loop, reducedMotion, clamp } from "./gl.js?v=20261115";

const COURSE = {"track":[[-86.9,-303.1,57.8,0],[-93.1,-302.3,57.6,3],[-102.9,-300.5,57.6,5],[-115.1,-297.5,57.4,8],[-128.4,-293.4,57.4,10],[-141.7,-288.7,57.4,13],[-154.6,-283.6,57.2,15],[-166.7,-276.5,56.6,18],[-176.1,-267.5,56.2,21],[-183.5,-259.0,55.8,23],[-191.8,-254.5,55.4,26],[-200.8,-256.8,55.2,28],[-209.0,-264.1,55.0,31],[-216.3,-273.4,55.2,33],[-223.9,-283.6,55.8,36],[-230.2,-293.6,56.8,39],[-233.0,-304.0,57.2,41],[-234.0,-315.9,58.0,44],[-235.0,-328.8,58.2,46],[-236.8,-342.1,58.6,49],[-239.2,-355.4,58.8,51],[-241.5,-369.0,59.2,54],[-242.9,-381.3,59.6,57],[-242.3,-391.8,59.8,59],[-238.2,-400.3,60.2,62],[-230.1,-404.1,60.4,65],[-220.1,-403.9,60.6,67],[-208.4,-402.8,60.4,69],[-194.4,-402.3,60.2,72],[-180.9,-402.0,60.0,75],[-168.6,-401.4,60.0,77],[-156.2,-400.4,59.8,80],[-144.2,-399.2,60.0,82],[-132.5,-397.9,60.0,85],[-120.5,-396.8,60.0,87],[-107.4,-395.7,60.0,90],[-94.9,-394.6,60.0,93],[-83.7,-393.3,60.0,95],[-72.9,-392.0,60.0,98],[-62.0,-390.9,60.0,100],[-51.2,-390.4,60.2,103],[-40.3,-390.6,60.4,105],[-28.4,-391.0,60.8,108],[-16.6,-390.8,61.0,111],[-5.7,-389.6,61.2,113],[4.9,-387.5,61.4,116],[13.8,-383.6,61.4,118],[19.9,-376.4,61.0,121],[23.9,-365.9,60.6,123],[27.1,-352.6,59.8,126],[30.2,-339.5,58.8,129],[32.1,-328.0,58.2,131],[31.6,-317.5,57.4,134],[26.4,-308.8,56.8,136],[16.3,-303.2,56.4,139],[3.5,-301.0,56.2,141],[-10.3,-301.0,56.0,144],[-23.2,-300.7,56.0,147],[-34.7,-298.3,56.0,149],[-45.5,-293.9,56.0,152],[-54.6,-287.6,55.8,154],[-61.0,-279.2,55.6,157],[-63.3,-269.8,55.4,160],[-62.1,-260.4,55.4,162],[-59.5,-250.3,55.6,165],[-56.4,-238.8,55.6,167],[-52.8,-226.2,56.0,170],[-49.3,-213.5,56.4,172],[-46.1,-201.2,57.2,175],[-43.1,-189.9,57.8,177],[-39.8,-178.8,58.6,180],[-36.1,-167.9,59.2,183],[-31.9,-157.7,59.8,185],[-26.7,-148.0,60.2,188],[-20.4,-138.9,60.2,190],[-13.7,-129.9,60.4,193],[-7.2,-120.5,60.4,195],[-0.6,-110.1,60.6,198],[5.4,-99.4,60.6,201],[10.6,-89.2,60.6,203],[15.8,-78.8,60.6,206],[21.5,-68.8,60.6,208],[28.2,-59.7,60.8,211],[35.9,-51.9,61.0,213],[44.4,-44.3,61.4,216],[52.4,-36.5,62.0,219],[58.7,-28.8,62.6,221],[62.9,-20.3,63.4,224],[64.9,-11.2,64.6,227],[66.2,-2.3,65.2,229],[68.0,7.7,65.8,231],[69.7,19.4,66.4,234],[70.4,30.5,67.0,237],[70.4,40.6,67.2,239],[70.4,51.2,67.2,242],[71.0,62.2,67.2,244],[72.5,73.3,66.8,247],[74.8,84.5,66.6,249],[79.2,95.5,66.2,252],[86.3,104.2,65.6,255],[95.4,110.0,65.4,257],[105.5,114.1,65.2,260],[115.9,116.2,65.0,262],[126.6,117.5,65.2,265],[137.0,119.7,65.2,267],[146.8,123.0,65.2,270],[155.1,127.5,65.4,273],[159.8,133.9,65.6,276],[159.3,141.2,65.8,278],[154.3,148.0,65.8,280],[147.2,154.7,66.0,283],[141.6,162.4,66.2,286],[139.5,171.7,66.4,288],[139.8,182.2,66.8,291],[141.0,193.0,67.0,293],[142.8,203.5,67.4,296],[144.6,213.5,68.0,298],[146.3,223.1,68.6,301],[147.8,232.8,69.2,303],[148.8,243.1,69.8,306],[148.3,253.5,70.2,309],[145.5,262.7,70.6,312],[140.9,270.1,71.0,314],[133.5,276.5,71.2,316],[124.1,282.5,71.6,319],[114.2,287.9,71.6,321],[103.6,293.5,71.4,324],[93.2,299.0,71.2,327],[83.5,303.9,71.0,329],[73.9,308.2,70.6,332],[64.1,311.7,70.4,334],[53.8,314.3,70.0,337],[43.2,316.1,69.8,339],[31.9,317.5,69.6,342],[20.6,318.5,69.4,345],[10.1,319.7,69.2,347],[-0.2,321.7,68.8,350],[-10.5,324.5,68.6,352],[-21.0,327.5,68.4,355],[-30.9,330.7,68.2,357],[-40.0,334.5,68.0,360],[-47.8,339.4,68.0,363],[-54.2,345.3,68.0,365],[-59.5,352.3,68.0,368],[-64.5,360.6,67.6,371],[-71.4,368.7,67.0,375],[-80.3,372.4,66.8,378],[-87.1,369.6,66.8,381],[-88.1,362.8,67.0,384],[-83.7,355.8,67.2,387],[-76.2,348.4,67.4,390],[-66.7,340.0,67.6,393],[-56.7,332.2,67.8,396],[-47.7,326.1,68.2,399],[-39.1,321.5,68.4,401],[-30.0,317.5,68.6,404],[-20.1,313.9,69.0,406],[-9.8,310.7,69.4,409],[1.0,308.2,69.8,411],[13.0,306.4,70.0,414],[24.8,305.2,70.4,417],[34.9,304.0,70.4,419],[44.2,302.3,70.2,422],[53.5,300.1,70.2,424],[63.0,297.8,70.0,427],[72.1,295.4,70.0,429],[81.2,292.3,70.0,432],[90.2,288.5,70.0,435],[99.2,284.5,70.0,437],[108.5,280.1,70.0,440],[117.4,275.4,69.8,442],[125.9,269.8,69.4,445],[133.5,263.1,68.8,448],[138.6,255.9,68.0,451],[140.5,247.8,67.6,453],[139.9,238.6,67.0,455],[137.7,228.6,66.4,458],[135.1,218.8,66.2,460],[133.0,208.9,66.2,463],[131.6,199.3,66.2,465],[130.6,189.9,66.2,468],[129.6,180.2,66.2,470],[128.6,169.8,65.6,473],[127.4,159.2,65.0,476],[125.3,149.5,64.2,479],[121.7,141.1,63.6,481],[116.1,133.2,63.4,483],[108.7,125.9,62.8,486],[100.1,120.3,62.8,488],[90.2,116.7,62.8,491],[80.1,115.2,62.8,494],[70.3,116.3,62.6,496],[60.8,120.1,62.6,499],[53.3,126.6,62.6,501],[46.7,134.6,62.6,504],[39.4,142.3,62.6,506],[30.4,147.9,62.2,509],[20.2,150.2,61.6,512],[10.4,149.3,61.0,515],[1.6,147.1,60.6,517],[-7.6,144.1,60.4,519],[-17.6,140.3,60.0,522],[-26.8,135.0,59.8,524],[-33.8,126.7,59.8,527],[-36.8,116.7,59.8,530],[-34.7,107.3,60.2,532],[-29.1,98.7,60.6,535],[-22.0,90.8,60.8,537],[-15.1,83.5,61.2,540],[-9.0,75.9,61.4,542],[-3.3,67.3,61.6,545],[2.1,58.6,61.8,548],[6.9,49.9,61.8,550],[11.6,40.7,61.8,553],[15.6,31.1,61.6,555],[17.8,21.5,61.2,558],[17.3,12.1,60.8,560],[13.7,2.7,60.0,563],[7.9,-5.4,59.4,566],[0.4,-11.3,59.0,568],[-8.5,-15.9,58.8,571],[-17.4,-21.2,58.8,573],[-24.8,-28.7,59.0,576],[-29.2,-38.6,59.4,578],[-30.2,-49.9,59.8,581],[-28.2,-60.4,60.6,584],[-23.9,-69.5,61.2,586],[-17.6,-77.8,62.2,589],[-9.5,-83.0,62.6,591],[0.0,-83.4,63.0,594],[9.5,-79.0,63.2,596],[19.0,-71.3,63.6,599],[28.0,-63.6,63.8,602],[35.9,-57.0,63.8,604],[43.2,-50.5,63.8,607],[50.0,-43.7,64.0,609],[56.2,-36.4,64.4,612],[61.3,-28.0,64.4,614],[65.3,-18.1,64.4,617],[68.3,-7.9,64.4,620],[70.7,2.0,64.2,622],[72.8,11.8,64.2,625],[74.7,21.1,64.2,627],[76.0,30.0,64.2,630],[76.0,39.4,64.2,632],[75.0,49.8,64.2,635],[73.9,59.8,63.8,638],[73.6,68.3,63.4,641],[74.9,76.5,63.2,644],[78.9,85.3,63.2,647],[86.4,94.5,63.6,650],[96.1,102.5,64.2,653],[106.3,108.0,64.8,656],[115.8,111.5,65.2,658],[124.9,114.5,65.8,661],[134.3,117.6,66.2,663],[144.3,120.5,66.8,666],[153.8,123.6,67.8,669],[160.5,129.7,68.2,672],[161.7,139.2,68.4,676],[156.9,147.8,68.0,679],[149.8,154.1,67.4,682],[144.5,160.7,66.8,685],[142.4,169.0,66.0,688],[142.4,178.1,65.4,690],[143.2,186.9,65.0,692],[144.4,195.7,64.8,694],[145.5,205.4,64.4,697],[146.4,215.1,64.4,700],[147.4,224.2,64.6,703],[148.4,233.5,64.8,706],[148.8,243.8,65.0,709],[147.2,254.6,64.8,712],[143.2,263.4,64.6,715],[137.2,270.2,64.2,717],[129.8,276.0,63.8,720],[121.8,281.5,63.8,722],[113.1,287.2,63.4,725],[104.5,292.7,63.4,728],[96.2,297.4,63.2,730],[87.2,302.2,63.2,733],[78.0,306.7,62.8,736],[69.3,309.6,62.6,739],[60.9,311.6,62.4,741],[51.8,313.6,62.2,743],[42.2,315.6,62.0,746],[32.9,316.9,62.0,748],[23.1,317.8,62.2,751],[13.0,319.1,62.6,754],[3.7,320.9,63.0,757],[-5.0,323.0,63.2,759],[-13.8,325.3,63.6,762],[-22.3,327.4,64.0,764],[-30.7,329.7,64.2,766],[-39.2,333.6,64.4,769],[-47.0,338.8,64.6,772],[-53.8,344.8,65.0,774],[-59.1,352.0,65.4,777],[-62.5,359.9,65.6,779],[-66.0,367.4,65.8,782],[-72.7,372.6,66.6,786],[-82.0,373.5,67.2,789],[-88.8,369.5,67.8,793],[-89.2,362.3,68.0,798],[-83.5,355.3,68.2,801],[-75.9,349.0,68.0,803],[-68.6,342.6,68.2,805],[-60.6,336.0,68.2,807],[-51.5,329.6,68.2,810],[-42.0,324.2,68.4,812],[-32.2,319.5,68.4,815],[-22.1,315.1,68.4,817],[-11.1,311.3,68.4,820],[-0.3,308.9,68.0,823],[10.0,308.1,67.8,825],[20.8,308.2,67.6,828],[31.2,308.0,67.4,830],[41.0,307.0,67.4,833],[50.5,305.1,67.4,835],[60.4,302.3,67.6,838],[70.2,298.8,67.8,841],[79.1,294.8,68.2,844],[87.0,290.7,68.4,846],[94.7,286.5,68.6,848],[103.5,282.3,69.0,851],[112.5,278.4,69.4,854],[120.6,274.3,69.4,856],[128.1,268.8,69.4,859],[134.7,261.9,69.2,862],[139.2,254.0,69.0,865],[140.6,244.5,68.6,868],[139.2,232.7,68.2,871],[137.6,220.3,68.0,874],[136.9,209.4,68.0,877],[136.5,199.8,68.0,879],[135.7,190.3,68.0,882],[134.7,180.7,67.8,884],[133.3,171.1,67.4,887],[130.9,161.8,66.4,890],[127.0,153.3,65.4,893],[122.4,145.6,64.6,895],[116.9,137.7,64.0,897],[110.3,129.6,63.0,900],[102.9,123.1,62.4,902],[94.6,118.7,61.8,905],[85.1,115.4,61.6,907],[74.5,111.9,61.2,910],[64.6,107.2,61.0,913],[58.0,100.4,61.0,916],[54.7,91.9,61.0,919],[53.0,83.1,61.2,921],[51.5,74.6,61.0,923],[49.2,65.2,61.0,925],[45.9,54.1,61.0,928],[42.2,42.4,60.8,931],[38.8,31.0,60.4,933],[35.7,19.4,59.6,936],[32.9,7.9,59.0,938],[30.2,-3.5,58.4,941],[27.2,-14.9,57.8,943],[23.5,-26.8,57.2,946],[19.7,-38.3,56.8,949],[16.6,-48.5,56.6,951],[13.9,-58.6,56.4,954],[10.7,-68.9,56.2,956],[6.7,-78.9,56.4,959],[2.0,-88.5,56.4,961],[-3.3,-98.1,56.6,964],[-8.9,-107.1,56.8,967],[-14.6,-115.1,56.8,969],[-20.5,-123.2,57.2,972],[-26.3,-131.7,57.2,974],[-31.7,-141.1,57.6,977],[-36.7,-151.5,58.0,979],[-41.4,-163.1,58.6,982],[-45.2,-174.4,59.0,985],[-48.0,-184.7,59.4,987],[-50.4,-195.1,59.8,990],[-52.8,-205.4,60.2,992],[-55.3,-215.6,60.4,995],[-57.6,-226.0,60.6,997],[-59.8,-237.5,60.6,1000],[-61.6,-248.8,60.2,1003],[-62.6,-258.7,59.8,1005],[-62.2,-268.2,59.2,1008],[-59.4,-277.0,58.6,1010],[-53.5,-284.4,57.6,1013],[-44.8,-289.9,57.0,1015],[-33.9,-294.0,56.2,1018],[-23.3,-296.9,55.6,1021],[-13.5,-298.8,55.4,1023],[-3.7,-300.4,55.2,1026],[5.8,-302.2,55.2,1028],[14.9,-304.4,55.2,1031],[23.5,-307.6,54.8,1033],[30.9,-312.7,54.4,1036],[35.3,-319.8,54.0,1039],[35.8,-328.8,53.6,1041],[34.2,-338.7,52.8,1044],[31.8,-348.0,52.6,1046],[28.6,-357.1,52.2,1049],[24.7,-366.3,52.2,1051],[19.8,-376.1,52.2,1054],[13.7,-385.1,52.6,1057],[6.1,-390.2,53.0,1060],[-3.0,-391.4,53.4,1063],[-12.4,-390.7,53.8,1065],[-21.9,-389.8,54.0,1067],[-31.5,-389.4,54.2,1070],[-41.3,-389.3,54.6,1072],[-51.5,-389.6,54.8,1075],[-62.2,-390.3,55.0,1077],[-72.7,-391.1,55.2,1080],[-82.9,-391.4,55.2,1082],[-92.9,-391.3,55.4,1085],[-103.3,-391.2,55.6,1087],[-114.5,-391.0,55.8,1090],[-125.5,-391.0,56.2,1093],[-135.3,-391.6,56.6,1095],[-144.9,-392.7,57.0,1098],[-154.9,-393.5,57.0,1100],[-165.1,-394.0,57.2,1103],[-175.5,-394.2,57.2,1105],[-186.6,-394.3,57.2,1108],[-197.2,-394.7,57.0,1111],[-206.4,-395.6,56.8,1113],[-215.6,-396.7,56.4,1116],[-224.7,-397.6,56.2,1119],[-232.9,-396.1,55.8,1122],[-238.3,-390.2,55.6,1125],[-239.7,-381.3,55.2,1127],[-239.0,-372.1,55.0,1129],[-237.8,-362.5,54.4,1131],[-236.5,-352.2,53.4,1134],[-235.5,-341.8,52.4,1136],[-234.7,-331.3,50.8,1139],[-233.9,-320.7,50.0,1141],[-232.5,-309.6,48.6,1144],[-229.8,-299.2,47.8,1147],[-224.6,-290.9,47.4,1149],[-216.7,-284.0,47.0,1152],[-208.0,-277.4,47.0,1154],[-200.3,-270.3,47.4,1157],[-193.6,-262.8,47.8,1159],[-186.0,-256.5,48.6,1162],[-178.2,-255.4,49.8,1165],[-172.4,-261.2,51.2,1168],[-167.5,-270.1,52.2,1170],[-160.0,-278.4,53.0,1172],[-149.4,-284.9,54.0,1175],[-137.2,-289.7,54.8,1177],[-124.2,-294.3,55.8,1180],[-111.2,-299.2,56.6,1183],[-100.0,-303.2,57.0,1185],[-90.1,-306.3,57.4,1187],[-79.6,-308.5,57.6,1188],[-69.2,-309.2,58.0,1191],[-62.5,-308.7,58.4,1194]],"park":[[-263.5,-421.4],[24.5,-421.4],[38.1,-357.9],[97.1,-326.1],[142.4,-312.5],[156.0,-280.8],[151.5,-212.7],[160.6,-144.7],[174.2,-76.7],[187.8,-8.6],[215.0,59.4],[233.2,127.5],[215.0,195.5],[233.2,263.5],[237.7,331.6],[215.0,395.1],[119.8,413.2],[6.4,422.3],[-102.5,413.2],[-184.2,399.6],[-225.0,340.7],[-234.1,263.5],[-220.4,195.5],[-229.5,127.5],[-220.4,59.4],[-234.1,-8.6],[-243.1,-76.7],[-252.2,-144.7],[-265.8,-203.7],[-279.4,-249.0],[-270.3,-303.5]],"pond":[[-181.9,29.9],[-152.4,20.9],[-120.7,9.5],[-95.7,-8.6],[-79.8,-29.0],[-66.2,-20.0],[-68.5,9.5],[-82.1,41.3],[-93.4,82.1],[-102.5,132.0],[-109.3,159.2],[-125.2,172.8],[-150.1,179.6],[-166.0,170.6],[-162.4,136.5],[-156.9,95.7],[-161.5,64.0],[-177.4,48.1]],"fields":[[-261.3,-419.1],[-84.4,-421.4],[-2.7,-405.5],[22.2,-371.5],[20.0,-330.7],[-39.0,-326.1],[-88.9,-328.4],[-166.0,-330.7],[-247.7,-310.3],[-263.5,-348.8]],"clearing":[[-91.2,-74.4],[-43.5,-81.2],[-2.7,-63.1],[1.8,-40.4],[-39.0,-35.8],[-84.4,-54.0]],"diamonds":[[-227.3,-334.3],[-116.1,-357.0],[-33.6,-385.1]],"pitch":[[-234.1,-412.3],[-177.4,-376.0]]};

// ---------- the island, measured in meters (x east, y south) ----------
const CELL = 2.5;
const BOX = { x0: -340, y0: -480, x1: 300, y1: 480 };
const GW = Math.round((BOX.x1 - BOX.x0) / CELL) + 1, GH = Math.round((BOX.y1 - BOX.y0) / CELL) + 1;
const hash = (x, y, s) => { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const vn = (x, y, s) => { const ix = Math.floor(x), iy = Math.floor(y); let fx = x - ix, fy = y - iy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); const a = hash(ix, iy, s), b = hash(ix + 1, iy, s), c = hash(ix, iy + 1, s), d = hash(ix + 1, iy + 1, s); return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy; };
const fbm = (x, y, s, o) => { let v = 0, a = 0.5, n = 0; for (let i = 0; i < o; i += 1) { v += a * vn(x, y, s + i * 17); n += a; x *= 2.03; y *= 2.03; a *= 0.5; } return v / n; };
const seeded = (seed) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
function sdPoly(px, py, P) {
  let d = Infinity, inside = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i, i += 1) {
    const ax = P[j][0], ay = P[j][1], bx = P[i][0], by = P[i][1], ex = bx - ax, ey = by - ay, wx = px - ax, wy = py - ay;
    const t = clamp((wx * ex + wy * ey) / (ex * ex + ey * ey));
    d = Math.min(d, Math.hypot(wx - ex * t, wy - ey * t));
    if ((ay > py) !== (by > py) && px < (bx - ax) * (py - ay) / (by - ay) + ax) inside = !inside;
  }
  return inside ? -d : d;
}
const breathe = () => (globalThis.scheduler && scheduler.yield ? scheduler.yield() : new Promise((r) => { const c = new MessageChannel(); c.port1.onmessage = () => r(); c.port2.postMessage(0); }));
const T = COURSE.track, TEND = T[T.length - 1][3];

async function buildIsland() {
  const N = GW * GH, A = new Float32Array(N * 4), B = new Float32Array(N * 4);
  const samples = T.filter((_, i) => i % 4 === 0);
  const smin = (a, b, k) => { const h = clamp(0.5 + 0.5 * (b - a) / k); return b + (a - b) * h - k * h * (1 - h); };
  const rnd = seeded(41), islets = [];
  for (let n = 0; islets.length < 5 && n < 600; n += 1) {
    const x = BOX.x0 + rnd() * (BOX.x1 - BOX.x0), y = BOX.y0 + rnd() * (BOX.y1 - BOX.y0), r = 5 + rnd() * 9;
    if (sdPoly(x, y, COURSE.park) > 62 + r && islets.every((o) => Math.hypot(o[0] - x, o[1] - y) > 90)) islets.push([x, y, r, rnd() * 3, 1.4 + rnd()]);
  }
  let lap = performance.now();
  for (let j = 0; j < GH; j += 1) {
    for (let i = 0; i < GW; i += 1) {
      const x = BOX.x0 + i * CELL, y = BOX.y0 + j * CELL, k = (j * GW + i) * 4;
      let dt = Infinity;
      for (let s = 1; s < T.length; s += 1) {
        const ax = T[s - 1][0], ay = T[s - 1][1], ex = T[s][0] - ax, ey = T[s][1] - ay, wx = x - ax, wy = y - ay;
        if (Math.abs(wx) > 80 || Math.abs(wy) > 80) continue;
        const t = clamp((wx * ex + wy * ey) / (ex * ex + ey * ey || 1)), q = (wx - ex * t) ** 2 + (wy - ey * t) ** 2;
        if (q < dt) dt = q;
      }
      const trk = Math.min(Math.sqrt(dt), 200);
      const wx = (fbm(x / 130 + 3, y / 130, 14, 3) - 0.5) * 140, wy = (fbm(x / 130, y / 130 + 7, 15, 3) - 0.5) * 140;
      let land = sdPoly(x + wx, y + wy, COURSE.park) + (fbm(x / 170, y / 170, 3, 3) - 0.5) * 95 + (fbm(x / 40, y / 40, 4, 2) - 0.5) * 24 + (vn(x / 11, y / 11, 9) - 0.5) * 5;
      land = smin(land, trk - 24, 22);
      land = smin(land, sdPoly(x, y, COURSE.fields) - 14, 20);
      land = smin(land, sdPoly(x, y, COURSE.pond) - 30, 20);
      for (const o of islets) {
        const c = Math.cos(o[3]), s = Math.sin(o[3]), dx = x - o[0], dy = y - o[1], u = (dx * c + dy * s) / o[4], v = -dx * s + dy * c;
        land = Math.min(land, Math.hypot(u, v) - o[2] + (fbm(x / 9, y / 9, 12, 2) - 0.5) * o[2] * 1.3);
      }
      const pond = sdPoly(x, y, COURSE.pond) + (vn(x / 18, y / 18, 5) - 0.5) * 7;
      const field = sdPoly(x, y, COURSE.fields) + (vn(x / 20, y / 20, 7) - 0.5) * 8;
      const clear = sdPoly(x, y, COURSE.clearing) + (vn(x / 12, y / 12, 8) - 0.5) * 9;
      let num = 0, den = 0;
      for (const s of samples) { const w = 1 / (40 + (s[0] - x) ** 2 + (s[1] - y) ** 2); num += s[2] * w; den += w; }
      let e = num / den + (fbm(x / 70, y / 70, 11, 3) - 0.5) * 5;
      e -= 6 * clamp(land / 50 + 0.3);
      A[k] = e; A[k + 1] = fbm(x / 70 + 9, y / 70 + 4, 13, 2); A[k + 2] = field; A[k + 3] = pond;
      B[k] = trk; B[k + 1] = 2; B[k + 2] = clear; B[k + 3] = land;
    }
    if (performance.now() - lap > 16) { await breathe(); lap = performance.now(); }
  }
  // When the runner first comes within 85 m of each spot, as a fraction of the race; further out, a little later.
  const R = 85, rc = Math.ceil(R / CELL);
  for (const p of T) {
    const ci = Math.round((p[0] - BOX.x0) / CELL), cj = Math.round((p[1] - BOX.y0) / CELL), t = p[3] / TEND;
    for (let j = cj - rc; j <= cj + rc; j += 1) for (let i = ci - rc; i <= ci + rc; i += 1) {
      if (i < 0 || j < 0 || i >= GW || j >= GH) continue;
      const d = Math.hypot((i - ci) * CELL, (j - cj) * CELL);
      if (d > R) continue;
      const k = (j * GW + i) * 4 + 1, tt = t + (d / R) * (d / R) * 0.03;
      if (tt < B[k]) B[k] = tt;
    }
  }
  // the pond's surface sits a little below the lowest ground around it
  let rim = Infinity;
  for (let k = 0; k < GW * GH; k += 1) if (A[k * 4 + 3] > 0 && A[k * 4 + 3] < 8) rim = Math.min(rim, A[k * 4]);
  return { A, B, pondEle: rim - 0.6 };
}

const FRAG = `#version 300 es
precision highp float;
out vec4 o;
uniform sampler2D uA, uB, uN, uE;
uniform vec4 uBox, uBurst;
uniform vec2 uRes, uShift; uniform float uFov, uT, uRun, uPond, uNow, uIntro;
uniform vec3 uRo, uF, uR, uU, uSun, uRunner, uPtr;
uniform vec4 uDia[3];
const float EXG=.022, BASE=45., TK=2.4;
float vn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return texture(uN,(i+f+.5)/256.).r; }
float fbm(vec2 p){ return .5*vn(p)+.25*vn(p*2.03+17.3)+.125*vn(p*4.01+31.7)+.0625*vn(p*8.1+5.); }
float hs(vec2 i){ return texture(uN,(i+.5)/256.).r; }
vec2 UV(vec2 p){ return (p*100.-uBox.xy)/uBox.zw; }
vec4 TA(vec2 p){ return texture(uA,UV(p)); }
vec4 TB(vec2 p){ return texture(uB,UV(p)); }
float crown(vec2 p){
  vec2 q=p*13., i=floor(q), f=fract(q); float best=9.;
  for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){ vec2 c=vec2(x,y), r=vec2(hs(i+c),hs(i+c+vec2(91.,37.))); vec2 d=c+.15+r*.7-f; best=min(best,dot(d,d)); }
  return clamp(1.-best/.42,0.,1.);
}
// height in scene units (1 unit = 100 m), with the vertical exaggerated
float forestAt(vec4 a, vec4 b){ return smoothstep(.44,.58,a.g)*smoothstep(2.,10.,a.b)*smoothstep(1.,6.,a.a)*smoothstep(1.,7.,b.b)*smoothstep(5.,11.,b.r)*(1.-smoothstep(-12.,0.,b.a)); }
float H(vec2 p, bool fine){
  vec2 u=UV(p); if(u.x<0.||u.y<0.||u.x>1.||u.y>1.) return -.1;
  vec4 a=TA(p), b=TB(p);
  float land=1.-smoothstep(-48.,4.,b.a);
  float h=(a.r-BASE)*EXG+.02;
  float pond=1.-smoothstep(-2.5,1.5,a.a);
  h=mix(h,(uPond-BASE)*EXG-.004,pond);
  float fo=forestAt(a,b);
  if(fo>0.){ float cr=fine?crown(p):.5; h+=fo*(.035+.075*cr*cr); }
  return mix(-.08,h,land);
}
float shadowT(vec3 p){
  float s=1., t=.02;
  for(int i=0;i<22;i++){ vec3 q=p+uSun*t; float d=q.y-H(q.xz,false); s=min(s,12.*d/t); t+=clamp(d*.8,.015,.12); if(s<.02||q.y>1.2) break; }
  return clamp(s,0.,1.);
}
vec3 skyC(vec3 rd){ float y=clamp(rd.y,0.,1.); return mix(vec3(.62,.46,.36),vec3(.07,.12,.15),pow(y,.45))+vec3(1.,.6,.35)*pow(max(dot(rd,uSun),0.),6.)*.35; }

// The token: a painted miniature on a round base, the way a player's piece stands on a battle map.
float sdRoundCone(vec3 p, vec3 a, vec3 b, float r1, float r2){
  vec3 ba=b-a; float l2=dot(ba,ba), rr=r1-r2, a2=l2-rr*rr, il2=1./l2;
  vec3 pa=p-a; float y=dot(pa,ba), z=y-l2; vec3 xv=pa*l2-ba*y; float x2=dot(xv,xv), y2=y*y*l2, z2=z*z*l2;
  float k=sign(rr)*rr*rr*x2;
  if(sign(z)*a2*z2>k) return sqrt(x2+z2)*il2-r2;
  if(sign(y)*a2*y2<k) return sqrt(x2+y2)*il2-r1;
  return (sqrt(x2*a2*il2)+y*rr)*il2-r1;
}
vec2 token(vec3 q){
  q/=TK;
  float base=max(length(q.xz)-.075,abs(q.y-.01)-.01)-.002;
  float body=sdRoundCone(q,vec3(0.,.024,0.),vec3(0.,.112,0.),.045,.02);
  float cape=sdRoundCone(q,vec3(0.,.03,-.012),vec3(0.,.104,-.006),.05,.024);
  cape=max(cape,-q.z-.004);
  float head=length(q-vec3(0.,.142,0.))-.026;
  float d=base, m=0.;
  if(body<d){ d=body; m=1.; }
  if(cape<d){ d=cape; m=1.; }
  if(head<d){ d=head; m=2.; }
  return vec2(d*TK,m);
}
void main(){
  vec2 uv=(gl_FragCoord.xy*2.-uRes)/uRes.y - uShift;
  vec3 rd=normalize(uF+(uv.x*uR+uv.y*uU)*uFov), ro=uRo;
  vec3 col; float t=0., hit=-1.;
  float tw=rd.y<0.?-ro.y/rd.y:1e5;
  if(ro.y>1.1){ if(rd.y<0.) t=(ro.y-1.1)/-rd.y; else t=1e5; }
  for(int i=0;i<200;i++){ if(t>40.) break; vec3 p=ro+rd*t; if(p.y<0.) break; float d=p.y-H(p.xz,true); if(d<.0006*t){ hit=t; break; } t+=max(d*.45,.0015*t+.0008); }
  // the token, traced on its own and kept if it's in front of the ground
  float tt=-1.; float tm=0.; vec3 tc=uRunner+vec3(0.,.17*TK*.5,0.);
  { vec3 oc=ro-tc; float bb=dot(oc,rd), cc=dot(oc,oc)-pow(.12*TK,2.), h=bb*bb-cc;
    if(h>0.){ float s=max(-bb-sqrt(h),0.), e=-bb+sqrt(h);
      for(int i=0;i<48;i++){ vec2 r=token(ro+rd*s-uRunner); if(r.x<.0004){ tt=s; tm=r.y; break; } s+=r.x; if(s>e) break; } } }
  float wisp=fbm(vec2(0.)), dist;
  vec3 p; vec4 a, b;
  if(tt>0. && (hit<0. || tt<hit)){
    p=ro+rd*tt; dist=tt;
    vec3 q=p-uRunner; float e=.0008;
    vec3 n=normalize(vec3(token(q+vec3(e,0,0)).x-token(q-vec3(e,0,0)).x,token(q+vec3(0,e,0)).x-token(q-vec3(0,e,0)).x,token(q+vec3(0,0,e)).x-token(q-vec3(0,0,e)).x));
    vec3 base=tm<.5?vec3(.13,.15,.19):(tm<1.5?vec3(.46,.3,.78):vec3(.93,.76,.58));
    if(tm<.5 && q.y>.017*TK) base=vec3(.86,.66,.3);
    float ndl=dot(n,uSun);
    vec3 c=base*(vec3(.42,.46,.56)+vec3(1.15,.88,.6)*smoothstep(-.05,.15,ndl));
    c+=pow(1.-max(dot(n,-rd),0.),3.)*vec3(1.,.75,.45)*.55;
    col=c;
  } else if(hit>0.){
    p=ro+rd*hit; a=TA(p.xz); b=TB(p.xz); dist=hit;
    float e=.004;
    vec3 n=normalize(vec3(H(p.xz-vec2(e,0.),true)-H(p.xz+vec2(e,0.),true),2.*e,H(p.xz-vec2(0.,e),true)-H(p.xz+vec2(0.,e),true)));
    float land=1.-smoothstep(-48.,4.,b.a), fo=forestAt(a,b), pond=1.-smoothstep(-2.5,1.5,a.a);
    vec3 c=mix(vec3(.47,.6,.3),vec3(.56,.66,.34),smoothstep(.4,.6,fbm(p.xz*9.)));
    float fld=1.-smoothstep(-2.,2.,a.b);
    c=mix(c,mix(vec3(.47,.66,.3),vec3(.55,.74,.36),step(.5,fract(p.x*100./6.))),fld);
    for(int k=0;k<3;k++){ vec2 q=p.xz*100.-uDia[k].xy; float dm=abs(q.x)+abs(q.y); c=mix(c,vec3(.74,.53,.36),fld*(1.-smoothstep(13.,15.,dm))); c=mix(c,vec3(.52,.68,.33),fld*(1.-smoothstep(6.,8.,dm))); }
    float cl=1.-smoothstep(-2.,2.,b.b); c=mix(c,vec3(.62,.7,.38),cl*.6);
    if(fo>0.){ float cr=crown(p.xz); vec3 leaf=mix(vec3(.17,.33,.18),vec3(.32,.5,.24),cr); leaf=mix(leaf,vec3(.48,.36,.16),smoothstep(.62,.8,fbm(p.xz*3.+4.))*.7); c=mix(c,leaf,smoothstep(0.,.25,fo)); }
    float trail=(1.-smoothstep(1.6,3.2,b.r))*(1.-pond);
    c=mix(c,vec3(.76,.64,.47),trail*.85);
    float shore=1.-smoothstep(-9.,-1.,b.a); c=mix(vec3(.9,.82,.63),c,shore);
    if(pond>.5){ c=mix(vec3(.2,.42,.48),vec3(.13,.3,.38),1.-smoothstep(-30.,-2.,a.a)); c=mix(c,skyC(reflect(rd,vec3(0.,1.,0.))),.25); }
    float sh=shadowT(p+n*.004);
    float ndl=max(dot(n,uSun),0.);
    c*=vec3(1.12,.86,.62)*(.12+1.15*ndl*sh)+vec3(.34,.42,.52)*(.4+.2*n.y);
    // orienteering contours, every 2.5 m
    float hm=a.r, fw=fwidth(hm)*1.2+.01, cl1=1.-smoothstep(0.,fw,abs(fract(hm/2.5+.5)-.5)*2.5);
    c=mix(c,c*vec3(.72,.45,.25),cl1*.55*(1.-pond)*(1.-trail)*land*(1.-fo*.6));
    // the stretch just run glows; a ring marks where the token stands
    float fresh=trail*smoothstep(uRun-.03,uRun,b.g)*step(b.g,uRun);
    c=mix(c,vec3(1.,.62,.28),fresh*.7);
    float dr=length(p.xz-uRunner.xz);
    float ring=(1.-smoothstep(.006,.014,abs(dr-.17*TK*(.9+.1*sin(uT*3.)))));
    // fog of war
    wisp=fbm(p.xz*2.4+vec2(uT*.035,uT*.02))*.62+fbm(p.xz*7.-uT*.05)*.38;
    float exRun=(1.-smoothstep(uRun-.012,uRun+.012,b.g+(wisp-.5)*.02))*(1.-smoothstep(16.,82.,b.r+(wisp-.5)*26.));
    float age=uNow-texture(uE,UV(p.xz)).r;
    float exPtr=1.-smoothstep(5.,16.,age+(wisp-.5)*3.);
    float dP=length(p.xz-uPtr.xy);
    float burstR=uBurst.w*min(1.,(uNow-uBurst.z)*1.6);
    float burstFade=1.-smoothstep(4.,9.,uNow-uBurst.z);
    float dB=length(p.xz-uBurst.xy);
    float sight=max(1.-smoothstep(.2,1.05,dr+(wisp-.5)*.16),uPtr.z*(1.-smoothstep(.15,.95,dP+(wisp-.5)*.2)));
    sight=max(sight,burstFade*(1.-smoothstep(burstR*.45,burstR,dB+(wisp-.5)*.25)));
    float explored=max(max(exRun,exPtr),sight);
    vec3 grey=vec3(dot(c,vec3(.3,.59,.11)));
    vec3 seen=mix(mix(grey,c,.82)*vec3(.8,.82,.86),c,sight);
    // warm light from the token's lantern and the visitor's
    seen+=c*vec3(1.,.66,.36)*(exp(-dr*dr/.16)*.4+uPtr.z*exp(-dP*dP/.12)*.32);
    seen+=vec3(1.,.72,.38)*ring*.9;
    float fogA=(1.-explored)*land;
    float swirl=fbm(p.xz*1.6+vec2(-uT*.05,uT*.03)+wisp*1.5);
    float lift=smoothstep(-.02,.3,H(p.xz,false));
    vec3 fogc=mix(vec3(.4,.45,.51),vec3(.76,.78,.8),smoothstep(.2,.85,wisp*.55+swirl*.45))*(.86+.18*lift)+vec3(1.,.62,.32)*.05;
    col=mix(seen,fogc,fogA*.96*uIntro+(1.-uIntro)*land);
    // the edge where light meets fog burns faintly gold
    float edge=explored*(1.-explored)*4.*land;
    col+=vec3(1.,.7,.35)*edge*.12;
  } else if(tw<1e4){
    p=ro+rd*tw; b=TB(p.xz); dist=tw;
    vec2 uw=UV(p.xz); float ed=min(min(uw.x,1.-uw.x),min(uw.y,1.-uw.y)); float d=mix(90.,b.a,smoothstep(0.,.05,ed));
    vec3 c=mix(vec3(.16,.36,.4),vec3(.04,.12,.18),smoothstep(0.,40.,d));
    c=mix(c,mix(vec3(.16,.36,.4),vec3(.04,.12,.18),smoothstep(0.,40.,floor(d/10.)*10.)),.5);
    float foam=(1.-smoothstep(1.,7.,d))*.7+smoothstep(.75,.98,sin(d*.5-uT*1.6+vn(p.xz*30.)*6.))*(1.-smoothstep(4.,28.,d))*.35;
    c=mix(c,vec3(.86,.84,.8),clamp(foam,0.,1.));
    float sh=shadowT(vec3(p.x,.001,p.z));
    c*=.62+.38*sh;
    vec3 hv=normalize(uSun-rd); c+=vec3(1.,.72,.45)*pow(max(hv.y,0.),140.)*.9;
    c=mix(c,skyC(reflect(rd,vec3(0.,1.,0.))),.12);
    // a low sea fog off the shore, and the island's mist spilling a little way over the water
    float sf=fbm(p.xz*1.3+vec2(uT*.02,0.));
    c=mix(c,vec3(.2,.25,.29),smoothstep(.35,.8,sf)*.45*smoothstep(4.,60.,d));
    float wq=fbm(p.xz*2.4+vec2(uT*.035,uT*.02));
    float exR=(1.-smoothstep(uRun-.012,uRun+.012,b.g+(wq-.5)*.02))*(1.-smoothstep(16.,82.,b.r+(wq-.5)*26.)), exP=1.-smoothstep(5.,16.,uNow-texture(uE,UV(p.xz)).r);
    float spill=(1.-max(exR,exP))*(1.-smoothstep(0.,26.+wq*20.,d))*smoothstep(.0,.04,ed);
    c=mix(c,mix(vec3(.4,.45,.51),vec3(.7,.73,.76),wq)*.92,spill*.85*uIntro);
    col=c;
  } else { col=skyC(rd); dist=1e5; }
  col=mix(col,skyC(normalize(vec3(rd.x,.05,rd.z))),1.-exp(-max(dist-6.,0.)*.08));
  vec2 q=gl_FragCoord.xy/uRes; col*=.74+.26*(1.-smoothstep(.3,1.2,length((q-.5)*vec2(1.2,1.))));
  col+=(fract(sin(dot(gl_FragCoord.xy,vec2(41.3,289.1)))*43758.5)-.5)/255.;
  o=vec4(pow(clamp(col,0.,1.),vec3(.95)),1.);
}`;

const page = document.querySelector("[data-island]");
const canvas = page && page.querySelector("canvas");
const gl = canvas && context(canvas);
if (page && gl) start();
else if (page) page.classList.add("no-gl");

async function start() {
  const P = program(gl, FRAG, "andreas-island");
  if (!P) { page.classList.add("no-gl"); return; }
  const isle = await buildIsland();
  const upload = (data, unit) => {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, GW, GH, 0, gl.RGBA, gl.FLOAT, data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };
  P.use(); fullscreen(gl);
  noiseTexture(gl, 2024, 0); upload(isle.A, 1); upload(isle.B, 2);
  // when each cell was last in the visitor's light, in seconds since the page opened
  const lightAt = new Float32Array(GW * GH).fill(-1000);
  const lightTex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, lightTex);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, GW, GH, 0, gl.RED, gl.FLOAT, lightAt);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(P.u("uN"), 0); gl.uniform1i(P.u("uA"), 1); gl.uniform1i(P.u("uB"), 2); gl.uniform1i(P.u("uE"), 3);
  gl.uniform4f(P.u("uBox"), BOX.x0, BOX.y0, BOX.x1 - BOX.x0 + CELL, BOX.y1 - BOX.y0 + CELL);
  gl.uniform1f(P.u("uPond"), isle.pondEle);
  gl.uniform4fv(P.u("uDia"), COURSE.diamonds.flatMap((d) => [d[0], d[1], 0, 0]));
  gl.uniform4f(P.u("uBurst"), 0, 0, -100, 0);
  page.classList.add("is-drawn");
  const born = performance.now() / 1000;
  const now = () => performance.now() / 1000 - born;

  // the runner's position at a fraction of the race, from the real relative timing
  const cellAt = (x, y) => [clamp(Math.round((x - BOX.x0) / CELL), 0, GW - 1), clamp(Math.round((y - BOX.y0) / CELL), 0, GH - 1)];
  const heightAt = (x, y) => { const [i, j] = cellAt(x, y), k = (j * GW + i) * 4; const land = isle.B[k + 3] < -10; return land ? (isle.A[k] - 45) * 0.022 + 0.02 : 0; };
  const runnerAt = (u) => {
    const tt = u * TEND;
    let lo = 0, hi = T.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (T[m][3] < tt) lo = m; else hi = m; }
    const a = T[lo], b = T[hi], f = clamp((tt - a[3]) / ((b[3] - a[3]) || 1));
    const x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f;
    return [x / 100, heightAt(x, y), y / 100];
  };

  // ----- the visitor's light -----
  const stamp = (x, z, radius) => {
    const [ci, cj] = cellAt(x * 100, z * 100), rc = Math.ceil(radius / CELL), tNow = now();
    const j0 = Math.max(0, cj - rc), j1 = Math.min(GH - 1, cj + rc);
    for (let j = j0; j <= j1; j += 1) for (let i = Math.max(0, ci - rc); i <= Math.min(GW - 1, ci + rc); i += 1) {
      const d = Math.hypot((i - ci) * CELL, (j - cj) * CELL);
      if (d <= radius) { const k = j * GW + i, v = tNow - (d / radius) * (d / radius) * 12; if (v > lightAt[k]) lightAt[k] = v; }
    }
    gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, lightTex);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, j0, GW, j1 - j0 + 1, gl.RED, gl.FLOAT, lightAt.subarray(j0 * GW, (j1 + 1) * GW));
  };
  let camNow = null;
  const groundAt = (cx, cy) => {
    if (!camNow) return null;
    const { ro, f, r, u, fov, shift, W, H } = camNow;
    const ux = (2 * cx - W) / H - shift[0], uy = (H - 2 * cy) / H - shift[1];
    const d = [f[0] + (r[0] * ux + u[0] * uy) * fov, f[1] + (r[1] * ux + u[1] * uy) * fov, f[2] + (r[2] * ux + u[2] * uy) * fov];
    const dl = Math.hypot(...d); d[0] /= dl; d[1] /= dl; d[2] /= dl;
    if (d[1] >= 0) return null;
    let t = Math.max(0, (ro[1] - 1.1) / -d[1]);
    for (let i = 0; i < 160; i += 1) {
      const x = ro[0] + d[0] * t, y = ro[1] + d[1] * t, z = ro[2] + d[2] * t;
      const h = heightAt(x * 100, z * 100);
      if (y - h < 0.002) return [x, z, h];
      t += Math.max(0.006, (y - h) * 0.5);
      if (t > 40) break;
    }
    return null;
  };
  const ptr = { x: 0, z: 0, on: 0, want: 0, sx: 0, sy: 0, moved: 0 };
  const still = reducedMotion.matches;
  const cam = { yaw: 2.35, pitch: 0.74, dist: 9.4, drag: 0, vy: 0 };
  let dragging = false, lx = 0, downX = 0, downY = 0;
  canvas.addEventListener("pointerdown", (e) => { dragging = true; lx = e.clientX; downX = e.clientX; downY = e.clientY; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointermove", (e) => {
    const rect = canvas.getBoundingClientRect();
    ptr.sx = e.clientX - rect.left; ptr.sy = e.clientY - rect.top; ptr.moved = performance.now();
    if (dragging) { cam.vy = (e.clientX - lx) * -0.006; cam.drag += cam.vy; lx = e.clientX; }
  });
  canvas.addEventListener("pointerleave", () => { ptr.moved = 0; });
  const end = (e) => {
    if (dragging && Math.hypot(e.clientX - downX, e.clientY - downY) < 6) {
      // a click: a brighter light that spreads out from where you clicked
      const rect = canvas.getBoundingClientRect(), g = groundAt(e.clientX - rect.left, e.clientY - rect.top);
      if (g) { gl.uniform4f(P.u("uBurst"), g[0], g[1], now(), 1.7); stamp(g[0], g[1], 170); }
    }
    dragging = false;
  };
  canvas.addEventListener("pointerup", end); canvas.addEventListener("pointercancel", () => { dragging = false; });

  // the run takes 48 s; then a pause, then the mist rolls back in along the route
  const RUN = 48, HOLD = 6, BACK = 4, CYCLE = RUN + HOLD + BACK + 1.5;
  // ?run=0.5 starts partway through the race (used for the share image)
  const seedRun = parseFloat(new URLSearchParams(location.search).get("run"));
  let t0 = performance.now() / 1000 - RUN * (seedRun >= 0 && seedRun < 1 ? seedRun : 0.06), intro = still || seedRun >= 0 ? 1 : 0, lastStamp = 0;
  const frame = (t, dt, { width, height }) => {
    const c = still ? RUN + 1 : (t - t0) % CYCLE;
    let run;
    if (c < RUN) run = c / RUN;
    else if (c < RUN + HOLD) run = 1;
    else if (c < RUN + HOLD + BACK) run = 1 - (c - RUN - HOLD) / BACK;
    else run = 0;
    if (still) run = 1;
    intro = Math.min(1, intro + dt / 2.2);
    if (!dragging) { cam.drag += cam.vy; cam.vy *= 0.94; }
    const yaw = cam.yaw + cam.drag + (still ? 0 : t * 0.03);
    const tgt = [-0.25, 0.22, 0.0];
    const f = [Math.cos(cam.pitch) * Math.sin(yaw), -Math.sin(cam.pitch), Math.cos(cam.pitch) * Math.cos(yaw)];
    const r = [Math.cos(yaw), 0, -Math.sin(yaw)];
    const u = [f[1] * r[2] - f[2] * r[1], f[2] * r[0] - f[0] * r[2], f[0] * r[1] - f[1] * r[0]];
    const ro = [tgt[0] - f[0] * cam.dist, tgt[1] - f[1] * cam.dist, tgt[2] - f[2] * cam.dist];
    const narrow = width / height < 0.95;
    const shift = [narrow ? 0 : 0.42, narrow ? -0.38 : 0.02], fov = narrow ? 0.62 : 0.5;
    camNow = { ro, f, r, u, fov, shift, W: canvas.clientWidth, H: canvas.clientHeight };
    // the pointer's light follows it across the ground, and leaves the ground it passes over lit for a while
    const live = ptr.moved && performance.now() - ptr.moved < 2500;
    const g = live ? groundAt(ptr.sx, ptr.sy) : null;
    if (g) { ptr.x += (g[0] - ptr.x) * (ptr.on > 0.05 ? Math.min(1, dt * 14) : 1); ptr.z += (g[1] - ptr.z) * (ptr.on > 0.05 ? Math.min(1, dt * 14) : 1); }
    ptr.on += ((g ? 1 : 0) - ptr.on) * Math.min(1, dt * 5);
    if (g && t - lastStamp > 0.05) { stamp(ptr.x, ptr.z, 52); lastStamp = t; }
    gl.viewport(0, 0, width, height);
    gl.uniform2f(P.u("uRes"), width, height);
    gl.uniform2f(P.u("uShift"), shift[0], shift[1]);
    gl.uniform1f(P.u("uFov"), fov);
    gl.uniform1f(P.u("uT"), still ? 20 : t);
    gl.uniform1f(P.u("uNow"), now());
    gl.uniform1f(P.u("uRun"), run);
    gl.uniform1f(P.u("uIntro"), 1 - Math.pow(1 - intro, 2));
    gl.uniform3fv(P.u("uRo"), ro); gl.uniform3fv(P.u("uF"), f); gl.uniform3fv(P.u("uR"), r); gl.uniform3fv(P.u("uU"), u);
    const sun = [-0.62, 0.3, -0.72], sl = Math.hypot(...sun);
    gl.uniform3f(P.u("uSun"), sun[0] / sl, sun[1] / sl, sun[2] / sl);
    const rp = runnerAt(Math.min(run, 0.9999));
    rp[1] += still ? 0 : Math.abs(Math.sin(t * 7.5)) * 0.012 * (c < RUN ? 1 : 0);
    gl.uniform3fv(P.u("uRunner"), rp);
    gl.uniform3f(P.u("uPtr"), ptr.x, ptr.z, ptr.on);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const engine = loop(canvas, frame, { maxScale: 0.85, minScale: 0.4, startScale: matchMedia("(pointer: coarse)").matches ? 0.5 : 0.7, maxPixels: 2.1e6, gpuBudget: 6.5 });
  if (still) engine.once(); else engine.start();
}
