/* Static supplied portrait, with an independent decorative canvas layer. */
(() => {
  if(!new URLSearchParams(location.search).get('preview'))return;
  if(['higgsfield-blended','higgsfield-wide','higgsfield-bright'].includes(new URLSearchParams(location.search).get('preview')))return;
  const root = document.querySelector('.portrait-composite');
  if (!root) return;
  const canvas = root.querySelector('canvas'), button = root.querySelector('button');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const blendedCharged = new URLSearchParams(location.search).get('preview') === 'blended-charged';
  if(blendedCharged) {
    const photo=root.querySelector('img');
    photo.src='images/alan-digital-portrait.jpg';
  }
  const shimmerFlow = new URLSearchParams(location.search).get('preview') === 'shimmer-charged';
  const frontalFlow = new URLSearchParams(location.search).get('preview') === 'neural-frontal';
  const chargedCubes = blendedCharged || shimmerFlow || frontalFlow || new URLSearchParams(location.search).get('preview') === 'neural-charged';
  const frontFlow = chargedCubes || new URLSearchParams(location.search).get('preview') === 'neural-forward';
  const broadFlow = new URLSearchParams(location.search).get('preview') === 'broad-corner-flow';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false, paused = false, raf = 0, last = 0, time = 0, width = 0, height = 0, bleed = 0, topBleed = 0;
  let textArea = null;
  const particles = Array.from({length: 260}, (_, i) => ({
    phase: Math.random(), fan: Math.random(), spread: Math.random(), life: 9 + Math.random() * 7,
    originX: .31 + Math.random() * .08, originY: .32 + Math.random() * .285,
    rise: .015 + Math.random() * .045, size: .7 + Math.random() * 1.4,
    depth: .35 + Math.random() * .65, cube: i % 3 === 0, node: i % 10 === 0,
    x: 0, y: 0, alpha: 0
  }));
  // Spread emission along the rear head down to the nape, above the shoulder.
  for (const p of particles) {
    p.originX = (p.originY < .43 ? .47 + (.40 - p.originY) * .65 : .45 - (p.originY - .43) * .45) + Math.random() * .018;
  }
  if (broadFlow || shimmerFlow || blendedCharged) {
    // Alternate review version: restore the broader head and shoulder origins.
    for (const p of particles) {
      p.originY = .33 + Math.random() * .49;
      p.originX = (p.originY < .53 ? .42 : Math.max(.08, .42 - (p.originY - .53) * 1.45)) + Math.random() * .02;
    }
  }
  if (frontalFlow) {
    // Upper frontal hairline in the supplied downturned portrait.
    for (const p of particles) {
      p.originY = .355 + Math.random() * .13;
      p.originX = .79 + Math.random() * .075;
    }
  }
  if (shimmerFlow) {
    // Dense local field stays anchored; only the existing larger cubes travel.
    for(let i=0;i<6500;i++) {
      const y=.20+Math.random()*.70;
      const edge=y<.53 ? .49 : Math.max(.25,.49-(y-.53)*.48);
      const band=Math.random();
      particles.push({phase:Math.random(),fan:0,spread:Math.random(),
        originX:edge-Math.pow(band,2)*.34,originY:y,depth:.4+Math.random()*.6,
        size:.5+Math.random()*1.35,cube:false,node:i%9===0,fragment:true,
        embedded:i%110===0,flare:i%500===0});
    }
  }

  function resize() {
    const bounds = root.getBoundingClientRect();
    width = bounds.width; height = bounds.height;
    const copyBounds = document.querySelector('.hero-copy').getBoundingClientRect();
    textArea = {left:copyBounds.left-bounds.left,right:copyBounds.right-bounds.left,top:copyBounds.top-bounds.top,bottom:copyBounds.bottom-bounds.top};
    const hero = document.querySelector('#home').getBoundingClientRect();
    bleed = bounds.left - hero.left;
    topBleed = bounds.top - hero.top;
    canvas.style.left = `${-bleed}px`;
    canvas.style.top = `${-topBleed}px`;
    canvas.style.width = `${width + bleed}px`;
    canvas.style.height = `${height + topBleed}px`;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round((width + bleed) * dpr); canvas.height = Math.round((height + topBleed) * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    render();
  }
  function renderForward() {
    // A pulse travels from the head, then becomes a cube approaching the viewer.
    for (const p of particles) {
      if(blendedCharged && !p.cube) continue;
      if(shimmerFlow && !p.cube) {
        // Local particle field moves gently around fixed anchors, without drifting away.
        const x=width*(p.originX-.11*p.fan)+Math.sin(time*.8+p.phase*20)*2.5;
        const y=height*p.originY+Math.cos(time*.7+p.phase*25)*2;
        const localFade=Math.min(1,(p.originY-.17)*8,(.94-p.originY)*7);
        ctx.globalAlpha=p.depth*(.68+.22*Math.sin(time*1.4+p.phase*30))*Math.max(0,localFade);
        ctx.fillStyle='#c5faff';
        if(p.embedded) {
          const z=width*(.009+p.depth*.012);
          ctx.fillStyle='#64bac7';ctx.beginPath();ctx.moveTo(x,y-z);ctx.lineTo(x+z,y-z*.45);ctx.lineTo(x,y);ctx.lineTo(x-z,y-z*.45);ctx.closePath();ctx.fill();
          ctx.fillStyle='#328697';ctx.beginPath();ctx.moveTo(x-z,y-z*.45);ctx.lineTo(x,y);ctx.lineTo(x,y+z);ctx.lineTo(x-z,y+z*.5);ctx.closePath();ctx.fill();
          ctx.fillStyle='#b7f1f5';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+z,y-z*.45);ctx.lineTo(x+z,y+z*.5);ctx.lineTo(x,y+z);ctx.closePath();ctx.fill();
        } else ctx.fillRect(x,y,p.size,p.size);
        if(p.node){ctx.strokeStyle='#82cdd7';ctx.lineWidth=.4;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+width*.025*Math.sin(p.phase*20),y-height*.012);ctx.stroke();}
        if(p.flare){
          const r=width*.024;
          const light=ctx.createRadialGradient(x,y,0,x,y,r);
          light.addColorStop(0,'#e9ffff');light.addColorStop(.12,'#a9f5ff');light.addColorStop(1,'rgba(84,201,222,0)');
          ctx.fillStyle=light;ctx.fillRect(x-r,y-r,r*2,r*2);
        }
        continue;
      }
      const age = (p.phase + time / (6 + p.depth * 5)) % 1;
      const sx = width * p.originX, sy = height * p.originY;
      const birth = (shimmerFlow || blendedCharged) ? .06 : frontalFlow ? .42 : .24, travel = Math.max(0, (age-birth)/(1-birth));
      const projection = travel * travel;
      const reach = Math.min(width * 1.35, bleed + width * .32);
      const dx = -reach * (.5 + p.fan * .5);
      const dy = frontalFlow ? (p.spread-.50) * height * 1.05 : (p.spread-.48) * height * .8;
      const joinX = frontalFlow ? width*(.40+p.fan*.055) : sx-width*.10, joinY = frontalFlow ? sy + (p.spread-.5)*height*.20 : sy+(p.spread-.5)*height*.035;
      const pulse = Math.min(1, age/birth);
      const hairY = f => sy+(joinY-sy)*(frontalFlow ? f*f : f);
      const x = age < birth ? sx + (joinX-sx)*pulse : joinX + dx*projection;
      const y = age < birth ? (frontalFlow ? hairY(pulse) : sy+(joinY-sy)*pulse) : joinY+dy*projection;
      let alpha = Math.min(1,age*18)*Math.min(1,(1-age)*7)*p.depth*.85;
      if(x>textArea.left-12 && x<textArea.right+12 && y>textArea.top-12 && y<textArea.bottom+12) alpha *= .12;
      ctx.globalAlpha = alpha;
      if (age < birth) {
        if(shimmerFlow || blendedCharged) continue;
        ctx.strokeStyle='#a4e5ff';ctx.lineWidth=frontalFlow ? .5+pulse*.55 : .65;
        if(frontalFlow)ctx.globalAlpha=alpha*(.06+.94*pulse*pulse);
        ctx.beginPath();
        // A short moving charge travels across the hair before becoming a cube.
        const tail = frontalFlow ? Math.max(0,pulse-(.015+.04*pulse)) : 0;
        for(let j=0;j<=9;j++) {
          const f=tail+(pulse-tail)*j/9;
          const px=sx+(joinX-sx)*f;
          const py=(frontalFlow ? hairY(f) : sy+(joinY-sy)*f)+Math.sin(j*2+p.phase*30)*(frontalFlow ? .55 : 1.5)*Math.sin(j/9*Math.PI);
          if(j===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
        }
        ctx.stroke();ctx.fillStyle='#d4f5ff';ctx.beginPath();ctx.arc(x,y,1.4,0,Math.PI*2);ctx.fill();
      } else if(p.cube) {
        const size = (1.6 + projection * width * .075) * (.5+p.depth*.5);
        if(chargedCubes) ctx.globalAlpha = alpha * .32;
        ctx.lineWidth=.6;ctx.strokeStyle='#b5e9ef';
        ctx.fillStyle='#6fbfc9';ctx.beginPath();ctx.moveTo(x,y-size);ctx.lineTo(x+size,y-size*.45);ctx.lineTo(x,y);ctx.lineTo(x-size,y-size*.45);ctx.closePath();ctx.fill();ctx.stroke();
        ctx.fillStyle='#256b80';ctx.beginPath();ctx.moveTo(x-size,y-size*.45);ctx.lineTo(x,y);ctx.lineTo(x,y+size);ctx.lineTo(x-size,y+size*.5);ctx.closePath();ctx.fill();
        ctx.fillStyle='#9bdbe0';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+size,y-size*.45);ctx.lineTo(x+size,y+size*.5);ctx.lineTo(x,y+size);ctx.closePath();ctx.fill();
        if(chargedCubes) {
          ctx.save();
          // Confine the charge to the translucent cube volume.
          ctx.beginPath();ctx.moveTo(x,y-size);ctx.lineTo(x+size,y-size*.45);ctx.lineTo(x+size,y+size*.5);ctx.lineTo(x,y+size);ctx.lineTo(x-size,y+size*.5);ctx.lineTo(x-size,y-size*.45);ctx.closePath();ctx.clip();
          const energy=.76+.24*Math.sin(time*3+p.phase*30);
          ctx.globalAlpha=alpha*energy;
          const glow=ctx.createRadialGradient(x,y,0,x,y,Math.max(1,size*.85));
          glow.addColorStop(0,'#eaffff');glow.addColorStop(.16,'#a6f5ff');glow.addColorStop(.45,'rgba(74,204,231,.5)');glow.addColorStop(1,'rgba(50,170,210,0)');
          ctx.fillStyle=glow;ctx.fillRect(x-size,y-size,size*2,size*2);
          ctx.strokeStyle='#dcffff';ctx.lineWidth=Math.max(.55,size*.045);
          for(let arm=0;arm<3;arm++) {
            const angle=arm*Math.PI*2/3+p.phase*8;
            ctx.beginPath();ctx.moveTo(x,y);
            for(let j=1;j<=4;j++) {
              const f=j/4, jitter=Math.sin(time*5+p.phase*40+j*3+arm)*size*.09;
              ctx.lineTo(x+Math.cos(angle)*size*.7*f-Math.sin(angle)*jitter,y+Math.sin(angle)*size*.7*f+Math.cos(angle)*jitter);
            }
            ctx.stroke();
          }
          ctx.fillStyle='#f0ffff';ctx.beginPath();ctx.arc(x,y,Math.max(.65,size*.10),0,Math.PI*2);ctx.fill();
          ctx.restore();
        }
      } else {
        ctx.fillStyle='#91d6e4';ctx.beginPath();ctx.arc(x,y,.5+projection*1.8,0,Math.PI*2);ctx.fill();
      }
    }
  }
  function render() {
    ctx.clearRect(0, 0, width + bleed, height + topBleed);
    if (reduced.matches || !width) return;
    ctx.save();
    // Keep the face excluded while allowing the particle field to extend left.
    ctx.translate(bleed, topBleed);
    ctx.beginPath();
    if(frontalFlow) {
      // Follow the hair region; exclude the forehead, eyes and face below it.
      ctx.moveTo(-bleed,-topBleed);ctx.lineTo(width,-topBleed);
      ctx.lineTo(width,height*.40);ctx.lineTo(width*.88,height*.485);ctx.lineTo(width*.64,height*.50);
      ctx.lineTo(width*.53,height*.51);ctx.lineTo(width*.46,height*.56);ctx.lineTo(width*.46,height);ctx.lineTo(-bleed,height);ctx.closePath();
    } else ctx.rect(-bleed, -topBleed, width * .55 + bleed, height + topBleed);
    ctx.clip();
    if(frontFlow){renderForward();ctx.restore();return;}
    for (const p of particles) {
      const age = (p.phase + time / p.life) % 1;
      const startX = width * p.originX, startY = height * p.originY;
      // Fan toward the name area, widening as distance from the head increases.
      const endX = -bleed + 24 + p.fan * Math.min(240, innerWidth * .38);
      const endY = -topBleed + 70 + p.spread * 155;
      const t = age, u = 1 - t;
      p.x = u*u*startX + 2*u*t*(startX - Math.min(260, bleed * .55)) + t*t*endX;
      p.y = u*u*startY + 2*u*t*(endY + 30) + t*t*endY;
      p.alpha = Math.min(1, age * 12) * Math.min(1, (1-age)*6) * p.depth * (.72 - age * .48);
      if(p.x > textArea.left - 12 && p.x < textArea.right + 12 && p.y > textArea.top - 12 && p.y < textArea.bottom + 12) p.alpha *= .16;
      ctx.globalAlpha = p.alpha;
      const size = p.cube ? width * .014 * p.depth + 1.3 : p.size;
      ctx.fillStyle = '#7dcfff'; ctx.strokeStyle = '#b4eaff'; ctx.lineWidth = .55;
      if (p.cube) {
        // Fixed isometric faces suggest depth without spinning.
        ctx.beginPath(); ctx.moveTo(p.x, p.y-size); ctx.lineTo(p.x+size,p.y-size*.5); ctx.lineTo(p.x,p.y); ctx.lineTo(p.x-size,p.y-size*.5); ctx.closePath(); ctx.fill();
        ctx.fillStyle='#278ed0';ctx.beginPath();ctx.moveTo(p.x-size,p.y-size*.5);ctx.lineTo(p.x,p.y);ctx.lineTo(p.x,p.y+size);ctx.lineTo(p.x-size,p.y+size*.5);ctx.closePath();ctx.fill();
        ctx.fillStyle='#a4e5ff';ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+size,p.y-size*.5);ctx.lineTo(p.x+size,p.y+size*.5);ctx.lineTo(p.x,p.y+size);ctx.closePath();ctx.fill();
        if (age > .72) { ctx.globalAlpha *= (age-.72)/.28;ctx.fillRect(p.x-size*2,p.y+size*2,1,1);ctx.fillRect(p.x-size*3,p.y-size*2,1,1); }
      } else {
        ctx.beginPath();ctx.arc(p.x,p.y,size,0,Math.PI*2);ctx.fill();
        if(p.node){ctx.globalAlpha*=.13;ctx.beginPath();ctx.arc(p.x,p.y,size*3,0,Math.PI*2);ctx.fill();}
      }
    }
    // Sparse network checks: only 34 nodes, no per-frame allocation.
    for (let i=0;i<particles.length;i+=10) for (let j=i+10;j<particles.length;j+=10) {
      const a=particles[i],b=particles[j],dx=a.x-b.x,dy=a.y-b.y;
      if(dx*dx+dy*dy<width*width*.018){ctx.globalAlpha=Math.min(a.alpha,b.alpha)*.24*(.65+.35*Math.sin(time*.5+i));ctx.strokeStyle='#65c6f2';ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
    }
    ctx.restore();
  }
  function tick(stamp) {
    if (last) time += Math.min((stamp-last)/1000,.05);
    last=stamp; render(); raf=requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(raf); raf=0; last=0;
    button.hidden=reduced.matches;
    button.textContent=paused?'Resume particles':'Pause particles';
    button.setAttribute('aria-pressed',String(paused));
    if(reduced.matches)ctx.clearRect(0,0,width + bleed,height + topBleed);
    if(visible&&!document.hidden&&!paused&&!reduced.matches)raf=requestAnimationFrame(tick);
  }
  button.addEventListener('click',()=>{paused=!paused;sync();});
  reduced.addEventListener('change',sync);
  document.addEventListener('visibilitychange',sync);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.05}).observe(root);
  new ResizeObserver(resize).observe(root);
  window.addEventListener('resize',resize);
  resize();sync();
})();
