// Andreas: one island, drawn two ways. The campaign is a Dungeon Master's inked map; race day is an
// orienteering map with a GPS replay. Both come from the same geometry.
import { seeded, clamp, reducedMotion } from "./gl.js";

const COURSE = {"track":[[-86.9,-303.1,57.8,0],[-93.1,-302.3,57.6,3],[-102.9,-300.5,57.6,5],[-115.1,-297.5,57.4,8],[-128.4,-293.4,57.4,10],[-141.7,-288.7,57.4,13],[-154.6,-283.6,57.2,15],[-166.7,-276.5,56.6,18],[-176.1,-267.5,56.2,21],[-183.5,-259.0,55.8,23],[-191.8,-254.5,55.4,26],[-200.8,-256.8,55.2,28],[-209.0,-264.1,55.0,31],[-216.3,-273.4,55.2,33],[-223.9,-283.6,55.8,36],[-230.2,-293.6,56.8,39],[-233.0,-304.0,57.2,41],[-234.0,-315.9,58.0,44],[-235.0,-328.8,58.2,46],[-236.8,-342.1,58.6,49],[-239.2,-355.4,58.8,51],[-241.5,-369.0,59.2,54],[-242.9,-381.3,59.6,57],[-242.3,-391.8,59.8,59],[-238.2,-400.3,60.2,62],[-230.1,-404.1,60.4,65],[-220.1,-403.9,60.6,67],[-208.4,-402.8,60.4,69],[-194.4,-402.3,60.2,72],[-180.9,-402.0,60.0,75],[-168.6,-401.4,60.0,77],[-156.2,-400.4,59.8,80],[-144.2,-399.2,60.0,82],[-132.5,-397.9,60.0,85],[-120.5,-396.8,60.0,87],[-107.4,-395.7,60.0,90],[-94.9,-394.6,60.0,93],[-83.7,-393.3,60.0,95],[-72.9,-392.0,60.0,98],[-62.0,-390.9,60.0,100],[-51.2,-390.4,60.2,103],[-40.3,-390.6,60.4,105],[-28.4,-391.0,60.8,108],[-16.6,-390.8,61.0,111],[-5.7,-389.6,61.2,113],[4.9,-387.5,61.4,116],[13.8,-383.6,61.4,118],[19.9,-376.4,61.0,121],[23.9,-365.9,60.6,123],[27.1,-352.6,59.8,126],[30.2,-339.5,58.8,129],[32.1,-328.0,58.2,131],[31.6,-317.5,57.4,134],[26.4,-308.8,56.8,136],[16.3,-303.2,56.4,139],[3.5,-301.0,56.2,141],[-10.3,-301.0,56.0,144],[-23.2,-300.7,56.0,147],[-34.7,-298.3,56.0,149],[-45.5,-293.9,56.0,152],[-54.6,-287.6,55.8,154],[-61.0,-279.2,55.6,157],[-63.3,-269.8,55.4,160],[-62.1,-260.4,55.4,162],[-59.5,-250.3,55.6,165],[-56.4,-238.8,55.6,167],[-52.8,-226.2,56.0,170],[-49.3,-213.5,56.4,172],[-46.1,-201.2,57.2,175],[-43.1,-189.9,57.8,177],[-39.8,-178.8,58.6,180],[-36.1,-167.9,59.2,183],[-31.9,-157.7,59.8,185],[-26.7,-148.0,60.2,188],[-20.4,-138.9,60.2,190],[-13.7,-129.9,60.4,193],[-7.2,-120.5,60.4,195],[-0.6,-110.1,60.6,198],[5.4,-99.4,60.6,201],[10.6,-89.2,60.6,203],[15.8,-78.8,60.6,206],[21.5,-68.8,60.6,208],[28.2,-59.7,60.8,211],[35.9,-51.9,61.0,213],[44.4,-44.3,61.4,216],[52.4,-36.5,62.0,219],[58.7,-28.8,62.6,221],[62.9,-20.3,63.4,224],[64.9,-11.2,64.6,227],[66.2,-2.3,65.2,229],[68.0,7.7,65.8,231],[69.7,19.4,66.4,234],[70.4,30.5,67.0,237],[70.4,40.6,67.2,239],[70.4,51.2,67.2,242],[71.0,62.2,67.2,244],[72.5,73.3,66.8,247],[74.8,84.5,66.6,249],[79.2,95.5,66.2,252],[86.3,104.2,65.6,255],[95.4,110.0,65.4,257],[105.5,114.1,65.2,260],[115.9,116.2,65.0,262],[126.6,117.5,65.2,265],[137.0,119.7,65.2,267],[146.8,123.0,65.2,270],[155.1,127.5,65.4,273],[159.8,133.9,65.6,276],[159.3,141.2,65.8,278],[154.3,148.0,65.8,280],[147.2,154.7,66.0,283],[141.6,162.4,66.2,286],[139.5,171.7,66.4,288],[139.8,182.2,66.8,291],[141.0,193.0,67.0,293],[142.8,203.5,67.4,296],[144.6,213.5,68.0,298],[146.3,223.1,68.6,301],[147.8,232.8,69.2,303],[148.8,243.1,69.8,306],[148.3,253.5,70.2,309],[145.5,262.7,70.6,312],[140.9,270.1,71.0,314],[133.5,276.5,71.2,316],[124.1,282.5,71.6,319],[114.2,287.9,71.6,321],[103.6,293.5,71.4,324],[93.2,299.0,71.2,327],[83.5,303.9,71.0,329],[73.9,308.2,70.6,332],[64.1,311.7,70.4,334],[53.8,314.3,70.0,337],[43.2,316.1,69.8,339],[31.9,317.5,69.6,342],[20.6,318.5,69.4,345],[10.1,319.7,69.2,347],[-0.2,321.7,68.8,350],[-10.5,324.5,68.6,352],[-21.0,327.5,68.4,355],[-30.9,330.7,68.2,357],[-40.0,334.5,68.0,360],[-47.8,339.4,68.0,363],[-54.2,345.3,68.0,365],[-59.5,352.3,68.0,368],[-64.5,360.6,67.6,371],[-71.4,368.7,67.0,375],[-80.3,372.4,66.8,378],[-87.1,369.6,66.8,381],[-88.1,362.8,67.0,384],[-83.7,355.8,67.2,387],[-76.2,348.4,67.4,390],[-66.7,340.0,67.6,393],[-56.7,332.2,67.8,396],[-47.7,326.1,68.2,399],[-39.1,321.5,68.4,401],[-30.0,317.5,68.6,404],[-20.1,313.9,69.0,406],[-9.8,310.7,69.4,409],[1.0,308.2,69.8,411],[13.0,306.4,70.0,414],[24.8,305.2,70.4,417],[34.9,304.0,70.4,419],[44.2,302.3,70.2,422],[53.5,300.1,70.2,424],[63.0,297.8,70.0,427],[72.1,295.4,70.0,429],[81.2,292.3,70.0,432],[90.2,288.5,70.0,435],[99.2,284.5,70.0,437],[108.5,280.1,70.0,440],[117.4,275.4,69.8,442],[125.9,269.8,69.4,445],[133.5,263.1,68.8,448],[138.6,255.9,68.0,451],[140.5,247.8,67.6,453],[139.9,238.6,67.0,455],[137.7,228.6,66.4,458],[135.1,218.8,66.2,460],[133.0,208.9,66.2,463],[131.6,199.3,66.2,465],[130.6,189.9,66.2,468],[129.6,180.2,66.2,470],[128.6,169.8,65.6,473],[127.4,159.2,65.0,476],[125.3,149.5,64.2,479],[121.7,141.1,63.6,481],[116.1,133.2,63.4,483],[108.7,125.9,62.8,486],[100.1,120.3,62.8,488],[90.2,116.7,62.8,491],[80.1,115.2,62.8,494],[70.3,116.3,62.6,496],[60.8,120.1,62.6,499],[53.3,126.6,62.6,501],[46.7,134.6,62.6,504],[39.4,142.3,62.6,506],[30.4,147.9,62.2,509],[20.2,150.2,61.6,512],[10.4,149.3,61.0,515],[1.6,147.1,60.6,517],[-7.6,144.1,60.4,519],[-17.6,140.3,60.0,522],[-26.8,135.0,59.8,524],[-33.8,126.7,59.8,527],[-36.8,116.7,59.8,530],[-34.7,107.3,60.2,532],[-29.1,98.7,60.6,535],[-22.0,90.8,60.8,537],[-15.1,83.5,61.2,540],[-9.0,75.9,61.4,542],[-3.3,67.3,61.6,545],[2.1,58.6,61.8,548],[6.9,49.9,61.8,550],[11.6,40.7,61.8,553],[15.6,31.1,61.6,555],[17.8,21.5,61.2,558],[17.3,12.1,60.8,560],[13.7,2.7,60.0,563],[7.9,-5.4,59.4,566],[0.4,-11.3,59.0,568],[-8.5,-15.9,58.8,571],[-17.4,-21.2,58.8,573],[-24.8,-28.7,59.0,576],[-29.2,-38.6,59.4,578],[-30.2,-49.9,59.8,581],[-28.2,-60.4,60.6,584],[-23.9,-69.5,61.2,586],[-17.6,-77.8,62.2,589],[-9.5,-83.0,62.6,591],[0.0,-83.4,63.0,594],[9.5,-79.0,63.2,596],[19.0,-71.3,63.6,599],[28.0,-63.6,63.8,602],[35.9,-57.0,63.8,604],[43.2,-50.5,63.8,607],[50.0,-43.7,64.0,609],[56.2,-36.4,64.4,612],[61.3,-28.0,64.4,614],[65.3,-18.1,64.4,617],[68.3,-7.9,64.4,620],[70.7,2.0,64.2,622],[72.8,11.8,64.2,625],[74.7,21.1,64.2,627],[76.0,30.0,64.2,630],[76.0,39.4,64.2,632],[75.0,49.8,64.2,635],[73.9,59.8,63.8,638],[73.6,68.3,63.4,641],[74.9,76.5,63.2,644],[78.9,85.3,63.2,647],[86.4,94.5,63.6,650],[96.1,102.5,64.2,653],[106.3,108.0,64.8,656],[115.8,111.5,65.2,658],[124.9,114.5,65.8,661],[134.3,117.6,66.2,663],[144.3,120.5,66.8,666],[153.8,123.6,67.8,669],[160.5,129.7,68.2,672],[161.7,139.2,68.4,676],[156.9,147.8,68.0,679],[149.8,154.1,67.4,682],[144.5,160.7,66.8,685],[142.4,169.0,66.0,688],[142.4,178.1,65.4,690],[143.2,186.9,65.0,692],[144.4,195.7,64.8,694],[145.5,205.4,64.4,697],[146.4,215.1,64.4,700],[147.4,224.2,64.6,703],[148.4,233.5,64.8,706],[148.8,243.8,65.0,709],[147.2,254.6,64.8,712],[143.2,263.4,64.6,715],[137.2,270.2,64.2,717],[129.8,276.0,63.8,720],[121.8,281.5,63.8,722],[113.1,287.2,63.4,725],[104.5,292.7,63.4,728],[96.2,297.4,63.2,730],[87.2,302.2,63.2,733],[78.0,306.7,62.8,736],[69.3,309.6,62.6,739],[60.9,311.6,62.4,741],[51.8,313.6,62.2,743],[42.2,315.6,62.0,746],[32.9,316.9,62.0,748],[23.1,317.8,62.2,751],[13.0,319.1,62.6,754],[3.7,320.9,63.0,757],[-5.0,323.0,63.2,759],[-13.8,325.3,63.6,762],[-22.3,327.4,64.0,764],[-30.7,329.7,64.2,766],[-39.2,333.6,64.4,769],[-47.0,338.8,64.6,772],[-53.8,344.8,65.0,774],[-59.1,352.0,65.4,777],[-62.5,359.9,65.6,779],[-66.0,367.4,65.8,782],[-72.7,372.6,66.6,786],[-82.0,373.5,67.2,789],[-88.8,369.5,67.8,793],[-89.2,362.3,68.0,798],[-83.5,355.3,68.2,801],[-75.9,349.0,68.0,803],[-68.6,342.6,68.2,805],[-60.6,336.0,68.2,807],[-51.5,329.6,68.2,810],[-42.0,324.2,68.4,812],[-32.2,319.5,68.4,815],[-22.1,315.1,68.4,817],[-11.1,311.3,68.4,820],[-0.3,308.9,68.0,823],[10.0,308.1,67.8,825],[20.8,308.2,67.6,828],[31.2,308.0,67.4,830],[41.0,307.0,67.4,833],[50.5,305.1,67.4,835],[60.4,302.3,67.6,838],[70.2,298.8,67.8,841],[79.1,294.8,68.2,844],[87.0,290.7,68.4,846],[94.7,286.5,68.6,848],[103.5,282.3,69.0,851],[112.5,278.4,69.4,854],[120.6,274.3,69.4,856],[128.1,268.8,69.4,859],[134.7,261.9,69.2,862],[139.2,254.0,69.0,865],[140.6,244.5,68.6,868],[139.2,232.7,68.2,871],[137.6,220.3,68.0,874],[136.9,209.4,68.0,877],[136.5,199.8,68.0,879],[135.7,190.3,68.0,882],[134.7,180.7,67.8,884],[133.3,171.1,67.4,887],[130.9,161.8,66.4,890],[127.0,153.3,65.4,893],[122.4,145.6,64.6,895],[116.9,137.7,64.0,897],[110.3,129.6,63.0,900],[102.9,123.1,62.4,902],[94.6,118.7,61.8,905],[85.1,115.4,61.6,907],[74.5,111.9,61.2,910],[64.6,107.2,61.0,913],[58.0,100.4,61.0,916],[54.7,91.9,61.0,919],[53.0,83.1,61.2,921],[51.5,74.6,61.0,923],[49.2,65.2,61.0,925],[45.9,54.1,61.0,928],[42.2,42.4,60.8,931],[38.8,31.0,60.4,933],[35.7,19.4,59.6,936],[32.9,7.9,59.0,938],[30.2,-3.5,58.4,941],[27.2,-14.9,57.8,943],[23.5,-26.8,57.2,946],[19.7,-38.3,56.8,949],[16.6,-48.5,56.6,951],[13.9,-58.6,56.4,954],[10.7,-68.9,56.2,956],[6.7,-78.9,56.4,959],[2.0,-88.5,56.4,961],[-3.3,-98.1,56.6,964],[-8.9,-107.1,56.8,967],[-14.6,-115.1,56.8,969],[-20.5,-123.2,57.2,972],[-26.3,-131.7,57.2,974],[-31.7,-141.1,57.6,977],[-36.7,-151.5,58.0,979],[-41.4,-163.1,58.6,982],[-45.2,-174.4,59.0,985],[-48.0,-184.7,59.4,987],[-50.4,-195.1,59.8,990],[-52.8,-205.4,60.2,992],[-55.3,-215.6,60.4,995],[-57.6,-226.0,60.6,997],[-59.8,-237.5,60.6,1000],[-61.6,-248.8,60.2,1003],[-62.6,-258.7,59.8,1005],[-62.2,-268.2,59.2,1008],[-59.4,-277.0,58.6,1010],[-53.5,-284.4,57.6,1013],[-44.8,-289.9,57.0,1015],[-33.9,-294.0,56.2,1018],[-23.3,-296.9,55.6,1021],[-13.5,-298.8,55.4,1023],[-3.7,-300.4,55.2,1026],[5.8,-302.2,55.2,1028],[14.9,-304.4,55.2,1031],[23.5,-307.6,54.8,1033],[30.9,-312.7,54.4,1036],[35.3,-319.8,54.0,1039],[35.8,-328.8,53.6,1041],[34.2,-338.7,52.8,1044],[31.8,-348.0,52.6,1046],[28.6,-357.1,52.2,1049],[24.7,-366.3,52.2,1051],[19.8,-376.1,52.2,1054],[13.7,-385.1,52.6,1057],[6.1,-390.2,53.0,1060],[-3.0,-391.4,53.4,1063],[-12.4,-390.7,53.8,1065],[-21.9,-389.8,54.0,1067],[-31.5,-389.4,54.2,1070],[-41.3,-389.3,54.6,1072],[-51.5,-389.6,54.8,1075],[-62.2,-390.3,55.0,1077],[-72.7,-391.1,55.2,1080],[-82.9,-391.4,55.2,1082],[-92.9,-391.3,55.4,1085],[-103.3,-391.2,55.6,1087],[-114.5,-391.0,55.8,1090],[-125.5,-391.0,56.2,1093],[-135.3,-391.6,56.6,1095],[-144.9,-392.7,57.0,1098],[-154.9,-393.5,57.0,1100],[-165.1,-394.0,57.2,1103],[-175.5,-394.2,57.2,1105],[-186.6,-394.3,57.2,1108],[-197.2,-394.7,57.0,1111],[-206.4,-395.6,56.8,1113],[-215.6,-396.7,56.4,1116],[-224.7,-397.6,56.2,1119],[-232.9,-396.1,55.8,1122],[-238.3,-390.2,55.6,1125],[-239.7,-381.3,55.2,1127],[-239.0,-372.1,55.0,1129],[-237.8,-362.5,54.4,1131],[-236.5,-352.2,53.4,1134],[-235.5,-341.8,52.4,1136],[-234.7,-331.3,50.8,1139],[-233.9,-320.7,50.0,1141],[-232.5,-309.6,48.6,1144],[-229.8,-299.2,47.8,1147],[-224.6,-290.9,47.4,1149],[-216.7,-284.0,47.0,1152],[-208.0,-277.4,47.0,1154],[-200.3,-270.3,47.4,1157],[-193.6,-262.8,47.8,1159],[-186.0,-256.5,48.6,1162],[-178.2,-255.4,49.8,1165],[-172.4,-261.2,51.2,1168],[-167.5,-270.1,52.2,1170],[-160.0,-278.4,53.0,1172],[-149.4,-284.9,54.0,1175],[-137.2,-289.7,54.8,1177],[-124.2,-294.3,55.8,1180],[-111.2,-299.2,56.6,1183],[-100.0,-303.2,57.0,1185],[-90.1,-306.3,57.4,1187],[-79.6,-308.5,57.6,1188],[-69.2,-309.2,58.0,1191],[-62.5,-308.7,58.4,1194]],"park":[[-263.5,-421.4],[24.5,-421.4],[38.1,-357.9],[97.1,-326.1],[142.4,-312.5],[156.0,-280.8],[151.5,-212.7],[160.6,-144.7],[174.2,-76.7],[187.8,-8.6],[215.0,59.4],[233.2,127.5],[215.0,195.5],[233.2,263.5],[237.7,331.6],[215.0,395.1],[119.8,413.2],[6.4,422.3],[-102.5,413.2],[-184.2,399.6],[-225.0,340.7],[-234.1,263.5],[-220.4,195.5],[-229.5,127.5],[-220.4,59.4],[-234.1,-8.6],[-243.1,-76.7],[-252.2,-144.7],[-265.8,-203.7],[-279.4,-249.0],[-270.3,-303.5]],"pond":[[-181.9,29.9],[-152.4,20.9],[-120.7,9.5],[-95.7,-8.6],[-79.8,-29.0],[-66.2,-20.0],[-68.5,9.5],[-82.1,41.3],[-93.4,82.1],[-102.5,132.0],[-109.3,159.2],[-125.2,172.8],[-150.1,179.6],[-166.0,170.6],[-162.4,136.5],[-156.9,95.7],[-161.5,64.0],[-177.4,48.1]],"fields":[[-261.3,-419.1],[-84.4,-421.4],[-2.7,-405.5],[22.2,-371.5],[20.0,-330.7],[-39.0,-326.1],[-88.9,-328.4],[-166.0,-330.7],[-247.7,-310.3],[-263.5,-348.8]],"clearing":[[-91.2,-74.4],[-43.5,-81.2],[-2.7,-63.1],[1.8,-40.4],[-39.0,-35.8],[-84.4,-54.0]],"diamonds":[[-227.3,-334.3],[-116.1,-357.0],[-33.6,-385.1]],"pitch":[[-234.1,-412.3],[-177.4,-376.0]]};

