/* Original geographic grid with Natural Earth coastlines. */
(() => {
 const root=document.querySelector('.world-stage');if(!root)return;
 const canvas=root.querySelector('canvas'),toggle=root.querySelector('.globe-toggle'),controls=[...root.querySelectorAll('[data-lon]')],label=root.querySelector('.globe-caption');
 const motion=matchMedia('(prefers-reduced-motion: reduce)'),radians=Math.PI/180;
 let lon=108*radians,lat=18*radians,paused=motion.matches,visible=false,ready=false,drag=null,frame=0,last=0,selected=4,coasts=[];
 const ctx=canvas.getContext('2d');
 function fail(){ready=false;cancelAnimationFrame(frame);root.classList.add('globe-unavailable');toggle.hidden=true;canvas.hidden=true;root.querySelector('.globe-fallback').hidden=false;}
 if(!ctx){fail();return;}
 const grid=[];
 for(let x=-180;x<180;x+=15)grid.push(Array.from({length:91},(_,i)=>[x,-90+i*2]));
 for(let y=-75;y<90;y+=15)grid.push(Array.from({length:181},(_,i)=>[-180+i*2,y]));
 function project(point){const a=point[0]*radians-lon,b=point[1]*radians,c=Math.cos(b);return [c*Math.sin(a),Math.sin(b)*Math.cos(lat)-c*Math.cos(a)*Math.sin(lat),Math.sin(b)*Math.sin(lat)+c*Math.cos(a)*Math.cos(lat)];}
 function draw(){
  if(!ready)return;
  const size=canvas.clientWidth;if(!size)return;
  const scale=canvas.width/size,c=size/2,r=size*.455;
  ctx.setTransform(scale,0,0,scale,0,0);ctx.clearRect(0,0,size,size);
  const fill=ctx.createRadialGradient(c-r*.2,c-r*.25,0,c,c,r);fill.addColorStop(0,'#073a43');fill.addColorStop(1,'#010c11');
  ctx.beginPath();ctx.arc(c,c,r,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill();ctx.strokeStyle='#2d7985';ctx.lineWidth=1;ctx.stroke();
  function lines(paths,color,width){ctx.beginPath();for(const path of paths){let pen=false;for(const point of path){const [x,y,z]=project(point);if(z<0){pen=false;continue;}if(pen)ctx.lineTo(c+r*x,c-r*y);else ctx.moveTo(c+r*x,c-r*y);pen=true;}}ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
  lines(grid,'rgba(98,189,201,.28)',.65);lines(coasts,'rgba(167,235,238,.88)',1.05);
  controls.forEach((button,i)=>{const [x,y,z]=project([+button.dataset.lon,+button.dataset.lat]);if(z<.03)return;const px=c+r*x,py=c-r*y;
   ctx.shadowColor='#54e4f0';ctx.shadowBlur=14;ctx.fillStyle='#b7f8ff';ctx.beginPath();ctx.arc(px,py,i===selected?4:2.7,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
   if(i===selected){ctx.strokeStyle='#7cd3dc';ctx.lineWidth=1;ctx.beginPath();ctx.arc(px,py,8,0,Math.PI*2);ctx.stroke();}
  });
 }
 function resize(){const size=Math.max(1,Math.round(canvas.clientWidth*Math.min(devicePixelRatio,2)));if(size!==canvas.width){canvas.width=canvas.height=size;}draw();}
 function tick(t){frame=0;if(!ready||!visible||paused||document.hidden||drag)return;if(last)lon+=(t-last)*.000025;last=t;draw();frame=requestAnimationFrame(tick);}
 function schedule(){cancelAnimationFrame(frame);last=0;if(ready&&visible&&!paused&&!document.hidden&&!drag)frame=requestAnimationFrame(tick);}
 function setPaused(value){paused=value;toggle.textContent=paused?'Resume rotation':'Pause rotation';toggle.setAttribute('aria-pressed',String(paused));schedule();}
 controls.forEach((button,i)=>button.addEventListener('click',()=>{selected=i;controls.forEach(b=>b.setAttribute('aria-pressed',String(b===button)));lon=+button.dataset.lon*radians;lat=+button.dataset.lat*radians*.65;label.textContent=button.dataset.description;setPaused(true);draw();}));
 toggle.addEventListener('click',()=>setPaused(!paused));
 canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,lon,lat};canvas.setPointerCapture(e.pointerId);setPaused(true);});
 canvas.addEventListener('pointermove',e=>{if(!drag)return;lon=drag.lon-(e.clientX-drag.x)*.005;lat=Math.max(-1.1,Math.min(1.1,drag.lat+(e.clientY-drag.y)*.004));draw();});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(event,()=>{drag=null;});
 canvas.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();setPaused(true);if(e.key==='ArrowLeft')lon-=.12;if(e.key==='ArrowRight')lon+=.12;if(e.key==='ArrowUp')lat=Math.min(1.1,lat+.1);if(e.key==='ArrowDown')lat=Math.max(-1.1,lat-.1);draw();});
 motion.addEventListener('change',e=>setPaused(e.matches));document.addEventListener('visibilitychange',schedule);new ResizeObserver(resize).observe(canvas);new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();},{threshold:.05}).observe(root);setPaused(paused);
 fetch('assets/map/land.geojson').then(response=>{if(!response.ok)throw Error('Map unavailable');return response.json();}).then(data=>{coasts=data.features.flatMap(f=>f.geometry.type==='MultiPolygon'?f.geometry.coordinates.map(p=>p[0]):[f.geometry.coordinates[0]]);ready=true;root.classList.add('globe-ready');resize();schedule();}).catch(fail);
})();
