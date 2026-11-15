/* PLANETDLE Discovery Lab: locally rendered WebGL textured sphere. No external JS dependency. */
(()=>{'use strict';
const modal=document.getElementById('discovery-modal'),canvas=document.getElementById('discovery-canvas'),markers=document.getElementById('discovery-hotspots');
const title=document.getElementById('discovery-title'),intro=document.getElementById('discovery-intro'),feature=document.getElementById('discovery-feature'),spin=document.getElementById('discovery-spin');
const close=document.getElementById('discovery-close');
const sourceLabel=document.getElementById('discovery-texture-source'), loading=document.getElementById('discovery-loading');
const FEATURES={
'Jupiter':[['Great Red Spot','A vast, long-lived storm in Jupiter’s cloud tops.',-12,35],['Cloud bands','East–west jet streams separate Jupiter’s light zones and dark belts.',30,-30]],
'Saturn':[['Ring system','Billions of icy particles orbit Saturn in its extensive ring system.',10,0],['Cloud tops','Saturn has a deep hydrogen–helium atmosphere, not a solid surface.',-20,75]],
'Earth':[['Oceans','Liquid water covers most of Earth’s surface.',0,30],['Atmosphere','Earth’s nitrogen–oxygen atmosphere helps regulate temperature.',30,-50]],
'Mars':[['Olympus Mons','Olympus Mons is the largest known volcano in the Solar System.',18,20],['Polar ice','Mars has polar caps made of water ice and seasonal carbon-dioxide frost.',70,-10]],
'Venus':[['Cloud layer','Thick sulfuric-acid clouds hide the surface from visible-light cameras.',20,20],['Greenhouse effect','Venus’s dense carbon-dioxide atmosphere traps enormous amounts of heat.',-25,-45]],
'Mercury':[['Impact craters','Mercury preserves many craters from billions of years of collisions.',10,15]],
'Uranus':[['Sideways spin','Uranus has an extreme axial tilt of about 98 degrees.',20,0]],
'Neptune':[['High-speed winds','Neptune has some of the fastest winds measured in the Solar System.',10,30]],
'Europa':[['Ice fractures','Europa’s icy crust is crossed by long cracks and ridges.',5,25],['Subsurface ocean','Evidence indicates a global saltwater ocean beneath the ice.',-20,-40]],
'Io':[['Volcanoes','Jupiter’s tidal forces heat Io, powering widespread volcanism.',10,20]],
'Ganymede':[['Magnetic field','Ganymede is the only moon known to generate its own magnetic field.',5,10]],
'Callisto':[['Old craters','Callisto’s ancient surface is densely marked by impacts.',10,15]],
'Titan':[['Methane lakes','Titan has lakes and seas of liquid methane and ethane.',10,30]],
'Enceladus':[['Water plumes','Jets of water-rich material erupt from fractures near its south pole.',-65,20]],
'Pluto':[['Sputnik Planitia','A vast nitrogen-ice plain forms part of Pluto’s bright heart-shaped region.',10,30]],
'Ceres':[['Bright deposits','Occator Crater contains bright salt-rich deposits.',10,15]],
'Bennu':[['Rubble pile','Bennu is a loose collection of rocks and debris held together by gravity.',10,15]],
'Vesta':[['Impact basin','A huge impact basin dominates Vesta’s south polar region.',-55,20]],
"Earth's Moon":[['Lunar maria','The dark lunar plains are ancient basaltic lava flows.',10,15]],
'Phobos':[['Stickney crater','A large impact crater dominates one end of this irregular moon.',10,25]],
"Halley's Comet":[['Icy nucleus','Solar heating releases gas and dust when the comet approaches the Sun.',10,20]]
};
let loadSerial=0, markerLast=0, focusBefore=null;
let gl,prog,buffer,texture,loc={},active=false,auto=true,lon=0,lat=.12,scale=.78,prev=0,raf=0,drag=false,lastX=0,lastY=0,hotspots=[],currentName='';
const vert='attribute vec2 p;varying vec2 uv;void main(){uv=p;gl_Position=vec4(p,0.,1.);}';
const frag=`precision highp float;varying vec2 uv;uniform sampler2D tex;uniform float yaw;uniform float pitch;uniform float radius;uniform float rings;uniform float aspect;uniform vec3 base;
const float PI=3.141592653589793;
void main(){vec2 q=vec2(uv.x*aspect,uv.y)/radius;float d=dot(q,q);vec3 col=vec3(.018,.034,.066);if(d<=1.){vec3 n=vec3(q.x,q.y,sqrt(1.-d));float cy=cos(yaw),sy=sin(yaw),cp=cos(pitch),sp=sin(pitch);vec3 a=vec3(cy*n.x+sy*n.z,n.y,-sy*n.x+cy*n.z);vec3 v=vec3(a.x,cp*a.y-sp*a.z,sp*a.y+cp*a.z);float u=atan(v.x,v.z)/(2.*PI)+.5;float t=asin(clamp(v.y,-1.,1.))/PI+.5;vec3 surface=texture2D(tex,vec2(fract(u),1.-t)).rgb;float light=max(.13,dot(n,normalize(vec3(-.48,.55,.85))));col=surface*(.24+.78*light);float edge=pow(1.-sqrt(max(0.,1.-d)),3.);col+=base*edge*.24;}else if(rings>.5){float rr=length(vec2(q.x,q.y*2.7));if(rr>1.13&&rr<1.67&&abs(q.y)<.7){float alpha=.22+.25*sin(rr*65.)*sin(rr*19.);col=mix(col,vec3(.76,.66,.48),clamp(alpha,0.,.65));}}gl_FragColor=vec4(col,1.);}`;
function shader(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
function init(){gl=canvas.getContext('webgl',{alpha:false,antialias:true,preserveDrawingBuffer:false});if(!gl)return false;prog=gl.createProgram();gl.attachShader(prog,shader(gl.VERTEX_SHADER,vert));gl.attachShader(prog,shader(gl.FRAGMENT_SHADER,frag));gl.linkProgram(prog);if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(prog));gl.useProgram(prog);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const a=gl.getAttribLocation(prog,'p');gl.enableVertexAttribArray(a);gl.vertexAttribPointer(a,2,gl.FLOAT,false,0,0);for(const k of ['yaw','pitch','radius','rings','aspect','base','tex'])loc[k]=gl.getUniformLocation(prog,k);gl.uniform1i(loc.tex,0);texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);return true;}
function render(now){if(!active)return;const dt=Math.min(.05,(now-prev)/1000||0);prev=now;if(auto&&!drag)lon+=dt*.16;const w=canvas.clientWidth,h=canvas.clientHeight,dpr=Math.min(devicePixelRatio||1,2);const pw=Math.round(w*dpr),ph=Math.round(h*dpr);if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;gl.viewport(0,0,pw,ph);}gl.useProgram(prog);gl.uniform1f(loc.yaw,lon);gl.uniform1f(loc.pitch,lat);gl.uniform1f(loc.radius,scale);gl.uniform1f(loc.aspect,w/Math.max(h,1));gl.uniform1f(loc.rings,currentName==='Saturn'?1:0);gl.uniform3f(loc.base,.18,.4,.7);gl.drawArrays(gl.TRIANGLES,0,6);if(now-markerLast>65){placeMarkers(w,h);markerLast=now;}raf=requestAnimationFrame(render);}
// Build stable hotspot buttons once per selection. Recreating them on every
// animation frame made them nearly impossible to click or focus with a keyboard.
let markerButtons=[];
function buildMarkers(){
  markers.replaceChildren();
  markerButtons=hotspots.map(([name,description])=>{
    const button=document.createElement('button');
    button.type='button';button.className='discovery-marker';
    button.setAttribute('aria-label','Learn about '+name);button.title=name;
    button.textContent='+';
    button.addEventListener('click',()=>{
      feature.replaceChildren();
      const title=document.createElement('strong');title.textContent=name;
      const paragraph=document.createElement('p');paragraph.textContent=description;
      feature.append(title,paragraph);
    });
    markers.append(button);
    return button;
  });
}
function placeMarkers(w,h){
  hotspots.forEach(([, ,latitude,longitude],i)=>{
    const button=markerButtons[i];if(!button)return;
    const a=longitude*Math.PI/180+lon,b=latitude*Math.PI/180;
    const x=Math.sin(a)*Math.cos(b),z=Math.cos(a)*Math.cos(b),y=Math.sin(b);
    const yp=Math.cos(lat)*y+Math.sin(lat)*z,zp=-Math.sin(lat)*y+Math.cos(lat)*z;
    button.hidden=zp<.17;
    if(button.hidden)return;
    button.style.left=(50+x*scale*50*h/w)+'%';
    button.style.top=(50-yp*scale*50)+'%';
  });
}

