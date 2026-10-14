(()=>{
 const preview=new URLSearchParams(location.search).get('preview');
 const bright=!preview||preview==='higgsfield-bright';
 if(!bright&&new URLSearchParams(location.search).get('preview')!=='higgsfield-wide')return;
 const hero=document.querySelector('#home'),root=document.querySelector('.portrait-composite'),img=root.querySelector('img'),button=root.querySelector('button');
 hero.classList.add('wide-video-hero');if(bright)hero.classList.add('bright-video-hero');root.querySelector('canvas').hidden=true;
 img.src=bright?'images/alan-wide-bright.png':'images/alan-landscape-reference.jpg';
 const video=document.createElement('video');video.src=bright?'media/hero-higgsfield-bright-loop.mp4':'media/hero-higgsfield-wide.mp4';video.muted=true;video.loop=true;video.playsInline=true;video.preload='metadata';video.setAttribute('aria-hidden','true');root.insertBefore(video,button);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');let visible=false,paused=false;
 function sync(){button.hidden=reduced.matches;video.hidden=reduced.matches;button.textContent=paused?'Play animation':'Pause animation';button.setAttribute('aria-pressed',String(paused));if(visible&&!paused&&!document.hidden&&!reduced.matches)video.play().catch(()=>{paused=true;button.textContent='Play animation';});else video.pause();}
 video.addEventListener('playing',()=>root.classList.add('wide-ready'));video.addEventListener('error',()=>{root.classList.remove('wide-ready');video.hidden=true;button.hidden=true;});
 button.addEventListener('click',()=>{paused=!paused;sync();});reduced.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);new IntersectionObserver(e=>{visible=e[0].isIntersecting;sync();},{threshold:.05}).observe(root);sync();
})();