const MW = 1100, MH = 1542;
const BOX = (() => {
  const xs = COURSE.park.map((p) => p[0]), ys = COURSE.park.map((p) => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2 + 6;
  const h = (Math.max(...ys) - Math.min(...ys)) + 150, w = h * MW / MH;
  return { x0: cx - w / 2, y0: cy - h / 2, x1: cx + w / 2, y1: cy + h / 2 };
})();
const SC = MW / (BOX.x1 - BOX.x0);
const toPx = (x, y) => [(x - BOX.x0) * SC, (y - BOX.y0) * SC];
const toM = (px, py) => [px / SC + BOX.x0, py / SC + BOX.y0];

// ---------- noise and geometry ----------
const hash = (x, y, s) => { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(s, 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const vn = (x, y, s) => { const ix = Math.floor(x), iy = Math.floor(y); let fx = x - ix, fy = y - iy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); const a = hash(ix, iy, s), b = hash(ix + 1, iy, s), c = hash(ix, iy + 1, s), d = hash(ix + 1, iy + 1, s); return (a + (b - a) * fx) * (1 - fy) + (c + (d - c) * fx) * fy; };
const fbm = (x, y, s, o) => { let v = 0, a = 0.5, n = 0; for (let i = 0; i < o; i += 1) { v += a * vn(x, y, s + i * 17); n += a; x *= 2.03; y *= 2.03; a *= 0.5; } return v / n; };
function sdPoly(px, py, P) {
  let d = Infinity, inside = false;
  for (let i = 0, j = P.length - 1; i < P.length; j = i, i += 1) {
    const ax = P[j][0], ay = P[j][1], bx = P[i][0], by = P[i][1];
    const ex = bx - ax, ey = by - ay, wx = px - ax, wy = py - ay;
    const t = clamp((wx * ex + wy * ey) / (ex * ex + ey * ey));
    d = Math.min(d, Math.hypot(wx - ex * t, wy - ey * t));
    if ((ay > py) !== (by > py) && px < (bx - ax) * (py - ay) / (by - ay) + ax) inside = !inside;
  }
  return inside ? -d : d;
}

const G = 4, GW = Math.ceil(MW / G) + 1, GH = Math.ceil(MH / G) + 1;
let grid = null;
// Yield to the page between slices of work; a message port isn't throttled the way timers are in background tabs.
const breathe = () => (globalThis.scheduler && scheduler.yield ? scheduler.yield() : new Promise((r) => { const c = new MessageChannel(); c.port1.onmessage = () => r(); c.port2.postMessage(0); }));
async function buildGrids() {
  let lap = performance.now();
  const N = GW * GH, isl = new Float32Array(N), pond = new Float32Array(N), field = new Float32Array(N), clear = new Float32Array(N), ele = new Float32Array(N);
  const trk = new Float32Array(N), blot = new Float32Array(N), veg = new Float32Array(N);
  const samples = COURSE.track.filter((_, i) => i % 4 === 0), T = COURSE.track;
  const smin = (a, b, k) => { const h = clamp(0.5 + 0.5 * (b - a) / k); return b + (a - b) * h - k * h * (1 - h); };
  const rnd = seeded(41), islets = [];
  for (let n = 0; islets.length < 5 && n < 600; n += 1) {
    const x = BOX.x0 + rnd() * (BOX.x1 - BOX.x0), y = BOX.y0 + rnd() * (BOX.y1 - BOX.y0), r = 4 + rnd() * 8;
    const d = sdPoly(x, y, COURSE.park);
    if (d > 62 + r && islets.every((o) => Math.hypot(o[0] - x, o[1] - y) > 90)) islets.push([x, y, r, rnd() * 3, 1.4 + rnd()]);
  }
  for (let j = 0; j < GH; j += 1) {
    for (let i = 0; i < GW; i += 1) {
      const [x, y] = toM(i * G, j * G), k = j * GW + i;
      let dt = Infinity;
      for (let s = 1; s < T.length; s += 1) {
        const ax = T[s - 1][0], ay = T[s - 1][1], ex = T[s][0] - ax, ey = T[s][1] - ay, wx = x - ax, wy = y - ay;
        if (Math.abs(wx) > 80 || Math.abs(wy) > 80) continue;
        const t = clamp((wx * ex + wy * ey) / (ex * ex + ey * ey || 1)), q = (wx - ex * t) ** 2 + (wy - ey * t) ** 2;
        if (q < dt) dt = q;
      }
      trk[k] = Math.min(Math.sqrt(dt), 200);
      const wx = (fbm(x / 130 + 3, y / 130, 14, 3) - 0.5) * 140, wy = (fbm(x / 130, y / 130 + 7, 15, 3) - 0.5) * 140;
      let land = sdPoly(x + wx, y + wy, COURSE.park) + (fbm(x / 170, y / 170, 3, 3) - 0.5) * 95 + (fbm(x / 40, y / 40, 4, 2) - 0.5) * 24 + (vn(x / 11, y / 11, 9) - 0.5) * 5;
      land = smin(land, trk[k] - 24, 22);
      land = smin(land, sdPoly(x, y, COURSE.fields) - 14, 20);
      land = smin(land, sdPoly(x, y, COURSE.pond) - 30, 20);
      for (const o of islets) {
        const c = Math.cos(o[3]), s = Math.sin(o[3]), dx = x - o[0], dy = y - o[1], u = (dx * c + dy * s) / o[4], v = -dx * s + dy * c;
        land = Math.min(land, Math.hypot(u, v) - o[2] + (fbm(x / 9, y / 9, 12, 2) - 0.5) * o[2] * 1.3);
      }
      isl[k] = land;
      blot[k] = fbm(x / 110, y / 110, 21, 4);
      veg[k] = fbm(x / 70 + 9, y / 70 + 4, 13, 2);
      pond[k] = sdPoly(x, y, COURSE.pond) + (vn(x / 18, y / 18, 5) - 0.5) * 7;
      field[k] = sdPoly(x, y, COURSE.fields) + (vn(x / 20, y / 20, 7) - 0.5) * 8;
      clear[k] = sdPoly(x, y, COURSE.clearing) + (vn(x / 12, y / 12, 8) - 0.5) * 9;
      let num = 0, den = 0;
      for (const s of samples) { const w = 1 / (40 + (s[0] - x) ** 2 + (s[1] - y) ** 2); num += s[2] * w; den += w; }
      let e = num / den + (fbm(x / 70, y / 70, 11, 3) - 0.5) * 5;
      e = e - 7 * clamp(1 - pond[k] / 40) - 6 * clamp(isl[k] / 50 + 0.3);
      ele[k] = e;
    }
    if (performance.now() - lap > 18) { await breathe(); lap = performance.now(); }
  }
  return { isl, pond, field, clear, ele, trk, blot, veg };
}
const at = (A, px, py) => {
  const gx = clamp(px / G, 0, GW - 1.001), gy = clamp(py / G, 0, GH - 1.001), i = Math.floor(gx), j = Math.floor(gy), fx = gx - i, fy = gy - j, k = j * GW + i;
  return (A[k] * (1 - fx) + A[k + 1] * fx) * (1 - fy) + (A[k + GW] * (1 - fx) + A[k + GW + 1] * fx) * fy;
};
const iso = (ctx, A, level, test) => {
  ctx.beginPath();
  for (let j = 0; j < GH - 1; j += 1) for (let i = 0; i < GW - 1; i += 1) {
    const k = j * GW + i, a = A[k], b = A[k + 1], c = A[k + 1 + GW], e = A[k + GW];
    const m = (a > level ? 1 : 0) | (b > level ? 2 : 0) | (c > level ? 4 : 0) | (e > level ? 8 : 0);
    if (m === 0 || m === 15) continue;
    const x = i * G, y = j * G;
    if (test && !test(x + G / 2, y + G / 2)) continue;
    const tx = x + G * (level - a) / (b - a), ry = y + G * (level - b) / (c - b), bx = x + G * (level - e) / (c - e), ly = y + G * (level - a) / (e - a);
    const seg = (x1, y1, x2, y2) => { ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); };
    if (m === 1 || m === 14 || m === 5) seg(x, ly, tx, y);
    if (m === 2 || m === 13 || m === 10) seg(tx, y, x + G, ry);
    if (m === 4 || m === 11 || m === 5) seg(x + G, ry, bx, y + G);
    if (m === 8 || m === 7 || m === 10) seg(x, ly, bx, y + G);
    if (m === 3 || m === 12) seg(x, ly, x + G, ry);
    if (m === 6 || m === 9) seg(tx, y, bx, y + G);
  }
  ctx.stroke();
};

// The course in pixels, with cumulative distance and time.
const TR = (() => {
  const pts = COURSE.track.map((p) => { const q = toPx(p[0], p[1]); return { x: q[0], y: q[1], t: p[3], d: 0 }; });
  for (let i = 1; i < pts.length; i += 1) pts[i].d = pts[i - 1].d + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  return pts;
})();
const TOTAL = TR[TR.length - 1].d;
const atDist = (d) => {
  let lo = 0, hi = TR.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (TR[mid].d < d) lo = mid; else hi = mid; }
  const a = TR[lo], b = TR[hi], f = clamp((d - a.d) / ((b.d - a.d) || 1));
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f, t: a.t + (b.t - a.t) * f, d, ang: Math.atan2(b.y - a.y, b.x - a.x) };
};
const atTime = (t) => {
  let lo = 0, hi = TR.length - 1;
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (TR[mid].t < t) lo = mid; else hi = mid; }
  const a = TR[lo], b = TR[hi], f = clamp((t - a.t) / ((b.t - a.t) || 1));
  return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
};
const nearCourse = (() => {
  const cell = 24, cols = Math.ceil(MW / cell) + 1, map = new Map();
  TR.forEach((p) => { const key = Math.floor(p.y / cell) * cols + Math.floor(p.x / cell); if (!map.has(key)) map.set(key, []); map.get(key).push(p); });
  return (x, y, r) => {
    const cx = Math.floor(x / cell), cy = Math.floor(y / cell);
    for (let j = cy - 1; j <= cy + 1; j += 1) for (let i = cx - 1; i <= cx + 1; i += 1) {
      const L = map.get(j * cols + i);
      if (L) for (const p of L) if ((p.x - x) ** 2 + (p.y - y) ** 2 < r * r) return true;
    }
    return false;
  };
})();
// n marks spread along the course, none of them close to another (the course doubles back on itself).
const spread = (n, gap) => {
  const taken = [atDist(0), atDist(TOTAL)], out = [];
  for (let i = 1; i <= n; i += 1) {
    const want = i / (n + 1);
    let best = null;
    for (let k = 0; k <= 80 && !best; k += 1) for (const f of [want + k * 0.004, want - k * 0.004]) {
      if (f < 0.04 || f > 0.96) continue;
      const p = atDist(TOTAL * f);
      if (taken.every((q) => Math.hypot(q.x - p.x, q.y - p.y) > gap)) { best = p; break; }
    }
    if (best) { taken.push(best); out.push(best); }
  }
  return out;
};
// Control descriptions, read off the map itself.
let CONTROLS = [];
const SIDES = ["east", "southeast", "south", "southwest", "west", "northwest", "north", "northeast"];
const centroid = (P) => P.reduce((a, q) => [a[0] + q[0] / P.length, a[1] + q[1] / P.length], [0, 0]);
const describe = (p) => {
  const [x, y] = toM(p.x, p.y);
  const side = (P) => { const c = centroid(P); return SIDES[(Math.round(Math.atan2(y - c[1], x - c[0]) / (Math.PI / 4)) + 8) % 8]; };
  if (sdPoly(x, y, COURSE.pond) < 40) return `Pond, ${side(COURSE.pond)} side`;
  if (sdPoly(x, y, COURSE.fields) < 22) return `Field, ${side(COURSE.fields)} edge`;
  if (sdPoly(x, y, COURSE.clearing) < 10) return `Clearing, ${side(COURSE.clearing)} edge`;
  const i = TR.findIndex((q) => q.x === p.x && q.y === p.y), idx = i >= 0 ? i : TR.reduce((b, q, k) => ((q.x - p.x) ** 2 + (q.y - p.y) ** 2 < (TR[b].x - p.x) ** 2 + (TR[b].y - p.y) ** 2 ? k : b), 0);
  const head = (k) => { const a = TR[Math.max(0, k - 2)], b = TR[Math.min(TR.length - 1, k + 2)]; return Math.atan2(b.y - a.y, b.x - a.x); };
  const crossing = TR.some((q, k) => {
    if (Math.abs(k - idx) < 30 || (q.x - p.x) ** 2 + (q.y - p.y) ** 2 > 400) return false;
    const d = Math.abs(Math.sin(head(k) - head(idx)));
    return d > 0.6;
  });
  if (crossing) return "Path junction";
  const e = at(grid.ele, p.x, p.y);
  let hi = -Infinity, lo = Infinity;
  for (let k = 0; k < 12; k += 1) { const v = at(grid.ele, p.x + Math.cos(k / 12 * 6.283) * 40, p.y + Math.sin(k / 12 * 6.283) * 40); hi = Math.max(hi, v); lo = Math.min(lo, v); }
  if (e > hi + 0.4) return "Knoll, top";
  if (e < lo - 0.4) return "Depression";
  if (at(grid.veg, p.x, p.y) > 0.6) return "Thicket, edge";
  const a = TR[Math.max(0, idx - 3)], b = TR[Math.min(TR.length - 1, idx + 3)], c = TR[idx];
  let turn = Math.abs(Math.atan2(b.y - c.y, b.x - c.x) - Math.atan2(c.y - a.y, c.x - a.x));
  if (turn > Math.PI) turn = 2 * Math.PI - turn;
  if (turn > 0.8) return "Path, bend";
  if (hi - lo > 4) return "Slope, foot";
  return "Boulder";
};
const makeControls = () => spread(6, 105).map((p) => ({ ...p, text: describe(p) }));

