/* PLANETDLE 3D atlas: GPU-projected genuine global maps on moving globes.
   Each world is rendered as a sphere in its *existing* map position. No fictional
   terrain is synthesized when a source map is unavailable. */
(function(){'use strict';
const base=document.getElementById('solar-map'),stage=document.getElementById('map-stage');
if(!base||!stage)return;
const overlay=document.createElement('canvas');overlay.id='atlas-globes';overlay.setAttribute('aria-hidden','true');stage.append(overlay);
const inspecting=document.createElement('section');inspecting.id='atlas-inspector';inspecting.className='atlas-inspector';
inspecting.innerHTML='<canvas id="atlas-inspector-canvas"></canvas><div class="atlas-inspector-help">Drag to rotate · Scroll to zoom · Enlarged close-up</div><p class="atlas-inspector-source"></p><div class="atlas-field-notes"></div>';
const inspectorCanvas=inspecting.querySelector('canvas');
const sourceText=inspecting.querySelector('p');
const fieldNotes=inspecting.querySelector('.atlas-field-notes');
const previews=new Map();
let motionEnabled=true, animationTime=0;
const names=new Set(['Mercury','Venus','Earth','Mars','Jupiter','Saturn','Uranus','Neptune',"Earth's Moon",'Io','Europa','Ganymede','Callisto','Phobos','Enceladus','Titan','Ceres','Vesta','Pluto','Bennu']);
const meshFiles={Pluto:'pluto',Bennu:'bennu',Vesta:'vesta',Ceres:'ceres',Phobos:'phobos',"Halley's Comet":'halley'};
const meshes=new Map();
const requestedMeshes=new Set();
function requestMesh(name){
  if(!meshFiles[name]||requestedMeshes.has(name))return;
  requestedMeshes.add(name);
  fetch('/static/planet_maps/'+meshFiles[name]+'-mesh.bin?v=shapes-2').then(response=>{
    if(!response.ok)throw Error(name+' geometry unavailable');
    return response.arrayBuffer();
  }).then(bytes=>{
    const [vertices,indices]=new Uint32Array(bytes,0,2);
    if(bytes.byteLength!==8+vertices*32+indices*2)throw Error('Invalid geometry for '+name);
    meshes.set(name,{bytes,vertices,indices});
    updateSource();
  }).catch(error=>console.warn(error.message));
}
const cache=new Map();let world='',gl,smallGl,hasGL=false,lon=0,pitch=.12,inspectionZoom=.76,drag=false,lastX=0,lastY=0,paused=false,prior=0;
const vertex='attribute vec2 p; varying vec2 coord; void main(){coord=p;gl_Position=vec4(p,0.,1.);}';
const fragment=`precision highp float;varying vec2 coord;uniform sampler2D map;uniform float yaw,pitch,usingMap,rings,extent,shape,tailAngle,colorBalance,effectTime,tailOnly,polarRatio,axisAngle;uniform vec3 base;
const float PI=3.141592653589793;
void main(){
vec2 point=coord*extent;
float ca=cos(axisAngle),sa=sin(axisAngle);
vec2 body=mat2(ca,-sa,sa,ca)*point;
body.y/=polarRatio;
float angle=atan(point.y,point.x);
if(shape>4.5){
  body.y/=.93;
}else if(shape>3.5){
  body/=vec2(1.02+.16*cos(yaw),.50);
  body.y-=.14*sin(body.x*2.8+yaw);
  body*=1.+.10*cos(angle*3.+yaw)+.065*sin(angle*7.-yaw)+.025*cos(angle*13.+yaw);
}else if(shape>2.5){
  body/=vec2(1.,.80);
  body*=1.+.07*cos(angle*3.+yaw)+.04*sin(angle*7.-yaw);
}else if(shape>1.5){
  body/=vec2(.92+.17*cos(yaw),.70);
  body*=1.+.11*cos(angle*3.+yaw)+.05*sin(angle*5.-yaw);
}else if(shape>.5){
  body/=vec2(1.,.86);
  body*=1.+.12*abs(sin(angle*2.+yaw*.2))+.035*cos(angle*5.+yaw);
}
float r2=dot(body,body);
// A tilted ring plane has its own depth. The globe eclipses the rear arcs.
vec4 ring=vec4(0.);
if(rings>0.){
  float tilt=axisAngle;
  float c=cos(tilt),s=sin(tilt);
  vec2 q=mat2(c,-s,s,c)*point;
  float opening=clamp((rings>1.5?.23:.39)+pitch*.24,.15,.72);
  float rr=length(vec2(q.x,q.y/opening));
  float depth=-q.y*sqrt(1.-opening*opening)/opening;
  float visible=step(1.,r2)+step(sqrt(max(0.,1.-r2)),depth);
  float edge=smoothstep(1.20,1.24,rr)*(1.-smoothstep(2.16,2.20,rr));
  float gap=smoothstep(.022,.047,abs(rr-1.83));
  // Ring particles orbit their host planet: radial lanes stay anchored to the
  // globe, while fine azimuthal detail drifts at radius-dependent speeds.
  // This is a visual approximation of differential Keplerian motion, not
  // a rigid plate rotating with the atmospheric surface.
  float phase=atan(q.y/opening,q.x);
  float orbitalRate=(rings>1.5?1.12:.64)/pow(max(rr,1.0),1.5);
  float movingGrains=sin(phase*33.-effectTime*orbitalRate*33.);
  float bands=.72+.095*sin(rr*38.)+.043*sin(rr*125.)+.07*movingGrains*sin(rr*91.);

  if(rings>1.5){
    edge=exp(-pow(abs(rr-1.61)*36.,2.))*.54+exp(-pow(abs(rr-1.82)*30.,2.))*.37;
    gap=1.;
  }
  vec3 ringColor=rings>1.5?vec3(.62,.75,.77):vec3(.88,.79,.64);
  float shadow=1.-.75*smoothstep(.82,.98,-q.x)*(1.-smoothstep(.34,.68,abs(q.y)));
  ring=vec4(ringColor*bands*shadow,clamp(visible,0.,1.)*edge*gap*.90);
}
if(r2>1.||tailOnly>.5){
  if(ring.a>.001){gl_FragColor=ring;return;}
  if(shape>3.5&&shape<4.5){
    vec2 dir=vec2(cos(tailAngle),sin(tailAngle));
    float along=dot(point,dir), across=dot(point,vec2(-dir.y,dir.x));
    float ripple=sin(along*8.-effectTime*6.)*.032;
    float streak=across-.115*along*along-ripple;
    float plume=exp(-pow(abs(streak)/(.16+max(along,0.)*.24),2.));
    float ion=exp(-pow(abs(across+.08*along)/(.08+max(along,0.)*.07),2.));
    float fade=smoothstep(.32,.86,along)*(1.-smoothstep(1.2,4.35,along));
    float dustPulse=.78+.22*sin(along*11.-effectTime*7.+across*8.);
    float grains=pow(max(0.,sin(along*34.-effectTime*13.)*cos(across*42.+effectTime*2.)),8.);
    float dustGrains=grains*plume*.3;
    float jet=exp(-pow(abs(across-.27*along+.16)/.065,2.))*(1.-smoothstep(.8,1.75,along));
    float coma=.25*(1.-smoothstep(.63,1.50,length(point)));
    vec3 color=mix(vec3(.69,.82,1.),vec3(.95,.86,.69),plume*.66);
    gl_FragColor=vec4(color,clamp((plume*.93*dustPulse+ion*.76+dustGrains+jet*.43)*fade+coma,0.,.95));return;
  }
  discard;
}
vec3 n=vec3(body.x,body.y,sqrt(max(0.,1.-r2)));float cy=cos(yaw),sy=sin(yaw),cp=cos(pitch),sp=sin(pitch);
vec3 a=vec3(n.x,cp*n.y-sp*n.z,sp*n.y+cp*n.z);
vec3 v=vec3(cy*a.x+sy*a.z,a.y,-sy*a.x+cy*a.z);
vec2 uv=vec2(fract(atan(v.x,v.z)/(2.*PI)+.5),1.-(asin(clamp(v.y,-1.,1.))/PI+.5));
vec3 albedo=usingMap>.5?texture2D(map,uv).rgb:base;
// Display lighting keeps texture detail readable around the visible limb.
if(shape>3.5&&shape<4.5){
  float detail=sin(v.x*47.+v.z*54.)*sin(v.y*63.+v.z*38.);
  albedo=vec3(.25,.24,.22)*(.78+.22*detail);
}
if(colorBalance>.5){
  float luminance=dot(albedo,vec3(.2126,.7152,.0722));
  albedo=mix(albedo,clamp(vec3(.43,.64,.70)+(luminance-.38)*.62,0.,1.),.76);
}
float light=.50+.50*max(0.,dot(n,normalize(vec3(-.38,.34,.92))));
gl_FragColor=vec4(mix(albedo*light,ring.rgb,ring.a),1.);}`;
function makeContext(canvas){let g=canvas.getContext('webgl',{alpha:true,depth:true,antialias:true,premultipliedAlpha:false});if(!g)return null;
function compile(type,src){const sh=g.createShader(type);g.shaderSource(sh,src);g.compileShader(sh);if(!g.getShaderParameter(sh,g.COMPILE_STATUS))throw Error(g.getShaderInfoLog(sh));return sh;}
const program=g.createProgram();g.attachShader(program,compile(g.VERTEX_SHADER,vertex));g.attachShader(program,compile(g.FRAGMENT_SHADER,fragment));g.linkProgram(program);if(!g.getProgramParameter(program,g.LINK_STATUS))throw Error(g.getProgramInfoLog(program));g.useProgram(program);
const buf=g.createBuffer();g.bindBuffer(g.ARRAY_BUFFER,buf);g.bufferData(g.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),g.STATIC_DRAW);
const a=g.getAttribLocation(program,'p');g.enableVertexAttribArray(a);g.vertexAttribPointer(a,2,g.FLOAT,false,0,0);
const loc={};for(const k of ['yaw','pitch','usingMap','rings','extent','shape','tailAngle','colorBalance','effectTime','tailOnly','polarRatio','axisAngle','base','map'])loc[k]=g.getUniformLocation(program,k);
g.uniform1i(loc.map,0);g.enable(g.BLEND);g.blendFunc(g.SRC_ALPHA,g.ONE_MINUS_SRC_ALPHA);
const placeholder=g.createTexture();g.bindTexture(g.TEXTURE_2D,placeholder);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,1,1,0,g.RGBA,g.UNSIGNED_BYTE,new Uint8Array([195,195,195,255]));
return {g,loc,program,compile,quad:buf,quadLocation:a,placeholder,textures:new Map()};}
try{gl=makeContext(overlay);smallGl=makeContext(inspectorCanvas);hasGL=!!gl&&!!smallGl;}catch(e){console.warn('Map WebGL unavailable, using accessible 2D view',e);hasGL=false;}
if(!hasGL){overlay.remove();}
function useFallback(){hasGL=false;overlay.hidden=true;}
overlay.addEventListener('webglcontextlost',useFallback);
inspectorCanvas.addEventListener('webglcontextlost',()=>{smallGl=null;updateSource();});
function getTexture(c,name){if(!names.has(name))return null;
const entry=cache.get(name);if(!entry||entry.status!=='ready')return null;
if(c.textures.has(name))return c.textures.get(name);
const {g}=c;const t=g.createTexture();g.bindTexture(g.TEXTURE_2D,t);g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL,false);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_S,name==="Vesta"?g.REPEAT:g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_WRAP_T,g.CLAMP_TO_EDGE);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MIN_FILTER,g.LINEAR);g.texParameteri(g.TEXTURE_2D,g.TEXTURE_MAG_FILTER,g.LINEAR);g.texImage2D(g.TEXTURE_2D,0,g.RGBA,g.RGBA,g.UNSIGNED_BYTE,entry.image);c.textures.set(name,t);return t;}
function requestMap(name){requestMesh(name);if(!names.has(name)||cache.has(name))return;
cache.set(name,{status:'loading'});
const img=new Image();img.onload=()=>{cache.set(name,{status:'ready',image:img});updateSource();};
img.onerror=()=>{cache.set(name,{status:'missing'});updateSource();};
img.src='/api/texture/'+encodeURIComponent(name)+(meshFiles[name]?'?v=shapes-2':'');
}
function updateSource(){if(!world)return;const status=cache.get(world)?.status;
if(!smallGl){sourceText.textContent='Interactive 3D requires WebGL.';return;}
const captions={
    Pluto:'NASA VTAD Pluto model · Southern detail is approximate',
    Bennu:'NASA VTAD Bennu shape model',
    Vesta:'NASA VTAD Vesta shape model',
    Ceres:'NASA VTAD Ceres model',
    Phobos:'NASA/JPL-Caltech Phobos shape model',
    Neptune:'Atmospheric map · Color adjusted toward Voyager’s reprocessed colors',
    Uranus:'Atmospheric map · Subtle cloud bands',
    Venus:'Cloud-top map · Visible atmosphere',
    Titan:'Cassini near-infrared surface mosaic',
    Enceladus:'Cassini global mosaic',
    Callisto:'Galileo and Voyager global mosaic'
  };
  sourceText.textContent=world==="Halley's Comet"&&meshes.has(world)?'Stooke nucleus model from Giotto and Vega data · Animated tail illustration':status==='ready'?(captions[world]||'Spacecraft-derived surface map'):status==='loading'?'Loading scientific texture…':world==="Halley's Comet"?'Illustrative model based on Giotto observations · Tail shown when active':'Surface map unavailable.';}
