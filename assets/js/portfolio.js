(() => {
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine)');
  if (motionPreference.matches || !finePointer.matches) return;

  const surfaces = document.querySelectorAll('.feed__item, .post__image');
  surfaces.forEach((surface) => {
    let frame = 0;
    surface.addEventListener('pointermove', (event) => {
      const bounds = surface.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width;
      const y = (event.clientY - bounds.top) / bounds.height;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        surface.style.setProperty('--pointer-x', `${x * 100}%`);
        surface.style.setProperty('--pointer-y', `${y * 100}%`);
        surface.style.setProperty('--tilt-x', `${(0.5 - y) * 5}deg`);
        surface.style.setProperty('--tilt-y', `${(x - 0.5) * 6}deg`);
      });
    });
    surface.addEventListener('pointerleave', () => {
      cancelAnimationFrame(frame);
      surface.style.setProperty('--tilt-x', '0deg');
      surface.style.setProperty('--tilt-y', '0deg');
    });
  });
})();

(() => {
  const root = document.querySelector('[data-cyber-scene]');
  if (!root) return;
  const canvas = root.querySelector('canvas');
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) return;
  const model = root.querySelector('[data-scene-selection]');
  const state = root.querySelector('[data-scene-status]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const vertices = [];
  const packets = Array.from({ length: 5 }, (_, i) => ({ phase: i / 5, side: i % 2 ? 1 : -1 }));
  let w=1,h=1,dpr=1,yaw=-.42,pitch=.16,zoom=1,drag=null,hover=-1,chosen=-1,points=[],last=0,frame=0;
  for(let i=0;i<46;i++){const y=1-i/45*2,r=Math.sqrt(1-y*y),a=Math.PI*(3-Math.sqrt(5))*i;vertices.push({x:Math.cos(a)*r,y,z:Math.sin(a)*r,id:String(i+1).padStart(2,'0')});}
  function resize(){const b=root.getBoundingClientRect();dpr=Math.min(devicePixelRatio||1,2);w=Math.max(1,b.width);h=Math.max(1,b.height);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);}
  function project(p,cx,cy,r){const cyaw=Math.cos(yaw),syaw=Math.sin(yaw),cxr=Math.cos(pitch),sxr=Math.sin(pitch),x=p.x*cyaw-p.z*syaw,z1=p.x*syaw+p.z*cyaw,y1=p.y*cxr-z1*sxr,z=p.y*sxr+z1*cxr,depth=700/(700-z*r*.72);return{x:cx+x*r*depth,y:cy+y1*r*depth,z,depth};}
  function line(list,color,width=1){if(!list.length)return;ctx.beginPath();list.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
  function render(now){const dt=Math.min((now-(last||now))/1000,.04);last=now;if(!drag&&!reduced.matches)yaw+=dt*.12;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#080d12';ctx.fillRect(0,0,w,h);const cx=w*.55,cy=h*.53,r=Math.min(w*.31,h*.38,142*Math.min(w,h)/430)*zoom;
    const bg=ctx.createRadialGradient(cx,cy,0,cx,cy,Math.max(w,h)*.75);bg.addColorStop(0,'rgba(21,62,81,.55)');bg.addColorStop(.52,'rgba(11,26,37,.32)');bg.addColorStop(1,'#080d12');ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
    for(let i=0;i<86;i++){ctx.fillStyle=`rgba(167,221,244,${.12+(i*13%8)/50})`;ctx.fillRect((i*127.7+31)%w,(i*71.3+19)%h,1,1);}
    const glow=ctx.createRadialGradient(cx,cy,r*.1,cx,cy,r*1.5);glow.addColorStop(0,'rgba(40,153,198,.16)');glow.addColorStop(1,'transparent');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(cx,cy,r*1.5,0,7);ctx.fill();
    for(let lat=-60;lat<=60;lat+=30){const list=[],a0=lat*Math.PI/180;for(let j=0;j<=90;j++){const a=j/90*Math.PI*2;list.push(project({x:Math.cos(a0)*Math.cos(a),y:Math.sin(a0),z:Math.cos(a0)*Math.sin(a)},cx,cy,r));}line(list,'rgba(111,190,221,.17)',.7);}
    for(let lon=0;lon<180;lon+=30){const list=[],a0=lon*Math.PI/180;for(let j=0;j<=80;j++){const a=-Math.PI/2+j/80*Math.PI;list.push(project({x:Math.cos(a)*Math.cos(a0),y:Math.sin(a),z:Math.cos(a)*Math.sin(a0)},cx,cy,r));}line(list,'rgba(111,190,221,.15)',.7);}
    for(let orbit=0;orbit<3;orbit++){const tilt=-.65+orbit*.64,list=[];for(let j=0;j<=100;j++){const a=j/100*Math.PI*2;list.push(project({x:Math.cos(a)*1.3,y:Math.sin(a)*1.3*Math.cos(tilt),z:Math.sin(a)*1.3*Math.sin(tilt)},cx,cy,r));}line(list,'rgba(117,203,238,.2)',.8);}
    points=vertices.map(v=>project(v,cx,cy,r));
    for(let i=0;i<vertices.length;i++){const near=[];for(let j=i+1;j<vertices.length;j++){const a=vertices[i],b=vertices[j],d=(a.x-b.x)**2+(a.y-b.y)**2+(a.z-b.z)**2;if(d<.31)near.push([j,d]);}near.sort((a,b)=>a[1]-b[1]);for(const[j]of near.slice(0,3)){const a=points[i],b=points[j],front=Math.max(.08,(a.z+b.z+2)/4);line([a,b],`rgba(112,202,238,${.08+front*.3})`,.7);}}
    packets.forEach((p,i)=>{if(!reduced.matches)p.phase=(p.phase+dt*(.12+i*.012))%1;const start={x:cx+p.side*w*.58,y:cy-h*.42+i*h*.2},end={x:cx+p.side*r*.74,y:cy+(i-2)*r*.22},t=Math.min(p.phase,.83),x=start.x+(end.x-start.x)*t,y=start.y+(end.y-start.y)*t;ctx.setLineDash([3,7]);line([start,{x,y}],'rgba(255,104,118,.32)');ctx.setLineDash([]);ctx.shadowBlur=14;ctx.shadowColor='#ff6977';ctx.fillStyle='#ff7a85';ctx.beginPath();ctx.arc(x,y,3+Math.sin(now/180+i),0,7);ctx.fill();ctx.shadowBlur=0;ctx.strokeStyle=`rgba(139,215,247,${.22*(1-(p.phase*2.7%1))})`;ctx.beginPath();ctx.arc(end.x,end.y,5+(p.phase*2.7%1)*18,0,7);ctx.stroke();});
    points.forEach((p,i)=>{if(p.z<-.34)return;const active=i===(hover>=0?hover:chosen);ctx.shadowBlur=active?18:8;ctx.shadowColor=active?'#e4f9ff':'#47a9d1';ctx.fillStyle=active?'#e8fbff':'rgba(139,215,247,.75)';ctx.beginPath();ctx.arc(p.x,p.y,(active?3.5:1.8)*p.depth,0,7);ctx.fill();ctx.shadowBlur=0;});
    const shield=[[-.28,-.27],[0,-.37],[.28,-.27],[.25,.05],[.12,.27],[0,.37],[-.12,.27],[-.25,.05]].map(([x,y])=>project({x,y,z:1.13},cx,cy,r));ctx.save();ctx.shadowColor='rgba(98,211,255,.8)';ctx.shadowBlur=24;ctx.beginPath();shield.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.closePath();ctx.fillStyle='rgba(7,20,29,.76)';ctx.fill();ctx.strokeStyle='rgba(151,228,255,.94)';ctx.lineWidth=1.7;ctx.stroke();ctx.shadowBlur=0;ctx.strokeStyle='#8bd7f7';ctx.lineWidth=2.6;ctx.beginPath();ctx.moveTo(cx-r*.1,cy);ctx.lineTo(cx-r*.015,cy+r*.09);ctx.lineTo(cx+r*.13,cy-r*.1);ctx.stroke();ctx.restore();
    if(hover>=0){const p=points[hover];ctx.font='9px DM Mono, monospace';ctx.fillStyle='#c7eaf7';ctx.fillText(`NODE ${vertices[hover].id}`,Math.min(w-100,Math.max(100,p.x+18)),Math.max(22,p.y-17));}frame=requestAnimationFrame(render);
  }
  function hit(x,y){let best=-1,distance=17;points.forEach((p,i)=>{if(p.z<-.34)return;const d=Math.hypot(p.x-x,p.y-y);if(d<distance){best=i;distance=d;}});return best;}
  canvas.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,lx:e.clientX,ly:e.clientY,moved:false};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{const b=canvas.getBoundingClientRect();hover=hit(e.clientX-b.left,e.clientY-b.top);root.classList.toggle('is-over-node',hover>=0);if(!drag)return;const dx=e.clientX-drag.lx,dy=e.clientY-drag.ly;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>4)drag.moved=true;if(drag.moved){yaw+=dx*.008;pitch=Math.max(-1.05,Math.min(1.05,pitch+dy*.006));}drag.lx=e.clientX;drag.ly=e.clientY;});
  canvas.addEventListener('pointerup',e=>{if(drag&&!drag.moved){const b=canvas.getBoundingClientRect();chosen=hit(e.clientX-b.left,e.clientY-b.top);if(chosen>=0){model.textContent=`ENDPOINT NODE ${vertices[chosen].id}`;state.textContent='Encrypted · policy enforced';}}drag=null;});
  canvas.addEventListener('pointercancel',()=>drag=null);canvas.addEventListener('pointerleave',()=>{hover=-1;root.classList.remove('is-over-node');});
  canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(.76,Math.min(1.42,zoom-Math.sign(e.deltaY)*.06));},{passive:false});
  canvas.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')yaw-=.12;else if(e.key==='ArrowRight')yaw+=.12;else if(e.key==='ArrowUp')pitch=Math.max(-1.05,pitch-.1);else if(e.key==='ArrowDown')pitch=Math.min(1.05,pitch+.1);else return;e.preventDefault();});
  root.querySelector('.cyber-scene__reset').addEventListener('click',()=>{yaw=-.42;pitch=.16;zoom=1;chosen=-1;model.textContent='GLOBAL DEFENSE MESH';state.textContent='Threat paths intercepted';});
  const observer=new ResizeObserver(resize);observer.observe(root);resize();frame=requestAnimationFrame(render);addEventListener('pagehide',()=>{cancelAnimationFrame(frame);observer.disconnect();},{once:true});
})();