function setTexture(source) {
  const glCanvas=document.createElement('canvas');glCanvas.width=1024;glCanvas.height=512;
  const ctx=glCanvas.getContext('2d');
  ctx.drawImage(source,0,0,glCanvas.width,glCanvas.height);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,glCanvas);
}
function open(name,description,surface,color){
  const serial=++loadSerial;
  focusBefore=document.activeElement;
  currentName=name;
  title.textContent=name+' · 3D Discovery';intro.textContent=description;
  feature.textContent='Select a glowing marker on the globe to learn about a feature.';
  hotspots=FEATURES[name]||[];lon=0;lat=.12;scale=.78;auto=true;buildMarkers();
  spin.textContent='Pause rotation';
  modal.classList.add('is-open');modal.setAttribute('aria-hidden','false');
  document.body.classList.add('discovery-open');close.focus();
  loading.classList.remove('hidden');loading.textContent='Preparing interactive globe…';
  try {
    if(!gl&&!init())throw Error('WebGL unavailable');
    // Draw a clearly labelled neutral globe immediately: the scientific texture
    // is loaded lazily and replaces it only after validation and decoding.
    setTexture(surface);
    sourceLabel.textContent='Untextured globe while checking for a scientific map.';
    active=true;prev=0;cancelAnimationFrame(raf);raf=requestAnimationFrame(render);
    const picture = new Image();
    picture.onload=()=>{
      if(serial!==loadSerial||!active)return;
      try {setTexture(picture);sourceLabel.textContent=['Io','Europa','Ganymede','Callisto'].includes(name) ? 'NASA/JPL/USGS Voyager/Galileo global mosaic. Gaps and colour limitations remain; see TEXTURE_SOURCES.md.' : ['Ceres','Vesta','Bennu','Pluto','Titan','Phobos','Enceladus'].includes(name) ? 'Mission imagery mosaic. Coverage and processing vary by world; see TEXTURE_SOURCES.md.' : 'Scientific base-colour map: Solar System Scope (NASA-derived imagery), CC BY 4.0. Colours and missing areas may be reconstructed; see TEXTURE_SOURCES.md.';
      } catch(e) {console.warn('Scientific texture upload failed',e);}
      loading.classList.add('hidden');
    };
    picture.onerror=()=>{
      if(serial!==loadSerial||!active)return;
      loading.classList.add('hidden');
      sourceLabel.textContent='Neutral untextured globe. A scientific global map for this object could not be loaded.';
    };
    picture.src='/api/texture/'+encodeURIComponent(name);
  } catch(e) {
    loading.classList.add('hidden');
    feature.textContent='3D rendering requires WebGL. The 2D map, profile and NASA photographs remain available.';
    console.error(e);
  }
}
function dismiss(){++loadSerial;active=false;cancelAnimationFrame(raf);modal.classList.remove('is-open');modal.setAttribute('aria-hidden','true');document.body.classList.remove('discovery-open');if(focusBefore&&focusBefore.isConnected)focusBefore.focus();}
close.addEventListener('click',dismiss);modal.addEventListener('click',e=>{if(e.target===modal)dismiss();});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&modal.classList.contains('is-open'))dismiss();});spin.addEventListener('click',()=>{auto=!auto;spin.textContent=auto?'Pause rotation':'Resume rotation';});
canvas.addEventListener('pointerdown',e=>{drag=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);});canvas.addEventListener('pointermove',e=>{if(!drag)return;lon+=(e.clientX-lastX)*.009;lat=Math.max(-1.45,Math.min(1.45,lat+(e.clientY-lastY)*.009));lastX=e.clientX;lastY=e.clientY;});canvas.addEventListener('pointerup',()=>drag=false);canvas.addEventListener('pointercancel',()=>drag=false);canvas.addEventListener('wheel',e=>{e.preventDefault();scale=Math.max(.35,Math.min(.94,scale*(e.deltaY>0?.91:1.09)));},{passive:false});
window.PlanetDiscovery={open,features:name=>FEATURES[name]||[]};
})();