const displayColors={Mercury:'#aaa6a3',Venus:'#d9bd8f',Earth:'#4785bd',Mars:'#c97f59',Jupiter:'#caa987',Saturn:'#d7c39e',Uranus:'#8bcbd0',Neptune:'#78a3ae',Pluto:'#b5a79e',Ceres:'#999897',Bennu:'#99918c',Vesta:'#9f9994',Io:'#d0ad6c',Europa:'#d8cec0',Ganymede:'#a99a8c',Callisto:'#837b72',Titan:'#d5a261',Enceladus:'#c8dae1',Phobos:'#9b8f7f',"Earth's Moon":'#b0b0ae',"Halley's Comet":'#8999a9'};
function colorRgb(name){const x=(displayColors[name]||'#a7abb1').replace('#','');return [0,2,4].map(i=>parseInt(x.slice(i,i+2),16)/255);}
const shapes={Bennu:1,Phobos:2,Vesta:3,"Halley's Comet":4,Ceres:5};
// Binary views are the position, normal, UV and index arrays from NASA's GLB.
function drawMesh(context,name,texture,yaw,pitch){
  const {bytes,vertices,indices:count}=meshes.get(name);
  context.models??=new Map();
  const {g,compile}=context;
  if(!context.models.has(name)){
    const program=g.createProgram();
    g.attachShader(program,compile(g.VERTEX_SHADER,`
      attribute vec3 position,normal;
      attribute vec2 uv;
      uniform float yaw,pitch;
      varying vec2 texCoord;
      varying vec3 surfaceNormal;
      vec3 orient(vec3 p){
        float c=cos(yaw),s=sin(yaw),a=cos(pitch),b=sin(pitch);
        vec3 q=vec3(c*p.x+s*p.z,p.y,-s*p.x+c*p.z);
        return vec3(q.x,a*q.y-b*q.z,b*q.y+a*q.z);
      }
      void main(){
        vec3 p=orient(position);
        gl_Position=vec4(p.xy,-p.z*.95,1.);
        texCoord=uv;
        surfaceNormal=orient(normal);
      }
    `));
    g.attachShader(program,compile(g.FRAGMENT_SHADER,`
      precision mediump float;
      uniform sampler2D surface;
      uniform float textured;
      uniform float cometNucleus;
      varying vec2 texCoord;
      varying vec3 surfaceNormal;
      void main(){
        float light=.55+.45*max(0.,dot(normalize(surfaceNormal),normalize(vec3(-.38,.34,.92))));
        gl_FragColor=vec4(mix(mix(vec3(.25,.23,.20),vec3(.105,.095,.083),cometNucleus),texture2D(surface,texCoord).rgb,textured)*light,1.);
      }
    `));
    g.linkProgram(program);
    if(!g.getProgramParameter(program,g.LINK_STATUS))throw Error(g.getProgramInfoLog(program));
    const attributes=[
      ['position',3,new Float32Array(bytes,8,vertices*3)],
      ['normal',3,new Float32Array(bytes,8+vertices*12,vertices*3)],
      ['uv',2,new Float32Array(bytes,8+vertices*24,vertices*2)]
    ].map(([name,components,data])=>{
      const buffer=g.createBuffer();
      g.bindBuffer(g.ARRAY_BUFFER,buffer);
      g.bufferData(g.ARRAY_BUFFER,data,g.STATIC_DRAW);
      return {location:g.getAttribLocation(program,name),components,buffer};
    });
    const indices=g.createBuffer();
    g.bindBuffer(g.ELEMENT_ARRAY_BUFFER,indices);
    g.bufferData(g.ELEMENT_ARRAY_BUFFER,new Uint16Array(bytes,8+vertices*32,count),g.STATIC_DRAW);
    context.models.set(name,{program,attributes,indices,yaw:g.getUniformLocation(program,'yaw'),pitch:g.getUniformLocation(program,'pitch'),textured:g.getUniformLocation(program,'textured'),cometNucleus:g.getUniformLocation(program,'cometNucleus')});
  }
  const model=context.models.get(name);
  g.useProgram(model.program);
  g.bindTexture(g.TEXTURE_2D,texture||context.placeholder);
  g.uniform1f(model.textured,texture?1:0);
  g.uniform1f(model.cometNucleus,name==="Halley's Comet"?1:0);
  for(const {location,components,buffer} of model.attributes){
    g.bindBuffer(g.ARRAY_BUFFER,buffer);
    g.enableVertexAttribArray(location);
    g.vertexAttribPointer(location,components,g.FLOAT,false,0,0);
  }
  g.bindBuffer(g.ELEMENT_ARRAY_BUFFER,model.indices);
  g.uniform1f(model.yaw,yaw);
  g.uniform1f(model.pitch,pitch);
  g.enable(g.DEPTH_TEST);
  g.clear(g.DEPTH_BUFFER_BIT);
  g.drawElements(g.TRIANGLES,count,g.UNSIGNED_SHORT,0);
  g.disable(g.DEPTH_TEST);
  for(const {location} of model.attributes)g.disableVertexAttribArray(location);
}
const polarRatios={Jupiter:.9351,Saturn:.9020,Uranus:.9771,Neptune:.9829,Earth:.9966,Mars:.9941};
const axisAngles={Earth:23.4,Mars:25.2,Jupiter:3.1,Saturn:26.7,Uranus:97.8,Neptune:28.3};
function drawSphere(c,name,x,y,r,yaw,p=0,tailAngle=.35,effectTime=0){const {g,loc}=c;const rgba=colorRgb(name),ringed=name==="Saturn"||name==="Uranus";
const shape=shapes[name]||0;
const extent=shape===4?4.45:ringed?2.22:shape?1.25:1,half=r*extent,s=Math.max(2,Math.round(half*2)),vx=Math.round(x-half),vy=Math.round(y-half);
if(vx+s<0||vy+s<0||vx>g.drawingBufferWidth||vy>g.drawingBufferHeight)return;
g.viewport(vx,vy,s,s);const tex=getTexture(c,name);
if(shape!==4&&meshes.has(name)&&tex){g.viewport(Math.round(x-r),Math.round(y-r),Math.round(2*r),Math.round(2*r));drawMesh(c,name,tex,yaw,p);return;}
g.useProgram(c.program);
g.bindBuffer(g.ARRAY_BUFFER,c.quad);
g.enableVertexAttribArray(c.quadLocation);
g.vertexAttribPointer(c.quadLocation,2,g.FLOAT,false,0,0);
g.activeTexture(g.TEXTURE0);g.bindTexture(g.TEXTURE_2D,tex||c.placeholder);
g.uniform1f(loc.polarRatio,polarRatios[name]||1);g.uniform1f(loc.axisAngle,(axisAngles[name]||0)*Math.PI/180);
g.uniform1f(loc.yaw,yaw);g.uniform1f(loc.pitch,p);g.uniform1f(loc.usingMap,tex?1:0);g.uniform1f(loc.rings,name==="Uranus"?2:ringed?1:0);g.uniform1f(loc.extent,extent);g.uniform1f(loc.shape,shape);g.uniform1f(loc.tailAngle,tailAngle);g.uniform1f(loc.effectTime,effectTime%1000);g.uniform1f(loc.tailOnly,shape===4&&meshes.has(name)?1:0);g.uniform1f(loc.colorBalance,name==="Neptune"?1:0);g.uniform3fv(loc.base,rgba);g.drawArrays(g.TRIANGLES,0,6);
if(shape===4&&meshes.has(name)){
  g.viewport(Math.round(x-r),Math.round(y-r),Math.round(2*r),Math.round(2*r));
  drawMesh(c,name,null,yaw,p);
}
}
function size(c,canvas,w,h){const dpr=Math.min(devicePixelRatio||1,2),pw=Math.max(1,Math.round(w*dpr)),ph=Math.max(1,Math.round(h*dpr));if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;}c.g.viewport(0,0,pw,ph);return dpr;}
const spinRates={Mercury:.29,Venus:-.26,Earth:.55,Mars:.51,Jupiter:.82,Saturn:.76,Uranus:-.51,Neptune:.55};
function spinRate(name){return spinRates[name]||.38;}
function surfaceMap(name){requestMap(name);return cache.get(name)?.image;}
function drawAtlas(positions,time){if(!hasGL)return;const w=base.clientWidth,h=base.clientHeight;if(!w||!h)return;
const dpr=size(gl,overlay,w,h),g=gl.g;g.clearColor(0,0,0,0);g.clear(g.COLOR_BUFFER_BIT);
for(const [name,pos] of Object.entries(positions)){if(name==='Sun')continue;requestMap(name);const radius=pos.visualR||Math.max(7,pos.r-4);drawSphere(gl,name,pos.x*dpr,(h-pos.y)*dpr,radius*dpr,time*spinRate(name)+(name==='Pluto'?.11:0),name==='Pluto'?.28:.12,Math.atan2(positions.Sun.y-pos.y,pos.x-positions.Sun.x),time);}
}
function drawInspect(delta){if(!smallGl||!inspecting.isConnected||!world)return;const rect=inspectorCanvas.getBoundingClientRect();if(rect.bottom<0||rect.top>innerHeight)return;const w=inspectorCanvas.clientWidth,h=inspectorCanvas.clientHeight;if(!w||!h)return;const dpr=size(smallGl,inspectorCanvas,w,h),g=smallGl.g;g.clearColor(.02,.04,.08,1);g.clear(g.COLOR_BUFFER_BIT);if(!drag&&!paused)lon+=delta*spinRate(world);
const r=previewRadius(world,w,h)*inspectionZoom*dpr;drawSphere(smallGl,world,w*.5*dpr,h*.5*dpr,r,lon,pitch,.35,animationTime);
}
function previewRadius(name,w,h){
  const horizontal=name==="Halley's Comet"?6.25:(name==='Saturn'||name==='Uranus'?4.55:2.3);
  return Math.min(w/horizontal,h/(name==='Uranus'?4.1:2.3));
}
function frame(now){
  {
    const delta=Math.min(.05,(now-prior)/1000);
    if(motionEnabled)animationTime+=delta;
    drawInspect(delta);
    for(const [canvas,preview] of previews){
      if(!canvas.isConnected){previews.delete(canvas);continue;}
      const bounds=canvas.getBoundingClientRect();
      if(bounds.bottom<0||bounds.top>innerHeight)continue;
      drawPreview(canvas,preview);
    }
    prior=now;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
// Draw immediately on selection, as well as on animation frames. The canvas is
// cleared before each new body so a previously inspected Moon never persists.
function drawPreview(canvas,entry){
  const {context,name}=entry;
  const w=canvas.clientWidth,h=canvas.clientHeight;
  if(!context||!w||!h||!canvas.getClientRects().length)return;
  const dpr=size(context,canvas,w,h),g=context.g;
  g.clearColor(0,0,0,0);g.clear(g.COLOR_BUFFER_BIT|g.DEPTH_BUFFER_BIT);
  drawSphere(context,name,w*.5*dpr,h*.5*dpr,previewRadius(name,w,h)*dpr,animationTime*.65,.12,.35,animationTime);
}
function preview(canvas,name){
  if(!canvas||!name)return;
  const old=previews.get(canvas);
  const context=old?.context||makeContext(canvas);
  canvas.setAttribute('data-displayed-world',name);
  canvas.setAttribute('aria-label',name==="Halley's Comet"?'Rotating irregular nucleus of Halley’s Comet with a visible illustrative dust and ion tail':'Rotating model of '+name);
  let fallback=canvas.nextElementSibling;
  if(!fallback?.classList.contains('model-fallback')){
    fallback=document.createElement('p');fallback.className='model-fallback';canvas.after(fallback);
  }
  if(!context){
    previews.delete(canvas);canvas.hidden=true;
    fallback.textContent=name==="Halley's Comet"?'Halley’s Comet — irregular comet nucleus and dust tail (3D requires WebGL).':name+' — 3D model requires WebGL in this browser.';
    fallback.hidden=false;return;
  }
  canvas.hidden=false;fallback.hidden=true;
  // Overwrite the old preview identity, including when another object had
  // already been displayed in this exact result canvas.
  const entry={context,name};previews.set(canvas,entry);
  requestMap(name);
  drawPreview(canvas,entry);
}
function inspect(name){
  world=name;touches.clear();pinchDistance=0;drag=false;lon=name==='Pluto'?.11:0;pitch=name==='Pluto'?.28:.12;inspectionZoom=1;
  inspectorCanvas.setAttribute('aria-label','Interactive 3D model of '+name);
  inspecting.classList.toggle('webgl-unavailable',!smallGl);
  requestMap(name);updateSource();
  fieldNotes.replaceChildren();
  for(const [label,note] of window.PlanetDiscovery?.features(name)||[]){
    const entry=document.createElement('details');
    const summary=document.createElement('summary');
    summary.textContent=label;
    const text=document.createElement('p');
    text.textContent=note;
    entry.append(summary,text);
    fieldNotes.append(entry);
  }
  return inspecting;
}
const touches=new Map();
let pinchDistance=0;
inspectorCanvas.addEventListener('pointerdown',e=>{
  if(e.pointerType==='mouse' && e.button!==0)return;
  e.preventDefault();
  touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
  drag=true;lastX=e.clientX;lastY=e.clientY;
  inspectorCanvas.setPointerCapture(e.pointerId);
  if(touches.size===2){
    const [a,b]=[...touches.values()];
    pinchDistance=Math.hypot(a.x-b.x,a.y-b.y);
  }
});
inspectorCanvas.addEventListener('pointermove',e=>{
  if(!touches.has(e.pointerId))return;
  touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(touches.size===2){
    const [a,b]=[...touches.values()];
    const distance=Math.hypot(a.x-b.x,a.y-b.y);
    if(pinchDistance>0)inspectionZoom=Math.max(.5,Math.min(2.5,inspectionZoom*distance/pinchDistance));
    pinchDistance=distance;
  }else{
    const sensitivity=2*Math.PI/Math.max(240,inspectorCanvas.clientWidth);
    lon-=(e.clientX-lastX)*sensitivity;
    pitch=Math.max(-1.5,Math.min(1.5,pitch+(e.clientY-lastY)*sensitivity));
  }
  lastX=e.clientX;lastY=e.clientY;
  drawInspect(0);
});
function releasePointer(e){
  touches.delete(e.pointerId);
  drag=touches.size>0;pinchDistance=0;
  if(drag){const point=[...touches.values()][0];lastX=point.x;lastY=point.y;}
}
inspectorCanvas.addEventListener('pointerup',releasePointer);
inspectorCanvas.addEventListener('pointercancel',releasePointer);
inspectorCanvas.addEventListener('lostpointercapture',releasePointer);
inspectorCanvas.addEventListener('wheel',e=>{e.preventDefault();inspectionZoom=Math.max(.5,Math.min(2.5,inspectionZoom*Math.exp(-e.deltaY*.001)));drawInspect(0);},{passive:false});
const controls=document.createElement('div');
controls.className='inspector-controls';
const spinButton=document.createElement('button');
spinButton.type='button';spinButton.textContent='Pause rotation';
spinButton.addEventListener('click',()=>{
  paused=!paused;spinButton.textContent=paused?'Resume rotation':'Pause rotation';
});
const resetButton=document.createElement('button');
resetButton.type='button';resetButton.textContent='Reset view';
resetButton.addEventListener('click',()=>{lon=0;pitch=.12;inspectionZoom=1;drawInspect(0);});
controls.append(spinButton,resetButton);
inspectorCanvas.after(controls);
window.PlanetAtlas3D={get available(){return hasGL;},draw:drawAtlas,inspect,preview,surfaceMap,spinRate,setMotionEnabled:enabled=>{motionEnabled=enabled;},hasRealMap:name=>cache.get(name)?.status==='ready'};
})();