// ---------- race day: an orienteering map ----------
async function drawRace(cv) {
  const ctx = cv.getContext("2d");
  const img = ctx.createImageData(MW, MH), d = img.data;
  let lap = performance.now();
  for (let y = 0; y < MH; y += 1) {
    if (performance.now() - lap > 18) { await breathe(); lap = performance.now(); }
    for (let x = 0; x < MW; x += 1) {
      const isl = at(grid.isl, x, y);
      let r = 255, g = 254, b = 250;
      if (isl > 0) { r = 160; g = 216; b = 240; }
      else if (at(grid.pond, x, y) < 0) { r = 41; g = 171; b = 226; }
      else if (at(grid.field, x, y) < 0) { r = 255; g = 194; b = 61; }
      else if (at(grid.field, x, y) < 9 || at(grid.clear, x, y) < 0) { r = 255; g = 224; b = 140; }
      else {
        const gr = at(grid.veg, x, y);
        if (gr > 0.72) { r = 98; g = 196; b = 92; } else if (gr > 0.66) { r = 142; g = 214; b = 128; } else if (gr > 0.6) { r = 201; g = 234; b = 190; }
      }
      const i = (y * MW + x) * 4;
      d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.strokeStyle = "#c8681c";
  for (let n = 0, lv = 40; lv < 76; lv += 2.5, n += 1) { ctx.lineWidth = n % 4 === 0 ? 3.2 : 1.9; iso(ctx, grid.ele, lv, (x, y) => at(grid.isl, x, y) < -3 && at(grid.pond, x, y) > 1); }
  ctx.strokeStyle = "#111"; ctx.lineWidth = 3;
  iso(ctx, grid.isl, 0); iso(ctx, grid.pond, 0);
  ctx.lineWidth = 1.6;
  COURSE.diamonds.forEach((p) => { const [x, y] = toPx(p[0], p[1]), s = 13; ctx.fillStyle = "#e3b48a"; ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s, y); ctx.closePath(); ctx.fill(); ctx.stroke(); });
  { const [a, b] = COURSE.pitch.map((p) => toPx(p[0], p[1])); ctx.strokeRect(a[0], a[1], b[0] - a[0], b[1] - a[1]); }
  // Paths: the course follows them, sometimes twice, so draw each stretch of path once.
  ctx.strokeStyle = "#111"; ctx.lineWidth = 2.9; ctx.setLineDash([11, 5.5]);
  {
    const seen = [], near = (p, upto) => { for (let k = 0; k < upto; k += 1) if ((seen[k].x - p.x) ** 2 + (seen[k].y - p.y) ** 2 < 400) return true; return false; };
    let drawing = false;
    ctx.beginPath();
    TR.forEach((p, i) => {
      const dup = near(p, Math.max(0, seen.length - 12));
      seen.push(p);
      if (dup) { drawing = false; return; }
      if (drawing) ctx.lineTo(p.x, p.y); else { ctx.moveTo(i ? TR[i - 1].x : p.x, i ? TR[i - 1].y : p.y); ctx.lineTo(p.x, p.y); drawing = true; }
    });
    ctx.stroke();
  }
  ctx.setLineDash([]);
  const rnd = seeded(77);
  ctx.fillStyle = "#111";
  for (let k = 0; k < 90; k += 1) { const x = rnd() * MW, y = rnd() * MH; if (at(grid.isl, x, y) > -12 || at(grid.field, x, y) < 8 || at(grid.pond, x, y) < 8 || nearCourse(x, y, 10)) continue; ctx.beginPath(); ctx.arc(x, y, 2.2 + rnd() * 1.4, 0, 7); ctx.fill(); }
  ctx.strokeStyle = "rgba(42,163,220,0.85)"; ctx.lineWidth = 1.3;
  const tilt = Math.tan(-14 * Math.PI / 180);
  for (let x = -400; x < MW + 400; x += 110) { ctx.beginPath(); ctx.moveTo(x, MH + 10); ctx.lineTo(x + tilt * -(MH + 20), -10); ctx.stroke(); }
  ctx.globalCompositeOperation = "multiply";
  ctx.strokeStyle = "#a3238f"; ctx.fillStyle = "#a3238f"; ctx.lineWidth = 4.4;
  const start = atDist(0), finish = atDist(TOTAL), stops = [start, ...CONTROLS, finish], R = 24;
  for (let i = 0; i < stops.length - 1; i += 1) {
    const a = stops[i], b = stops[i + 1], dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
    const ra = i === 0 ? 30 : R + 6, rb = i + 1 === stops.length - 1 ? 34 : R + 6;
    if (l > ra + rb) { ctx.beginPath(); ctx.moveTo(a.x + ux * ra, a.y + uy * ra); ctx.lineTo(b.x - ux * rb, b.y - uy * rb); ctx.stroke(); }
  }
  { const th = start.ang, s = 28; ctx.beginPath(); for (let k = 0; k < 3; k += 1) { const t = th + k * 2 * Math.PI / 3; ctx[k ? "lineTo" : "moveTo"](start.x + Math.cos(t) * s, start.y + Math.sin(t) * s); } ctx.closePath(); ctx.stroke(); }
  ctx.globalCompositeOperation = "source-over"; ctx.fillStyle = "#111";
  CONTROLS.forEach((c) => { if (c.text === "Boulder") { ctx.beginPath(); ctx.arc(c.x, c.y, 4.2, 0, 7); ctx.fill(); } });
  ctx.globalCompositeOperation = "multiply"; ctx.fillStyle = "#a3238f";
  CONTROLS.forEach((c) => { ctx.beginPath(); ctx.arc(c.x, c.y, R, 0, 7); ctx.stroke(); });
  ctx.beginPath(); ctx.arc(finish.x, finish.y, 18, 0, 7); ctx.stroke();
  ctx.beginPath(); ctx.arc(finish.x, finish.y, 27, 0, 7); ctx.stroke();
  ctx.font = "700 36px Arial, Helvetica, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  CONTROLS.forEach((c, i) => { const nx = -Math.sin(c.ang), ny = Math.cos(c.ang); ctx.fillText(String(i + 1), c.x + nx * 44, c.y + ny * 44); });
  ctx.globalCompositeOperation = "source-over";
}

// ---------- the campaign: an inked map ----------
async function drawCampaign(cv) {
  const ctx = cv.getContext("2d"), INK = "#2a2018", rnd = seeded(2026);
  const img = ctx.createImageData(MW, MH), d = img.data, T = 256, fibre = new Float32Array(T * T);
  for (let y = 0; y < T; y += 1) for (let x = 0; x < T; x += 1) fibre[y * T + x] = vn(x / 2.5, y / 40, 22) * 0.7 + vn(x / 40, y / 2.2, 23) * 0.3;
  let lap = performance.now();
  for (let y = 0; y < MH; y += 1) for (let x = 0; x < MW; x += 1) {
    if (x === 0 && performance.now() - lap > 18) { await breathe(); lap = performance.now(); }
    const blot = at(grid.blot, x, y), fib = fibre[(y & 255) * T + (x & 255)] + hash(x, y, 5) * 0.5, edge = Math.min(x, y, MW - x, MH - y) / 120;
    const sea = at(grid.isl, x, y) > 0 ? 1 : 0;
    let r = 238 - blot * 22 - fib * 6, g = 228 - blot * 26 - fib * 6, b = 206 - blot * 30 - fib * 6;
    if (sea) { r -= 6; g -= 3; b += 2; }
    const v = clamp(edge, 0, 1) * 0.12 + 0.88;
    const i = (y * MW + x) * 4;
    d[i] = r * v; d[i + 1] = g * v; d[i + 2] = b * v; d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = INK;
  [[8, 0.5], [17, 0.38], [28, 0.28], [42, 0.2], [60, 0.13]].forEach(([dd, a]) => { ctx.globalAlpha = a; ctx.lineWidth = 1.4; iso(ctx, grid.isl, dd * SC * 0.6); });
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(70,90,100,0.13)";
  for (let y = 0; y < MH; y += 3) for (let x = 0; x < MW; x += 3) if (at(grid.pond, x, y) < 0) ctx.fillRect(x, y, 3, 3);
  ctx.globalAlpha = 0.45; ctx.lineWidth = 1.2; iso(ctx, grid.pond, -6); ctx.globalAlpha = 0.25; iso(ctx, grid.pond, -13); ctx.globalAlpha = 1;
  ctx.globalAlpha = 0.4; ctx.lineWidth = 1;
  for (let k = 0; k < 5200; k += 1) {
    const x = rnd() * MW, y = rnd() * MH, v = at(grid.isl, x, y);
    if (v < 1.5 || v > 16 || rnd() * 16 < v) continue;
    const l = 5 + rnd() * 9 * (1 - v / 16);
    ctx.beginPath(); ctx.moveTo(x - l / 2, y); ctx.lineTo(x + l / 2, y); ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.lineWidth = 3; iso(ctx, grid.isl, 0);
  ctx.lineWidth = 0.9; ctx.globalAlpha = 0.7; iso(ctx, grid.isl, -2.6); ctx.globalAlpha = 1;
  ctx.lineWidth = 2.2; iso(ctx, grid.pond, 0);
  ctx.lineWidth = 1.1; ctx.globalAlpha = 0.55;
  for (let k = 0; k < 900; k += 1) {
    const x = rnd() * MW, y = rnd() * MH;
    if (!(at(grid.field, x, y) < -4 || at(grid.clear, x, y) < 0) || at(grid.isl, x, y) > -4) continue;
    ctx.beginPath(); ctx.moveTo(x - 4, y - 5); ctx.lineTo(x - 1, y); ctx.lineTo(x + 1, y - 7); ctx.lineTo(x + 3, y); ctx.lineTo(x + 6, y - 4); ctx.stroke();
  }
  ctx.globalAlpha = 1; ctx.lineWidth = 1.6;
  COURSE.diamonds.forEach((p) => { const [x, y] = toPx(p[0], p[1]), s = 14; ctx.beginPath(); ctx.moveTo(x, y - s); ctx.lineTo(x + s, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s, y); ctx.closePath(); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y, 2, 0, 7); ctx.fill(); });
  { const [a, b] = COURSE.pitch.map((p) => toPx(p[0], p[1])); ctx.globalAlpha = 0.7; ctx.strokeRect(a[0], a[1], b[0] - a[0], b[1] - a[1]); ctx.beginPath(); ctx.moveTo((a[0] + b[0]) / 2, a[1]); ctx.lineTo((a[0] + b[0]) / 2, b[1]); ctx.stroke(); ctx.globalAlpha = 1; }
  ctx.globalAlpha = 0.55; ctx.lineWidth = 1;
  iso(ctx, grid.trk, 7.5, (x, y) => at(grid.field, x, y) > 3 && at(grid.clear, x, y) > 0 && at(grid.isl, x, y) < -3);
  ctx.globalAlpha = 1;
  const trees = [], cell = 15;
  for (let y = 0; y < MH + cell; y += cell * 0.8) for (let x = (Math.round(y / (cell * 0.8)) % 2) * cell / 2; x < MW; x += cell) {
    const tx = x + (rnd() - 0.5) * cell * 0.8, ty = y + (rnd() - 0.5) * cell * 0.6;
    if (at(grid.isl, tx, ty) > -5 || at(grid.pond, tx, ty) < 5 || at(grid.field, tx, ty) < 4 || at(grid.clear, tx, ty) < 2 || at(grid.trk, tx, ty) < 9) continue;
    const dense = clamp((at(grid.veg, tx, ty) - 0.34) / 0.3);
    if (rnd() > 0.38 + 0.62 * dense) continue;
    const [mx, my] = toM(tx, ty), conifer = fbm(mx / 90 + 30, my / 90, 31, 2) > 0.57;
    trees.push({ x: tx, y: ty, s: (conifer ? 8 : 9) + rnd() * 3.5, c: conifer, r: rnd() * 6.283 });
  }
  trees.sort((a, b) => a.y - b.y);
  const PAPER = "#ebe0c7";
  ctx.lineJoin = "round";
  for (const t of trees) {
    ctx.lineWidth = 1.2; ctx.strokeStyle = INK; ctx.fillStyle = PAPER;
    if (t.c) {
      const s = t.s, h = s * 2.1, w = s * 0.72, jag = 3;
      ctx.beginPath(); ctx.moveTo(t.x, t.y - h);
      for (let k = 1; k <= jag; k += 1) { const f = k / jag; ctx.lineTo(t.x + w * f, t.y - h + h * f); if (k < jag) ctx.lineTo(t.x + w * f * 0.45, t.y - h + h * f + 1); }
      for (let k = jag; k >= 1; k -= 1) { const f = k / jag; if (k < jag) ctx.lineTo(t.x - w * f * 0.45, t.y - h + h * f + 1); ctx.lineTo(t.x - w * f, t.y - h + h * f); }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.lineWidth = 0.9; ctx.beginPath();
      for (let k = 1; k <= 4; k += 1) { const yy = t.y - h + h * (k / 4.6) + 2, ww = w * (k / 4.6); ctx.moveTo(t.x + 1.5, yy); ctx.lineTo(t.x + ww * 0.8, yy + 2); }
      ctx.moveTo(t.x, t.y); ctx.lineTo(t.x, t.y + 3);
      ctx.stroke();
    } else {
      const s = t.s, cy = t.y - s * 0.95;
      ctx.beginPath();
      for (let k = 0; k <= 24; k += 1) {
        const a = (k / 24) * Math.PI * 2, rr = s * (1 + 0.1 * Math.sin(a * 5 + t.r) + 0.05 * Math.sin(a * 9 + t.r * 2));
        const px = t.x + Math.cos(a) * rr, py = cy + Math.sin(a) * rr * 0.86;
        if (k) ctx.lineTo(px, py); else ctx.moveTo(px, py);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.lineWidth = 0.9; ctx.beginPath();
      for (let k = 0; k < 3; k += 1) { const a = 0.15 + k * 0.42; ctx.moveTo(t.x + Math.cos(a) * s * 0.35, cy + Math.sin(a) * s * 0.3); ctx.lineTo(t.x + Math.cos(a) * s * 0.8, cy + Math.sin(a) * s * 0.68); }
      ctx.moveTo(t.x, t.y - s * 0.12); ctx.lineTo(t.x, t.y + 3);
      ctx.stroke();
    }
  }
  ctx.strokeStyle = "#9c2b1c"; ctx.fillStyle = "#9c2b1c";
  for (let dd = 0; dd < TOTAL; dd += 9) { const p = atDist(dd); ctx.beginPath(); ctx.arc(p.x, p.y, 2.1, 0, 7); ctx.fill(); }
  const WAY = spread(4, 150);
  WAY.forEach((p) => { ctx.lineWidth = 1.6; ctx.strokeStyle = INK; ctx.fillStyle = PAPER; ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, 7); ctx.fill(); ctx.stroke(); });
  { const p = atDist(0); ctx.lineWidth = 2.2; ctx.strokeStyle = INK; ctx.fillStyle = PAPER; ctx.beginPath(); ctx.moveTo(p.x - 12, p.y + 8); ctx.lineTo(p.x - 12, p.y - 6); ctx.arc(p.x, p.y - 6, 12, Math.PI, 0); ctx.lineTo(p.x + 12, p.y + 8); ctx.stroke(); }
  const [rx, ry] = ROSE;
  ctx.save(); ctx.translate(rx, ry); ctx.strokeStyle = INK; ctx.fillStyle = INK; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(0, 0, 34, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 28, 0, 7); ctx.stroke();
  for (let k = 0; k < 4; k += 1) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, -44); ctx.lineTo(7, -6); ctx.lineTo(0, 0); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(0, -44); ctx.lineTo(-7, -6); ctx.lineTo(0, 0); ctx.closePath(); ctx.stroke(); }
  ctx.rotate(Math.PI / 4); for (let k = 0; k < 4; k += 1) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(0, -26); ctx.lineTo(4, -4); ctx.lineTo(-4, -4); ctx.closePath(); ctx.stroke(); }
  ctx.restore();
  return WAY;
}

