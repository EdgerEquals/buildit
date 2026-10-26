/* LOGO SOUND ENGINE (this page's own copy of the Kids Club logo engine, v3 shape; logo sound and motion standard,
   /home/box/.config/logo-sound-motion-spec.md on the box). Changes only through this page's bot; never loads another page's files.
   ARCHITECTURE  [Sequencer] -> MIDI events -> [ToneRenderer]. The sequencer is pure JS on the phi grid + the eight-stage ladder
   (free-wheel rule 6: coupled damped glides, soft smoothstep bias points, never gates). The renderer is self-hosted Tone.js 15.1.22
   (vendor/tone, MIT), loaded on the first logo tap only, on the AudioContext made inside that tap. Never in Lite.
   BLEND m 0..1: tight/punchy (m=0) <-> airy/organic (m=1), wave = two sines PHI^10 and PHI^9 s (spec-locked, never repeats).
   PUMP TREE (rule 9): page 13 (js/phi-pumps.js) -> this logo 8 (PhiPumps.logo(id)) -> sound layers 5 -> chain parameters 3 ->
     details 2. Every node's periods hang off anchor B (PhiPumps.B(): moon clock + the kid's own rhythm), whole phi steps.
   MICROCOSM (rule 10): root and loudness come from the page registry (daytime = sun height, tide = M2 clock, moon, clock = S2 clock,
     ratio-pump, phi-adapt:<logo id>), all on-device sky clocks or this page's own pumps. No network call in this file.
   LOUDNESS: quiet hours come from the Season pumps standard, not the clock: L = quiet x (1 + PHI^-4 x feed nudge), where quiet
     (PhiPumps 'quiet') is 1 by day and PHI^-n at rest, eased by sun height through dusk and dawn; n = Dial 3's rung.
   SOLO: only one logo sounds at a time (a new create() stops the previous engine).
   FIXED VALUES: this copy still carries the engine's fixed voice values (filter ranges, levels, envelopes, polyphony, master
     scale). They are listed in /workspace/logo-sound-fixed-params.md (box) and FLAGGED by the rule 12 self-check (docs/logo.md)
     for Danny to move to ratios one by one; spec-locked values (ladder thresholds, grid, phrase lengths, wave) stay as the spec says.
   API: LogoSound.create(ac, dest, {subscribe, events, logo}) -> engine {event(name), nudge(x), state(), stop(fade)} */
