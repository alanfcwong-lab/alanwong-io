(() => {
  if(new URLSearchParams(location.search).get('preview')!=='higgsfield-blended')return;
  const root=document.querySelector('.portrait-composite');
  const img=root.querySelector('img'), button=root.querySelector('button');
  root.classList.add('higgsfield-portrait');
  img.src='images/alan-digital-portrait.jpg';
  const canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d');
  canvas.hidden=false;
  const video=document.createElement('video');
  video.src='media/hero-higgsfield.mp4';video.muted=true;video.loop=true;video.playsInline=true;video.preload='metadata';
  video.setAttribute('aria-hidden','true');root.insertBefore(video,button);
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let visible=false,paused=false;
  let raf=0,last=0,time=0,w=0,h=0,reach=0,copy=null;
  const cubes=Array.from({length:48},()=>({phase:Math.random(),y:.20+Math.random()*.64,depth:.4+Math.random()*.6,life:4+Math.random()*4,fan:Math.random()-.5}));
  function resize(){
    const r=root.getBoundingClientRect(),t=document.querySelector('.hero-copy').getBoundingClientRect();
    w=r.width;h=r.height;reach=Math.min(440,Math.max(0,r.left-12));
    copy={left:t.left-r.left,right:t.right-r.left,top:t.top-r.top,bottom:t.bottom-r.top};
    canvas.style.left=`${-reach}px`;canvas.style.width=`${w+reach}px`;
    const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round((w+reach)*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  function draw(stamp){
    if(last)time+=Math.min(.05,(stamp-last)/1000);last=stamp;
    ctx.clearRect(0,0,w+reach,h);
    for(const c of cubes){
      const a=(c.phase+time/c.life)%1,x=w*.22-a*(w*.22+reach-18),y=h*(c.y+a*c.fan*.25);
      let opacity=Math.min(1,a*7)*Math.pow(1-a,1.4)*c.depth*.65;
      if(x>copy.left&&x<copy.right&&y>copy.top&&y<copy.bottom)opacity*=.12;
      const z=(2+a*9)*c.depth,X=x+reach;
      ctx.globalAlpha=opacity;ctx.fillStyle='#70c5d5';ctx.beginPath();ctx.moveTo(X,y-z);ctx.lineTo(X+z,y-z*.45);ctx.lineTo(X,y);ctx.lineTo(X-z,y-z*.45);ctx.closePath();ctx.fill();
      ctx.fillStyle='#327b93';ctx.beginPath();ctx.moveTo(X-z,y-z*.45);ctx.lineTo(X,y);ctx.lineTo(X,y+z);ctx.lineTo(X-z,y+z*.5);ctx.closePath();ctx.fill();
      ctx.fillStyle='#b1e7ee';ctx.beginPath();ctx.moveTo(X,y);ctx.lineTo(X+z,y-z*.45);ctx.lineTo(X+z,y+z*.5);ctx.lineTo(X,y+z);ctx.closePath();ctx.fill();
      ctx.strokeStyle='#e2ffff';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(X-z*.4,y+z*.3);ctx.lineTo(X,y);ctx.lineTo(X-z*.1,y-z*.25);ctx.lineTo(X+z*.4,y-z*.4);ctx.stroke();
    }
    raf=requestAnimationFrame(draw);
  }
  new ResizeObserver(resize).observe(root);window.addEventListener('resize',resize);resize();
  function sync(){
    cancelAnimationFrame(raf);last=0;
    canvas.hidden=reduced.matches;
    if(visible&&!paused&&!document.hidden&&!reduced.matches)raf=requestAnimationFrame(draw);

    button.hidden=reduced.matches;
    video.hidden=reduced.matches;
    button.textContent=paused?'Play animation':'Pause animation';
    button.setAttribute('aria-pressed',String(paused));
    if(visible&&!paused&&!document.hidden&&!reduced.matches)video.play().catch(()=>{paused=true;button.textContent='Play animation';button.setAttribute('aria-pressed','true');});else video.pause();
  }
  video.addEventListener('playing',()=>root.classList.add('video-ready'));
  video.addEventListener('error',()=>{video.hidden=true;button.hidden=true;root.classList.remove('video-ready');});
  button.addEventListener('click',()=>{paused=!paused;sync();});
  reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
  new IntersectionObserver(e=>{visible=e[0].isIntersecting;sync();},{threshold:.05}).observe(root);
  sync();
})();