// Lettering goes on last, and again if the typeface arrives late.
const ROSE = [MW - 92, 96];
function drawLabels(ctx, WAY) {
  const INK = "#2a2018";
  ctx.fillStyle = INK; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.font = '400 21px "IM Fell English SC", Georgia, serif';
  WAY.forEach((p, i) => {
    const nx = -Math.sin(p.ang), ny = Math.cos(p.ang);
    ctx.lineWidth = 5; ctx.strokeStyle = "rgba(236,226,203,0.9)";
    ctx.strokeText(["I", "II", "III", "IV"][i], p.x + nx * 25, p.y + ny * 25); ctx.fillText(["I", "II", "III", "IV"][i], p.x + nx * 25, p.y + ny * 25);
  });
  ctx.textBaseline = "alphabetic";
  const label = (text, x, y, size, opts = {}) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(opts.rot || 0);
    ctx.font = `${opts.italic ? "italic " : ""}400 ${size}px "${opts.italic ? "IM Fell English" : "IM Fell English SC"}", Georgia, serif`;
    if (opts.spacing && "letterSpacing" in ctx) ctx.letterSpacing = opts.spacing;
    ctx.lineWidth = 6; ctx.strokeStyle = "rgba(236,226,203,0.85)"; ctx.strokeText(text, 0, 0); ctx.fillText(text, 0, 0);
    ctx.restore();
  };
  { const c = centroid(COURSE.fields), [x, y] = toPx(c[0], c[1]); label("The Diamond Fields", x - 30, y + 4, 26, { italic: true }); }
  { const c = centroid(COURSE.pond), [x, y] = toPx(c[0], c[1]); label("The Mere", x - 6, y, 26, { italic: true, rot: -1.38 }); }
  { const p = atDist(0); label("The Gate", p.x + 4, p.y + 40, 20, { italic: true }); }
  { const [x, y] = toPx(-40, 300); label("TURNWOOD", x, y, 46, { spacing: "14px", rot: -0.18 }); }
  ctx.font = '400 20px "IM Fell English SC", Georgia, serif'; ctx.fillText("N", ROSE[0], ROSE[1] - 52);
}