(function(G0){
  'use strict';
  var W=typeof window!=='undefined'?window:G0;
  var PHI=1.6180339887,G=0.6180339887,STEP=0.2360679775,E=[0,0.0136,0.0357,0.0713,0.1290,0.2225,0.3736,0.618],HYS=0.0136,ZETA=Math.pow(PHI,-0.5),
      PHR=[8,13,21],MODES=[[0,2,3,5,7,8,10],[0,2,3,5,7,9,10],[0,2,4,6,7,9,11],[0,2,4,7,9]],ROOT=28,
      CH={synth:0,wood:1,glass:2,pad:3,breath:4,bird:5,sub:6,drums:9,macro:15},
      CC={blend:16,density:17,low:18,filter:74,res:71,swing:19,colour:80,reverb:91,shimmer:93,vol:7,root:81,breath:2},
      DEF_SUBS=['pump:page','daytime','quiet','tide','moon','ratio-pump','clock','component:theme'];
  function lerp(a,b,t){return a+(b-a)*t;}
  function clamp(x,a,b){a=a==null?0:a;b=b==null?1:b;return x<a?a:x>b?b:x;}
  function sstep(x){x=clamp(x);return x*x*(3-2*x);}
  function wave(t){return ((Math.sin(2*Math.PI*t/Math.pow(PHI,10))+Math.sin(2*Math.PI*t/Math.pow(PHI,9)+1))/2+1)/2;}
  function v7(x){return Math.max(0,Math.min(127,Math.round(x*127)));}
  // ---- local stub registry (when the page has no PhiPumps) ----
  function stubNode(name,n,k0,depth,parent,seed){var P=[],ph=[];for(var j=0;j<n;j++){P.push(Math.pow(PHI,k0+j/2));ph.push(2*Math.PI*(((j+1+(seed||0))*G)%1));}
    function modes(t){var s=0;for(var j=0;j<n;j++)s+=Math.sin(2*Math.PI*t/P[j]+ph[j]);return s/n;}
    return {name:name,n:n,depth:depth,parent:parent||null,modes:modes,out:function(t){return (parent?parent.out(t):1)*(1+depth*modes(t));}};}
  function stub(clock){var page=stubNode('page',13,4,0.146,null,0),f={
      'pump:page':function(){return page.out(clock.mono());},
      daytime:function(){var d=new Date(clock.wall()*1000);return -Math.cos(2*Math.PI*(d.getHours()+d.getMinutes()/60)/24);},
      clock:function(){return Math.sin(2*Math.PI*(clock.wall()%3600)/3600);},
      moon:function(){var ph=(((clock.wall()*1000-947182440000)/86400000/29.530588853)%1+1)%1;return -Math.cos(2*Math.PI*ph);}};
    return {node:stubNode,page:page,subscribe:function(n){return {name:n,get:function(){return f[n]?f[n]():null;}};}};}

  // ================= SEQUENCER (MIDI generator) =================
  function Sequencer(o){o=o||{};
    var rnd=o.random||Math.random,clock=o.clock||{wall:function(){return Date.now()/1000;},mono:function(){return (W.performance?performance.now():Date.now())/1000;},hour:function(){var d=new Date();return d.getHours()+d.getMinutes()/60;}};
    var REG=o.registry||(W.PhiPumps&&W.PhiPumps.subscribe&&!o.local?W.PhiPumps:stub(clock)),node=REG.node||stubNode;
    var subs={};(o.subscribe||DEF_SUBS).forEach(function(n){subs[n]=REG.subscribe(n);});
    function feed(n){var s=subs[n];var v=s?s.get():null;return typeof v==='number'&&isFinite(v)?v:null;}
    // pump tree: logo branch under the page root
    var pageN=REG.page||{out:function(t){var v=feed('pump:page');return v==null?1:v;}},sd=0;
    function N(name,n,k0,d,par){sd+=1;return node(name,n,k0,d,par,sd);}
    var logo=(REG.logo&&o.logo)?REG.logo(o.logo):N('logo',8,-1,Math.pow(PHI,-5),pageN),L={},Pm={},D={};
    ['808','hats','plucks','pad','organic','shimmer'].forEach(function(k){L[k]=N(k,5,-2,Math.pow(PHI,-5),logo);});
    [['blend','plucks'],['density','hats'],['low','808'],['filter','plucks'],['swing','hats'],['colour','pad'],['reverb','organic'],['shimmer','shimmer']].forEach(function(p){Pm[p[0]]=N(p[0],3,-3,Math.pow(PHI,-6),L[p[1]]);});
    [['subDecay','low'],['jitter','swing'],['cutoff','filter'],['res','filter'],['pluckDecay','filter'],['breath','reverb'],['glassDecay','shimmer']].forEach(function(p){D[p[0]]=N(p[0],2,-4,Math.pow(PHI,-7),Pm[p[1]]);});
    var PORD=['blend','density','low','filter','swing','colour','reverb','shimmer'];
    var ev=o.events||{'star-drop':0.236,'shimmer':0.236},nudges=[],aff=o.logo?'phi-adapt:'+o.logo:null;if(aff&&!subs[aff])subs[aff]=REG.subscribe(aff);
    var y=[0,0,0,0,0,0,0,0],v=[0,0,0,0,0,0,0,0],tg=[0,0,0,0,0,0,0,0],fall=[0,0,0,0,0,0,0,0],lu=[0,0,0,0,0,0,0,0],first=true;
    var root={x:0,v:0,tg:0,off:0},step=0,pIdx=0,pLen=PHR[0],pPos=0,deg=0,lastCC={},padOn=[],padRoot=0,breathOn=false,prog=80,loud=1,feedsNow={};
    function mNow(){var t=clock.wall(),n=0;nudges=nudges.filter(function(q){var a=(t-q.t)/2.618;if(a>=1)return false;n+=q.a*(1-a)*(1-a);return true;});
      var a=aff?feed(aff):null;return clamp((o.forceM!=null?o.forceM:wave(t))+n+0.09*(a||0));}
    function ladder(m,phrase,tm){for(var i=0;i<8;i++){var tau=STEP*Math.pow(PHI,i),w=1/tau,u=i?clamp((y[i-1]+m)/2+0.236*tau*v[i-1]):m;
        u=clamp(u*Pm[PORD[i]].out(tm));var d=u-lu[i];lu[i]=u;fall[i]+=((d<0?1:d>0?0:fall[i])-fall[i])*0.382;
        if(i<5||phrase||first){var e=Math.max(0,E[i]-HYS*fall[i]);tg[i]=i===7?0.618*Math.pow(u,PHI):sstep((u-e)/(1-e));}
        if(first){y[i]=tg[i];v[i]=0;continue;}
        for(var s=0;s<4;s++){var h=STEP/4,a=w*w*(tg[i]-y[i])-2*ZETA*w*v[i];v[i]+=a*h;y[i]+=v[i]*h;}}
      first=false;}
    function readFeeds(){var f={};['daytime','tide','moon','ratio-pump','clock'].forEach(function(n){f[n]=feed(n);});f.theme=feed('component:theme');feedsNow=f;
      var z=function(x){return x==null?0:x;};
      var S=0.382*z(f.daytime)+0.236*z(f.tide)+0.146*z(f.moon)+0.146*z(f['ratio-pump'])+0.09*z(f.clock);
      root.tg=clamp(Math.round(3*S),-2,3);root.S=S;
      var q=feed('quiet');f.quiet=q;var d4=Math.pow(PHI,-4);   // quiet hours from sun height + Dial 3 (PhiPumps 'quiet'); no wall-clock schedule
      loud=(q==null?1:q)*(1+d4*(Math.pow(PHI,-2)*z(f.tide)+Math.pow(PHI,-3)*z(f.moon)+Math.pow(PHI,-3)*z(f['ratio-pump'])+d4*z(f.clock)))/(1+d4);}
    function rootStep(){var w=1/0.618,c=0.236*0.618*v[5];for(var s=0;s<4;s++){var h=STEP/4,a=w*w*(root.tg+c-root.x)-2*w*root.v;root.v+=a*h;root.x+=root.v*h;}}
    function rn(){return ROOT+Math.round(root.x);}
    function noteN(base,dg,colour){var p=clamp(colour)*3,lo=Math.floor(Math.min(2.999,p)),md=MODES[rnd()<p-lo?lo+1:lo],k=((dg%md.length)+md.length)%md.length,o2=Math.floor(dg/md.length);return base+12*o2+md[k];}
    function stepEvents(T){var out=[],tm=clock.mono();function E_(e){out.push(e);return e;}
      var phrase=pPos===0;if(phrase||first)readFeeds();
      ladder(mNow(),phrase,tm);rootStep();
      var b=y[0],d=y[1],lo=y[2],fl=y[3],sw=y[4],col=y[5],sp=y[6],sh=y[7];
      var lay={};for(var k in L)lay[k]=L[k].out(tm);var det={};for(var k2 in D)det[k2]=D[k2].out(tm);
      if(feedsNow.theme===1)det.cutoff+=0.056;
      var r=1+(PHI-1)*sw,t0=T+(step%2?(2*STEP*r/(1+r)-STEP):0),acc=0.82+0.18*((step*G)%1);
      function J(){return clamp((rnd()*2-1)*0.009*det.jitter,-0.018,0.018);}
      function cc(c,val,ch){ch=ch==null?CH.macro:ch;var key=ch+':'+c;if(lastCC[key]===val)return;lastCC[key]=val;E_({t:T,type:'cc',ch:ch,cc:c,val:val});}
      if(step===0){E_({t:T,type:'cc',ch:CH.pad,cc:101,val:0});E_({t:T,type:'cc',ch:CH.pad,cc:100,val:0});E_({t:T,type:'cc',ch:CH.pad,cc:6,val:12});
        [[CH.wood,108],[CH.glass,98],[CH.pad,89],[CH.breath,121],[CH.bird,123],[CH.sub,38]].forEach(function(q){E_({t:T,type:'pc',ch:q[0],prog:q[1]});});}
      cc(CC.blend,v7(b));cc(CC.density,v7(d));cc(CC.low,v7(lo));cc(CC.filter,v7(clamp(fl*det.cutoff)));cc(CC.res,v7(clamp((1-fl)*det.res)));cc(CC.swing,v7(sw));
      cc(CC.colour,v7(col));cc(CC.reverb,v7(sp));cc(CC.shimmer,v7(sh));cc(CC.vol,v7(loud));cc(CC.root,64+root.tg);
      cc(CC.breath,v7(clamp((0.5*b+0.6*sh)*det.breath*lay.organic)),CH.breath);
      if(!breathOn){breathOn=true;E_({t:T,type:'on',ch:CH.breath,n:64,v:100});}
      // pad: chord per phrase, root glide by pitch bend
      if(phrase){prog=prog===80?81:80;E_({t:T,type:'pc',ch:CH.synth,prog:prog});
        padOn.forEach(function(n){E_({t:T,type:'off',ch:CH.pad,n:n});});padOn=[];padRoot=rn();
        var ch=[0,3,4,5][pIdx%4],pv=v7(clamp(0.62*b*lay.pad*acc));
        if(pv>0)[ch,ch+2,ch+4].forEach(function(dg){var n=noteN(padRoot+36,dg,col);padOn.push(n);E_({t:T+0.01,type:'on',ch:CH.pad,n:n,v:pv});});}
      var bend=Math.round(clamp((root.x-(padRoot-ROOT))/12,-1,1)*8191);if(lastCC['pb']!==bend){lastCC['pb']=bend;E_({t:T,type:'bend',ch:CH.pad,bend:bend});}
      // hats (ch10 note 42)
      var hv=lay.hats*acc;
      if(rnd()<lerp(0.92,0.14,d)){var t=t0+J();if(rnd()<0.38*(1-d)*(1-d)){for(var k3=0;k3<3;k3++){E_({t:t+k3*STEP/3,type:'on',ch:CH.drums,n:42,v:v7(clamp(0.62*hv*(1-0.2*k3)))});E_({t:t+k3*STEP/3+0.03,type:'off',ch:CH.drums,n:42});}}
        else{E_({t:t,type:'on',ch:CH.drums,n:42,v:v7(clamp(0.55*hv*(1-0.5*b)))});E_({t:t+0.03,type:'off',ch:CH.drums,n:42});}}
      // 808 on the root (ch7)
      var pos=pPos%8;if(pos===0||pos===3||(pos===6&&rnd()<0.5)){var sv=v7(clamp(0.9*lerp(1,0.03,lo)*lay['808']*acc)),sdur=lerp(0.62,0.24,lo)*det.subDecay,t1=t0+J()*0.5;
        if(sv>0){E_({t:t1,type:'on',ch:CH.sub,n:rn(),v:sv});E_({t:t1+sdur,type:'off',ch:CH.sub,n:rn()});}}
      // plucks
      if(rnd()<lerp(0.5,0.22,d)){deg+=[-2,-1,1,2,0,3][Math.floor(rnd()*6)];deg=Math.max(-3,Math.min(9,deg));
        var pd=lerp(0.18,0.9,fl)*det.pluckDecay,t2=t0+J();
        var n1=noteN(rn()+(b>0.5?36:24),deg,col),s1=v7(clamp(0.8*(1-b)*lay.plucks*acc));
        if(s1>0){E_({t:t2,type:'on',ch:CH.synth,n:n1,v:s1});E_({t:t2+pd,type:'off',ch:CH.synth,n:n1});}
        var n2=n1+12,w1=v7(clamp(0.9*b*lay.organic*acc)),t3=t2+(rnd()*2-1)*Math.pow(PHI,-6);
        if(w1>0){E_({t:t3,type:'on',ch:CH.wood,n:n2,v:w1});E_({t:t3+pd,type:'off',ch:CH.wood,n:n2});}
        var g1=v7(clamp(1.3*sh*lay.shimmer*acc));
        if(g1>0&&sh>0.02){var gd=lerp(0.6,1.6,sh/0.618)*det.glassDecay;E_({t:t3+0.002,type:'on',ch:CH.glass,n:n1+24,v:g1});E_({t:t3+gd,type:'off',ch:CH.glass,n:n1+24});}}
      // birdsong (ch6)
      if(rnd()<0.035*b+0.05*sh){var t4=t0+rnd()*STEP,bv=v7(clamp(0.5*(b+sh)*lay.organic)),cn=3+(rnd()<0.5?0:1);
        for(var c2=0;c2<cn;c2++){var nn=96+Math.floor(rnd()*6);E_({t:t4+c2*0.09,type:'on',ch:CH.bird,n:nn,v:bv});E_({t:t4+c2*0.09+0.06,type:'off',ch:CH.bird,n:nn});}}
      step++;pPos++;if(pPos>=pLen){pPos=0;pIdx++;pLen=PHR[pIdx%3];}
      return out;}
    function allOff(T){var out=[];padOn.forEach(function(n){out.push({t:T,type:'off',ch:CH.pad,n:n});});padOn=[];if(breathOn)out.push({t:T,type:'off',ch:CH.breath,n:64});breathOn=false;return out;}
    return {step:stepEvents,allOff:allOff,event:function(name){var a=ev[name];if(a)nudges.push({t:clock.wall(),a:a});},nudge:function(a){nudges.push({t:clock.wall(),a:+a||0});},
      state:function(){return {m:mNow(),y:y.slice(),root:{offset:root.tg,pos:+root.x.toFixed(3),S:root.S,midi:rn()},loud:loud,feeds:feedsNow,step:step,phrase:[pIdx,pLen],
        pumps:{page:pageN.out(clock.mono()),logo:logo.out(clock.mono())}};}};}

  // ================= RENDERER (Tone.js) =================
  function hz(n){return 440*Math.pow(2,(n-69)/12);}
  function ToneRenderer(T,dest){
    var nodes=[];function K(x){nodes.push(x);return x;}
    var master=K(new T.Gain(0));master.connect(dest);
    var comp=K(new T.Compressor({threshold:-26,ratio:3,attack:0.01,release:0.236})).connect(master);
    var bus=K(new T.Gain(1)).connect(comp),makeup=bus;
    var revS=K(new T.Reverb({decay:0.618,preDelay:0.01,wet:1})).connect(comp),revL=K(new T.Reverb({decay:2.618,preDelay:0.03,wet:1})).connect(comp);
    var sendS=K(new T.Gain(0.03)).connect(revS),sendL=K(new T.Gain(0)).connect(revL),shim=K(new T.Gain(0)).connect(revL);
    function chan(vol){var g=K(new T.Gain(vol));g.connect(bus);g.connect(sendS);g.connect(sendL);return g;}
    var C={};
    C[0]=chan(0.5);var synth=K(new T.PolySynth(T.MonoSynth,{oscillator:{type:'square'},filter:{Q:6,type:'lowpass'},envelope:{attack:0.002,decay:0.236,sustain:0,release:0.146},filterEnvelope:{attack:0.003,decay:0.236,sustain:0.1,baseFrequency:600,octaves:2.6}}));synth.maxPolyphony=8;synth.connect(C[0]);
    C[1]=chan(0.9);var wood=[0,1].map(function(){return K(new T.PluckSynth({attackNoise:1.2,dampening:3800,resonance:0.92})).connect(C[1]);}),wi=0;
    C[2]=chan(0.35);var glass=K(new T.PolySynth(T.FMSynth,{harmonicity:5.07,modulationIndex:9,oscillator:{type:'sine'},envelope:{attack:0.002,decay:1.618,sustain:0,release:0.618},modulation:{type:'sine'},modulationEnvelope:{attack:0.002,decay:0.382,sustain:0,release:0.236}}));glass.maxPolyphony=6;glass.connect(C[2]);glass.connect(shim);
    C[3]=chan(0.5);var padF=K(new T.Filter(1800,'lowpass')).connect(C[3]),pad=K(new T.PolySynth(T.AMSynth,{envelope:{attack:1.618,decay:0.618,sustain:0.8,release:2.618}}));pad.maxPolyphony=6;pad.connect(padF);
    C[4]=chan(0);var brF=K(new T.Filter({type:'bandpass',frequency:2600,Q:0.7})).connect(C[4]),breath=K(new T.NoiseSynth({noise:{type:'pink'},envelope:{attack:0.618,decay:0.1,sustain:1,release:1.618}})).connect(brF);
    C[5]=chan(0.25);var bird=K(new T.Synth({oscillator:{type:'sine'},envelope:{attack:0.006,decay:0.07,sustain:0,release:0.03}})).connect(C[5]);
    C[6]=chan(0.9);var sub=K(new T.MembraneSynth({pitchDecay:0.045,octaves:2.5,envelope:{attack:0.003,decay:0.62,sustain:0,release:0.1}})).connect(C[6]),
      sub2=K(new T.MembraneSynth({pitchDecay:0.045,octaves:2.5,envelope:{attack:0.003,decay:0.37,sustain:0,release:0.1}}));sub2.volume.value=-9;sub2.connect(C[6]);
    C[9]=chan(0.5);var hat=K(new T.MetalSynth({envelope:{attack:0.001,decay:0.056,release:0.01},harmonicity:5.1,modulationIndex:32,resonance:4000,octaves:1.5}));hat.volume.value=-14;hat.connect(C[9]);
    var st={filter:0.5,res:0.5,blend:0,reverb:0,shimmer:0,low:0};
    function tgt(p,v,t,tc){try{p.setTargetAtTime(v,t,tc||0.06);}catch(e){}}
    function applyMacro(t){var fl=st.filter,cut=lerp(1200,5200,fl);
      try{synth.set({filter:{Q:lerp(0.7,8,st.res)},filterEnvelope:{baseFrequency:cut*0.5}});}catch(e){}
      tgt(padF.frequency,lerp(900,3400,fl),t,0.382);wood.forEach(function(w){try{w.dampening=lerp(2400,5200,fl);}catch(e){}});
      tgt(sendS.gain,lerp(0.04,0.5,st.reverb)*(1-st.reverb),t,0.236);tgt(sendL.gain,lerp(0.04,0.5,st.reverb)*st.reverb,t,0.236);tgt(shim.gain,st.shimmer*0.9,t,0.236);
      tgt(makeup.gain,lerp(1,Math.pow(PHI,1.5),st.blend),t,0.382);
      try{sub.envelope.decay=lerp(0.62,0.24,st.low);sub2.envelope.decay=lerp(0.37,0.15,st.low);}catch(e){}}
    var held={};
    function midi(e){var t=e.t;try{
      if(e.type==='cc'){var x=e.val/127;
        if(e.ch===15){if(e.cc===7)tgt(master.gain,x*0.16,t,0.382);else if(e.cc===74)st.filter=x;else if(e.cc===71)st.res=x;else if(e.cc===91)st.reverb=x;else if(e.cc===93)st.shimmer=x;else if(e.cc===16)st.blend=x;else if(e.cc===18)st.low=x;else return;applyMacro(t);}
        else if(e.ch===4&&e.cc===2)tgt(C[4].gain,x*0.3,t,0.382);return;}
      if(e.type==='pc'){if(e.ch===0)synth.set({oscillator:{type:e.prog===81?'sawtooth':'square'}});return;}
      if(e.type==='bend'){if(e.ch===3)pad.set({detune:e.bend/8192*1200});return;}
      var vel=(e.v||0)/127;
      switch(e.ch){
        case 0:if(e.type==='on')synth.triggerAttack(hz(e.n),t,vel);else synth.triggerRelease(hz(e.n),t);break;
        case 1:if(e.type==='on'){wood[wi].triggerAttack(hz(e.n),t);wi^=1;}break;
        case 2:if(e.type==='on')glass.triggerAttack(hz(e.n),t,vel);else glass.triggerRelease(hz(e.n),t);break;
        case 3:if(e.type==='on'){pad.triggerAttack(hz(e.n),t,vel);held[e.n]=1;}else{pad.triggerRelease(hz(e.n),t);delete held[e.n];}break;
        case 4:if(e.type==='on')breath.triggerAttack(t,1);else breath.triggerRelease(t);break;
        case 5:if(e.type==='on'){var f=hz(e.n)*(0.9+0.1*Math.random());bird.triggerAttack(f,t,vel);bird.frequency.setValueAtTime(f,t);bird.frequency.exponentialRampToValueAtTime(f*1.4,t+0.055);}break;
        case 6:if(e.type==='on'){sub.triggerAttack(hz(e.n),t,vel);sub2.triggerAttack(hz(e.n+12),t,vel);}break;
        case 9:if(e.type==='on'&&e.n===42)hat.triggerAttackRelease(hz(84),0.03,t,vel*0.5);break;}
    }catch(err){}}
    return {midi:midi,ready:Promise.all([revS.ready,revL.ready]).catch(function(){}),
      fadeIn:function(t){tgt(master.gain,0.12,t,0.618);},
      stop:function(t,fade){tgt(master.gain,0,t,fade||0.06);setTimeout(function(){nodes.forEach(function(n){try{n.dispose();}catch(e){}});},600);}};}

  // ================= lazy loading (no feed fetch: every feed is on-device) =================
  var toneP=null;
  function base(){var s=document.querySelector('script[src*="logo-sound.js"]');return s?s.src.replace(/js\/logo-sound\.js.*$/,''):'';}
  function loadTone(){if(W.Tone)return Promise.resolve(W.Tone);if(toneP)return toneP;
    toneP=new Promise(function(res,rej){var s=document.createElement('script');s.src=base()+'vendor/tone/Tone.js?v=15.1.22';s.async=true;s.onload=function(){W.Tone?res(W.Tone):rej(0);};s.onerror=function(){toneP=null;rej(0);};document.head.appendChild(s);});return toneP;}
  // ================= engine =================
  // VOICES: a logo may bring its own Sequencer + Renderer pair (LogoSound.voices[name]); this page registers none.
  // The scheduler, lazy Tone load and solo rule stay here. SOLO: only one logo sounds at a time; creating an engine stops the one before.
  // LIVE: each running engine publishes a small state snapshot in LogoSound.live[logo id] (used by the live mini-mapped open/close sounds).
  var voices={},live={},current=null;
  function create(ac,dest,o){o=o||{};var alive=true,seq=null,R=null,timer=0,next=0,log=o.record?[]:null,pend=[],V=o.voice?voices[o.voice]:null;
    var api={event:function(n){if(seq)seq.event(n);else pend.push(['e',n]);},nudge:function(a){if(seq)seq.nudge(a);else pend.push(['n',a]);},
      state:function(){return seq?seq.state():null;},log:function(){return log?log.slice():null;},
      stop:function(fade){if(!alive)return;alive=false;if(current===api)current=null;clearTimeout(timer);if(R&&seq){seq.allOff(ac.currentTime).forEach(R.midi);R.stop(ac.currentTime,fade);}}};
    if(current&&current!==api){try{current.stop();}catch(e){}}current=api;
    loadTone().then(function(T){if(!alive)return;
      try{var d0=T.getContext();if(d0.rawContext!==ac){T.setContext(ac);try{d0.dispose();}catch(e){}}}catch(e){}   // onto the tap's own context; the Tone bundle makes a default one as it loads, so close that at once (one live context)
      var so={subscribe:o.subscribe,events:o.events,logo:o.logo,forceM:o.forceM,forceD:o.forceD,feeds:o.feeds,forceHour:o.forceHour};
      R=V?V.Renderer(T,dest):ToneRenderer(T,dest);seq=V?V.Sequencer(so):Sequencer(so);
      pend.forEach(function(p){p[0]==='e'?seq.event(p[1]):seq.nudge(p[1]);});pend=[];
      R.ready.then(function(){if(!alive)return;next=ac.currentTime+0.1;R.fadeIn(ac.currentTime);tick();});
    }).catch(function(){});
    function tick(){if(!alive)return;if(next<ac.currentTime)next=ac.currentTime+0.05;
      while(next<ac.currentTime+0.3){var evs=seq.step(next);for(var i=0;i<evs.length;i++){R.midi(evs[i]);if(log){log.push(evs[i]);if(log.length>4000)log.splice(0,1000);}}next+=STEP;}
      if(o.logo){try{var q=seq.state();live[o.logo]={at:Date.now(),m:q.m,D:q.D,midi:q.root&&q.root.midi,loud:q.loud,day:q.day};}catch(e){}}
      timer=setTimeout(tick,100);}
    return api;}
  W.LogoSound={create:create,Sequencer:Sequencer,wave:wave,THRESHOLDS:E.slice(),CH:CH,CC:CC,STEP:STEP,
    voices:voices,live:live,current:function(){return current;},
    util:{PHI:PHI,G:G,STEP:STEP,E:E,HYS:HYS,ZETA:ZETA,lerp:lerp,clamp:clamp,sstep:sstep,wave:wave,v7:v7,hz:hz,stub:stub,stubNode:stubNode}};
})(this);