// ---------- the d20 ----------
function setupDie(cv) {
  if (!cv) return;
  const ctx = cv.getContext("2d"), W = cv.width, H = cv.height, phi = (1 + Math.sqrt(5)) / 2;
  const V = [[-1, phi, 0], [1, phi, 0], [-1, -phi, 0], [1, -phi, 0], [0, -1, phi], [0, 1, phi], [0, -1, -phi], [0, 1, -phi], [phi, 0, -1], [phi, 0, 1], [-phi, 0, -1], [-phi, 0, 1]].map((v) => { const l = Math.hypot(...v); return v.map((c) => c / l); });
  const F = [[0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11], [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8], [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9], [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1]];
  const cen = F.map((f) => { const c = [0, 1, 2].map((k) => (V[f[0]][k] + V[f[1]][k] + V[f[2]][k]) / 3); const l = Math.hypot(...c); return c.map((v) => v / l); });
  const num = new Array(20).fill(0), used = new Set();
  let next = 1;
  cen.forEach((c, i) => {
    if (used.has(i)) return;
    const opp = cen.findIndex((o, j) => j !== i && Math.abs(o[0] + c[0]) + Math.abs(o[1] + c[1]) + Math.abs(o[2] + c[2]) < 1e-3);
    num[i] = next; num[opp] = 21 - next; used.add(i); used.add(opp); next += 1;
  });
  const qmul = (a, b) => [a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3], a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2], a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1], a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0]];
  const qnorm = (q) => { const l = Math.hypot(...q); return q.map((v) => v / l); };
  const qrot = (q, v) => { const p = qmul(qmul(q, [0, ...v]), [q[0], -q[1], -q[2], -q[3]]); return [p[1], p[2], p[3]]; };
  const qaxis = (ax, ang) => { const s = Math.sin(ang / 2), l = Math.hypot(...ax) || 1; return [Math.cos(ang / 2), ax[0] / l * s, ax[1] / l * s, ax[2] / l * s]; };
  const slerp = (a, b, t) => { let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]; if (d < 0) { b = b.map((v) => -v); d = -d; } if (d > 0.9995) return qnorm(a.map((v, i) => v + (b[i] - v) * t)); const th = Math.acos(d), s = Math.sin(th); return a.map((v, i) => (v * Math.sin((1 - t) * th) + b[i] * Math.sin(t * th)) / s); };
  const target = (fi) => {
    const c = cen[fi], to = [0, 0, 1], ax = [c[1] * to[2] - c[2] * to[1], c[2] * to[0] - c[0] * to[2], c[0] * to[1] - c[1] * to[0]];
    let q = qaxis(ax, Math.acos(clamp(c[2], -1, 1)));
    const v0 = qrot(q, V[F[fi][0]]), up = Math.atan2(v0[0], v0[1]);
    return qnorm(qmul(qaxis([0, 0, 1], up), q));
  };
  let q = target(19), w = [0, 0, 0], rolling = 0, settle = null, prev = 0, result = num[19];
  const L = (() => { const l = [-0.4, 0.55, 0.75], n = Math.hypot(...l); return l.map((v) => v / n); })();
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    const R = W * 0.36, cx = W / 2, cy = H * 0.47;
    ctx.fillStyle = "rgba(10,6,3,0.35)"; ctx.beginPath(); ctx.ellipse(cx + 6, H * 0.86, R * 0.95, R * 0.22, 0, 0, 7); ctx.fill();
    const P = V.map((v) => qrot(q, v));
    const order = F.map((f, i) => ({ i, z: (P[f[0]][2] + P[f[1]][2] + P[f[2]][2]) / 3 })).sort((a, b) => a.z - b.z);
    for (const { i } of order) {
      const f = F[i], n = qrot(q, cen[i]);
      if (n[2] < -0.05) continue;
      const lit = clamp(0.35 + 0.65 * (n[0] * L[0] + n[1] * L[1] + n[2] * L[2]));
      const r = Math.round(120 + 90 * lit), g = Math.round(28 + 40 * lit), b = Math.round(24 + 30 * lit);
      ctx.fillStyle = `rgb(${r},${g},${b})`; ctx.strokeStyle = "rgba(40,6,4,0.6)"; ctx.lineWidth = 1.2;
      ctx.beginPath(); f.forEach((vi, k) => { const p = P[vi]; ctx[k ? "lineTo" : "moveTo"](cx + p[0] * R, cy - p[1] * R); }); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (n[2] > 0.25) {
        const c = [0, 1, 2].map((k) => (P[f[0]][k] + P[f[1]][k] + P[f[2]][k]) / 3), up = P[f[0]];
        const ang = Math.atan2(up[0] - c[0], up[1] - c[1]);
        ctx.save(); ctx.translate(cx + c[0] * R, cy - c[1] * R); ctx.rotate(ang); ctx.scale(1, clamp(n[2] * 1.15, 0.3, 1));
        ctx.fillStyle = `rgba(248,240,220,${clamp((n[2] - 0.25) * 2)})`; ctx.font = `700 ${Math.round(R * 0.3)}px Georgia, serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(String(num[i]) + (num[i] === 6 || num[i] === 9 ? "." : ""), 0, R * 0.04);
        ctx.restore();
      }
    }
  };
  const tick = (now) => {
    const dt = prev ? Math.min(0.05, (now - prev) / 1000) : 0.016; prev = now;
    if (rolling > 0) {
      rolling -= dt;
      const sp = Math.hypot(...w);
      if (sp > 0) q = qnorm(qmul(qaxis(w, sp * dt), q));
      w = w.map((v) => v * Math.exp(-dt * 1.6));
      if (rolling <= 0) settle = { from: q, to: target(num.indexOf(result)), t: 0 };
      requestAnimationFrame(tick);
    } else if (settle) {
      settle.t = Math.min(1, settle.t + dt * 2.2);
      const e = 1 - Math.pow(1 - settle.t, 3);
      q = slerp(settle.from, settle.to, e);
      if (settle.t >= 1) { settle = null; cv.dispatchEvent(new CustomEvent("rolled", { detail: result })); } else requestAnimationFrame(tick);
    } else { prev = 0; }
    draw();
  };
  const roll = () => {
    if (rolling > 0 || settle) return;
    result = 1 + Math.floor(Math.random() * 20);
    if (reducedMotion.matches) { q = target(num.indexOf(result)); draw(); cv.dispatchEvent(new CustomEvent("rolled", { detail: result })); return; }
    w = [(Math.random() - 0.5) * 30, (Math.random() - 0.5) * 30, (Math.random() - 0.5) * 18];
    rolling = 1.1; prev = 0; requestAnimationFrame(tick);
  };
  draw();
  return { roll };
}

// ---------- page ----------
const page = document.querySelector("[data-atlas]");
if (page) {
  const race = page.querySelector("[data-map-race]"), camp = page.querySelector("[data-map-campaign]"), over = page.querySelector("[data-map-over]");
  const fonts = document.fonts ? Promise.all([document.fonts.load('400 30px "IM Fell English SC"'), document.fonts.load('italic 400 26px "IM Fell English"')]).catch(() => {}) : Promise.resolve();
  let fontsIn = false;
  fonts.then(() => { fontsIn = true; });
  (async () => {
    grid = await buildGrids();
    CONTROLS = makeControls();
    const cds = page.querySelector("[data-cds]");
    if (cds) {
      const start = describe(atDist(0)), last = CONTROLS[CONTROLS.length - 1];
      const toGo = Math.round((TOTAL - (last ? last.d : 0)) / SC / 10) * 10;
      cds.innerHTML = `<li><b aria-label="Start">△</b><span>${start.replace(/^(\w)/, (m) => m.toUpperCase())}</span></li>`
        + CONTROLS.map((c, i) => `<li><b>${i + 1}</b><span>${c.text}</span></li>`).join("")
        + `<li><b aria-label="Finish">◎</b><span>Navigate ${toGo} m to the finish</span></li>`;
    }
    const base = document.createElement("canvas"); base.width = MW; base.height = MH;
    const way = await drawCampaign(base);
    await Promise.race([fonts, new Promise((r) => setTimeout(r, 1200))]);
    const paint = () => { const c = camp.getContext("2d"); c.drawImage(base, 0, 0); drawLabels(c, way); };
    paint();
    page.classList.add("is-drawn");
    if (!fontsIn) fonts.then(paint);
    await breathe();
    await drawRace(race);
  })();
  const die = setupDie(page.querySelector("[data-die]"));
  const dieBtn = page.querySelector("[data-roll]"), dieOut = page.querySelector("[data-roll-out]");
  if (dieBtn && die) dieBtn.addEventListener("click", () => die.roll());
  const dieCv = page.querySelector("[data-die]");
  if (dieCv && dieOut) dieCv.addEventListener("rolled", (e) => { dieOut.textContent = e.detail === 20 ? "A natural 20." : e.detail === 1 ? "A natural 1. The table goes quiet." : `You rolled ${e.detail}.`; });

  const setMode = (mode, from) => {
    if (page.dataset.mode === mode) return;
    const sheet = page.querySelector("[data-sheet]");
    const r = sheet.getBoundingClientRect(), fx = from ? clamp(from.clientX - r.left, 0, r.width) : r.width / 2, fy = from ? clamp(from.clientY - r.top, 0, r.height) : 0;
    sheet.style.setProperty("--fx", `${fx}px`); sheet.style.setProperty("--fy", `${fy}px`);
    page.dataset.mode = mode;
    page.querySelectorAll("[data-mode-btn]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.modeBtn === mode)));
    page.querySelectorAll("[data-panel]").forEach((p) => { p.hidden = p.dataset.panel !== mode; });
    camp.setAttribute("aria-label", mode === "race"
      ? "An orienteering map of the same island: forest in greens, open fields in yellow, contours in brown, and a course of six controls in purple"
      : "A hand-inked map of a wooded island with a pond, playing fields and a winding route marked in red");
    replay.t0 = performance.now();
    if (mode === "race") replay.start();
  };
  page.querySelectorAll("[data-mode-btn]").forEach((b) => b.addEventListener("click", (e) => setMode(b.dataset.modeBtn, e.detail ? e : null)));

  const replay = (() => {
    const ctx = over.getContext("2d"), T = TR[TR.length - 1].t, LEN = 26;
    let raf = 0;
    const api = { t0: performance.now(), start() { if (!raf) raf = requestAnimationFrame(frame); } };
    function frame(now) {
      raf = 0;
      ctx.clearRect(0, 0, MW, MH);
      if (page.dataset.mode !== "race") return;
      const u = reducedMotion.matches ? 1 : ((now - api.t0) / 1000) % (LEN + 3) / LEN;
      const t = Math.min(1, u) * T;
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      for (let k = 0; k < 30; k += 1) {
        const a = atTime(Math.max(0, t - 90 * (1 - k / 30))), b = atTime(Math.max(0, t - 90 * (1 - (k + 1) / 30)));
        ctx.strokeStyle = `rgba(226,38,46,${(0.06 + 0.86 * k / 30).toFixed(2)})`; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      }
      const p = atTime(t);
      ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(p.x, p.y, 11, 0, 7); ctx.fill();
      ctx.fillStyle = "#e2262e"; ctx.beginPath(); ctx.arc(p.x, p.y, 8, 0, 7); ctx.fill();
      if (!reducedMotion.matches) raf = requestAnimationFrame(frame);
    }
    return api;
  })();
  if (page.dataset.mode === "race") replay.start();

  // Scale bar, and a lamp over the table that leans toward the pointer.
  const sheet = page.querySelector("[data-sheet]"), bar = page.querySelector("[data-scale] i");
  const sizeBar = () => { if (bar) bar.style.width = `${(200 * SC * sheet.clientWidth / MW).toFixed(1)}px`; };
  sizeBar();
  new ResizeObserver(sizeBar).observe(sheet);
  if (!reducedMotion.matches && matchMedia("(hover: hover)").matches) {
    let tx = 46, ty = 40, lx = 46, ly = 40, raf = 0;
    const step = () => {
      lx += (tx - lx) * 0.08; ly += (ty - ly) * 0.08;
      sheet.style.setProperty("--lx", `${lx.toFixed(2)}%`); sheet.style.setProperty("--ly", `${ly.toFixed(2)}%`);
      raf = Math.abs(tx - lx) + Math.abs(ty - ly) > 0.05 ? requestAnimationFrame(step) : 0;
    };
    addEventListener("pointermove", (e) => {
      const r = sheet.getBoundingClientRect();
      tx = clamp((e.clientX - r.left) / r.width, -0.2, 1.2) * 60 + 20; ty = clamp((e.clientY - r.top) / r.height, -0.2, 1.2) * 50 + 15;
      if (!raf) raf = requestAnimationFrame(step);
    }, { passive: true });
  }
}
