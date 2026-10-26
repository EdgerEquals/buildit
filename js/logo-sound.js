/* LOGO SOUND ENGINE (this page's own copy of the Kids Club logo engine; logo sound and motion standard,
   /home/box/.config/logo-sound-motion-spec.md on the box). Changes only through this page's bot; never loads another page's files.
   PLAIN WEB AUDIO: no music library. Loaded on the first logo tap only, on the AudioContext made inside that tap. Never in Lite.
   ARCHITECTURE  [Sequencer] -> note/control events -> [Renderer]. The sequencer is pure JS on the phi grid + the eight-stage ladder
   (free-wheel rule 6: coupled damped glides, soft smoothstep bias points, never gates). Notes are semitones above the live base.
   BLEND m 0..1: tight/punchy (m=0) <-> airy/organic (m=1), wave = two sines PHI^10 and PHI^9 s (spec-locked, never repeats).
   PUMP TREE (rule 9): page 13 (js/phi-pumps.js) -> this logo 8 (PhiPumps.logo(id)) -> sound layers 5 -> chain parameters 3 ->
     details 2. Every node's periods hang off anchor B (PhiPumps.B(): moon clock + the kid's own rhythm), whole phi steps.
   LOUDNESS (Kids Club "Loudness: device volume plus the amplitude matrix"): NO MASTER VOLUME. There is no overall gain node; the
     device's own volume is the one overall control, and this file never reads or sets it. Every level, gain, velocity, send and
     fade goes through amp(name), the AMPLITUDE MATRIX HOOK below. Danny hasn't defined the matrix yet, so the hook holds the
     engine's existing levels unchanged, marked PENDING-DANNY (the standard: no new fixed level until he defines it). Quiet hours:
     each level x quiet, where quiet (PhiPumps 'quiet') is 1 by day and PHI^-n at rest (sun height; n = Dial 3's rung).
   PITCH (Kids Club "Pitch: no fixed root, two pumps"): no root note. Pump A: base = (1/B) x PHI^n, B = anchor B, so the kid's own
     usage rhythm moves the base (busier = higher). Pump B: the mix of this page's feeds (sun height, M2 tide, moon, S2 clock,
     ratio pump; this page has NO weather feed and none is added) sets a soft floor and headroom in whole phi rungs around the
     sky-only base, within Danny's floor and ceiling (PITCH hook below, PENDING-DANNY). Every note, register, cutoff, partial and
     filter is a ratio of the base; changes glide. Every time is the spec grid step x PHI^n.
   SOLO: one logo sounds at a time (a new create() stops the previous engine).
   API: LogoSound.create(ac, dest, {events, logo}) -> engine {event(name), nudge(x), state(), stop(fade)};
        LogoSound.base() (live base Hz), LogoSound.level(name) (matrix level x quiet), LogoSound.matrix (set by Danny's matrix). */
(function(G0){
  'use strict';
  var W=typeof window!=='undefined'?window:G0;
  var PHI=1.6180339887,G=1/PHI,STEP=Math.pow(PHI,-3),ZETA=Math.pow(PHI,-0.5);
  function P(n){return Math.pow(PHI,n);}
  function S(n){return STEP*P(n);}   // a time: the spec grid step x PHI^n (seconds)
  // spec-locked (logo-sound-motion-spec.md): ladder thresholds, hysteresis, phrase lengths (Fibonacci)
  var E=[0,0.0136,0.0357,0.0713,0.1290,0.2225,0.3736,G],HYS=0.0136,PHR=[8,13,21];
  var MODES=[[0,2,3,5,7,8,10],[0,2,3,5,7,9,10],[0,2,4,6,7,9,11],[0,2,4,7,9]];   // SCALE intervals above the base (ratios 2^(k/12))

  // ===================== AMPLITUDE MATRIX HOOK (PENDING DANNY) =====================
  // The one place every loudness value comes from. Danny hasn't defined the amplitude matrix yet: these are the engine's EXISTING
  // levels, unchanged and listed for him (docs/logo.md). When he defines it, set LogoSound.matrix = function(name){return level;}
  // (or replace this table); nothing else changes. 'head' was the old master scale: it is now folded into each voice, with no master node.
  var AMP={
    head:0.16, synth:0.5, wood:0.9, glass:0.35, pad:0.5, breath:0.3, bird:0.25, sub:0.9, sub2:0.355, hats:0.5, hat:0.1,   // PENDING-DANNY voices (sub2 was -9 dB; hat was -14 dB x 0.5)
    sendLo:0.04, sendHi:0.5, send0:0.03, shim:0.9, makeup:Math.pow(PHI,1.5), padSus:0.8, compThr:-26, compRatio:3,         // PENDING-DANNY sends, sustain, dynamics
    vPad:0.62, vHat:0.55, vHatB:0.5, vTrip:0.62, vTripFall:0.2, v808:0.9, v808lo:0.03, vPluck:0.8, vWood:0.9, vGlass:1.3,    // PENDING-DANNY velocities
    vBird:0.5, brB:0.5, brS:0.6, accLo:0.82, accHi:0.18, sparkle:Math.pow(PHI,-9), swish:Math.pow(PHI,-8),                    // PENDING-DANNY velocities, zoom sounds
    dip:1,   // Loudness 14:26 (Danny): the music dips this many whole phi rungs under the logo (x PHI^-1); one matrix rung he can move
    nudge:Math.pow(PHI,-4), nTide:Math.pow(PHI,-2), nMoon:Math.pow(PHI,-3), nRatio:Math.pow(PHI,-3), nClock:Math.pow(PHI,-4) // PENDING-DANNY feed nudges on loudness
  };
  function amp(k){var f=W.LogoSound&&W.LogoSound.matrix,v=typeof f==='function'?f(k):null;return typeof v==='number'&&isFinite(v)?v:AMP[k];}
  // ===================== PITCH RANGE HOOK (PENDING DANNY) =====================
  // start: n in base = (1/B) x PHI^n (rung 12 puts the sky-only base near the old engine's register); floor / ceil: the most whole
  // phi rungs Pump B may give below / above the sky-only base. Danny's floor and ceiling: to set.
  var PITCH={start:12, floor:2, ceil:2};   // PENDING-DANNY

  function lerp(a,b,t){return a+(b-a)*t;}
  function clamp(x,a,b){a=a==null?0:a;b=b==null?1:b;return x<a?a:x>b?b:x;}
  function sstep(x){x=clamp(x);return x*x*(3-2*x);}
  function wave(t){return ((Math.sin(2*Math.PI*t/P(10))+Math.sin(2*Math.PI*t/P(9)+1))/2+1)/2;}
  function tanh(x){var e=Math.exp(2*x);return (e-1)/(e+1);}
  function mono(){return (W.performance?performance.now():Date.now())/1000;}
  function REG(){return W.PhiPumps&&W.PhiPumps.subscribe?W.PhiPumps:null;}
  var subs={};
  function feed(n){var R=REG();if(!R)return null;var s=subs[n]||(subs[n]=R.subscribe(n)),v=s.get();return typeof v==='number'&&isFinite(v)?v:null;}
  function z(x){return x==null?0:x;}
  function quiet(){var q=feed('quiet');return q==null?1:q;}
  // LOGO UNDER THE MUSIC (Loudness 14:23, Danny): logo level = the page music's undipped level x PHI^-1, as a ratio of the music's
  // as-built level (the DJ's slider default x its own pump volume, js/autodj.js), so at the DJ's defaults the logo is one phi step
  // quieter than before and then follows the music. No music playing: the last level the music had on this device (never louder on its own).
  function music(){var d=W.AutoDJ&&W.AutoDJ.level,v=d?d():null;if(typeof v!=='number'||!isFinite(v)){try{v=parseFloat(localStorage.getItem('buildit.dj.level'));}catch(e){v=NaN;}}
    var ref=W.AutoDJ&&W.AutoDJ.ref?W.AutoDJ.ref():0.8*0.55;return (isFinite(v)&&v>0?v/ref:1)/PHI;}
  function level(k){return amp(k)*quiet()*music();}
  // ---- pitch pumps ----
  function own(){try{var o=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--own-step'));return isFinite(o)?o:0;}catch(e){return 0;}}
  function anchors(){var R=REG(),b=R&&R.B?R.B():null,b0=R&&R.B0?R.B0():null;b=b||b0||P(3+own());b0=b0||b;return {B:b,B0:b0};}   // fallback: the page's own breathing beat
  function mix(){return P(-2)*z(feed('daytime'))+P(-3)*z(feed('tide'))+P(-4)*z(feed('moon'))+P(-4)*z(feed('ratio-pump'))+P(-5)*z(feed('clock'));}
  function pitchTarget(){var a=anchors(),m=mix(),x=Math.log(a.B0/a.B)/Math.log(PHI),   // Pump A: rungs the kid's rhythm moves the base off the sky-only base
      kf=Math.max(1,Math.min(PITCH.floor,1+Math.round(-m))),kh=Math.max(1,Math.min(PITCH.ceil,1+Math.round(m)));   // Pump B: floor and headroom rungs
    return {B0:a.B0,x:x>0?kh*tanh(x/kh):kf*tanh(x/kf),kf:kf,kh:kh,mix:m};}   // soft floor and headroom, never a gate
  function baseHz(B0,x){return P(PITCH.start+x)/B0;}

  // ================= SEQUENCER =================
  function tinyNode(){return {out:function(){return 1;}};}
  function Sequencer(o){o=o||{};
    var rnd=Math.random,R=REG(),node=R&&R.node||tinyNode,sd=0;
    var pageN=R&&R.page||tinyNode();
    function N(name,n,k0,d,par){sd+=1;return node(name,n,k0,d,par,sd);}
    var logo=(R&&R.logo&&o.logo)?R.logo(o.logo):N('logo',8,-1,P(-5),pageN),L={},Pm={},D={};
    ['808','hats','plucks','pad','organic','shimmer'].forEach(function(k){L[k]=N(k,5,-2,P(-5),logo);});
    [['blend','plucks'],['density','hats'],['low','808'],['filter','plucks'],['swing','hats'],['colour','pad'],['reverb','organic'],['shimmer','shimmer']].forEach(function(p){Pm[p[0]]=N(p[0],3,-3,P(-6),L[p[1]]);});
    [['subDecay','low'],['jitter','swing'],['cutoff','filter'],['res','filter'],['pluckDecay','filter'],['breath','reverb'],['glassDecay','shimmer']].forEach(function(p){D[p[0]]=N(p[0],2,-4,P(-7),Pm[p[1]]);});
    var PORD=['blend','density','low','filter','swing','colour','reverb','shimmer'];
    var ev=o.events||{'star-drop':P(-3),'shimmer':P(-3)},nudges=[],aff=o.logo?'phi-adapt:'+o.logo:null;
    var y=[0,0,0,0,0,0,0,0],v=[0,0,0,0,0,0,0,0],tg=[0,0,0,0,0,0,0,0],fall=[0,0,0,0,0,0,0,0],lu=[0,0,0,0,0,0,0,0],first=true;
    var root={x:0,v:0,tg:0,B0:null,pt:null},step=0,pIdx=0,pLen=PHR[0],pPos=0,deg=0,last={},padOn=[],breathOn=false,wv=0,loud=1,feedsNow={};
    function now(){return Date.now()/1000;}
    function mNow(){var t=now(),n=0;nudges=nudges.filter(function(q){var a=(t-q.t)/P(2);if(a>=1)return false;n+=q.a*(1-a)*(1-a);return true;});
      var a=aff?feed(aff):null;return clamp((o.forceM!=null?o.forceM:wave(t))+n+P(-5)*z(a));}
    function ladder(m,phrase,tm){for(var i=0;i<8;i++){var tau=STEP*P(i),w=1/tau,u=i?clamp((y[i-1]+m)/2+P(-3)*tau*v[i-1]):m;
        u=clamp(u*Pm[PORD[i]].out(tm));var d=u-lu[i];lu[i]=u;fall[i]+=((d<0?1:d>0?0:fall[i])-fall[i])*P(-2);
        if(i<5||phrase||first){var e=Math.max(0,E[i]-HYS*fall[i]);tg[i]=i===E.length-1?G*Math.pow(u,PHI):sstep((u-e)/(1-e));}
        if(first){y[i]=tg[i];v[i]=0;continue;}
        for(var s=0;s<4;s++){var h=STEP/4,a=w*w*(tg[i]-y[i])-2*ZETA*w*v[i];v[i]+=a*h;y[i]+=v[i]*h;}}
      first=false;}
    function readFeeds(){var f={};['daytime','tide','moon','ratio-pump','clock','quiet'].forEach(function(n){f[n]=feed(n);});f.theme=feed('component:theme');feedsNow=f;
      var pt=pitchTarget();root.tg=pt.x;root.pt=pt;if(root.B0==null){root.B0=pt.B0;root.x=pt.x;}
      var d=amp('nudge');   // loudness = quiet x a small feed nudge, every weight from the matrix
      loud=(f.quiet==null?1:f.quiet)*(1+d*(amp('nTide')*z(f.tide)+amp('nMoon')*z(f.moon)+amp('nRatio')*z(f['ratio-pump'])+amp('nClock')*z(f.clock)))/(1+d);}
    function rootStep(){var w=PHI,c=P(-4)*v[5];for(var s=0;s<4;s++){var h=STEP/4,a=w*w*(root.tg+c-root.x)-2*w*root.v;root.v+=a*h;root.x+=root.v*h;}
      if(root.pt)root.B0+=(root.pt.B0-root.B0)*P(-4);}   // the sky-only anchor drifts slowly; follow it with a glide
    function noteN(base,dg,colour){var p=clamp(colour)*(MODES.length-1),lo=Math.min(MODES.length-2,Math.floor(p)),md=MODES[rnd()<p-lo?lo+1:lo],k=((dg%md.length)+md.length)%md.length,o2=Math.floor(dg/md.length);return base+12*o2+md[k];}
    function stepEvents(T){var out=[],tm=mono();function E_(e){out.push(e);return e;}
      var phrase=pPos===0;if(phrase||first)readFeeds();
      ladder(mNow(),phrase,tm);rootStep();
      var b=y[0],d=y[1],lo=y[2],fl=y[3],sw=y[4],col=y[5],sp=y[6],sh=y[7];
      var lay={};for(var k in L)lay[k]=L[k].out(tm);var det={};for(var k2 in D)det[k2]=D[k2].out(tm);
      if(feedsNow.theme===1)det.cutoff+=P(-6);
      var r=1+(PHI-1)*sw,t0=T+(step%2?(2*STEP*r/(1+r)-STEP):0),acc=amp('accLo')+amp('accHi')*((step*G)%1);
      function J(){var j=P(-10);return clamp((rnd()*2-1)*j*det.jitter,-2*j,2*j);}
      function set(key,val){if(last[key]===val)return;last[key]=val;E_({t:T,type:'set',k:key,val:val});}
      set('base',baseHz(root.B0,root.x));set('blend',b);set('filter',clamp(fl*det.cutoff));set('res',clamp((1-fl)*det.res));
      set('reverb',sp);set('shimmer',sh);set('low',lo);set('loud',loud);set('breath',clamp((amp('brB')*b+amp('brS')*sh)*det.breath*lay.organic));
      if(!breathOn){breathOn=true;E_({t:T,type:'on',ch:'breath',n:0,v:1});}
      // pad: a chord per phrase, three octaves over the base; held notes glide with the base
      if(phrase){wv^=1;set('wave',wv);
        padOn.forEach(function(n){E_({t:T,type:'off',ch:'pad',n:n});});padOn=[];
        var ch=[0,3,4,5][pIdx%4],pv=clamp(amp('vPad')*b*lay.pad*acc);
        if(pv>0)[ch,ch+2,ch+4].forEach(function(dg){var n=noteN(12*3,dg,col);padOn.push(n);E_({t:T+S(-7),type:'on',ch:'pad',n:n,v:pv});});}
      // hats, five octaves over the base
      var hv=lay.hats*acc,HN=12*5;
      if(rnd()<lerp(1-P(-5),P(-4),d)){var t=t0+J();if(rnd()<P(-2)*(1-d)*(1-d)){for(var k3=0;k3<3;k3++)E_({t:t+k3*STEP/3,type:'on',ch:'hat',n:HN,v:clamp(amp('vTrip')*hv*(1-amp('vTripFall')*k3))});}
        else E_({t:t,type:'on',ch:'hat',n:HN,v:clamp(amp('vHat')*hv*(1-amp('vHatB')*b))});}
      // sub on the base
      var pos=pPos%8;if(pos===0||pos===3||(pos===6&&rnd()<0.5)){var sv=clamp(amp('v808')*lerp(1,amp('v808lo'),lo)*lay['808']*acc),t1=t0+J()/2;
        if(sv>0)E_({t:t1,type:'on',ch:'sub',n:0,v:sv,dur:lerp(S(2),STEP,lo)*det.subDecay});}
      // plucks (+ wood an octave up, + glass two octaves up)
      if(rnd()<lerp(0.5,P(-3),d)){deg+=[-2,-1,1,2,0,3][Math.floor(rnd()*6)];deg=Math.max(-3,Math.min(9,deg));
        var pd=lerp(S(-1),S(3),fl)*det.pluckDecay,t2=t0+J();
        var n1=noteN(12*(b>0.5?3:2),deg,col),s1=clamp(amp('vPluck')*(1-b)*lay.plucks*acc);
        if(s1>0)E_({t:t2,type:'on',ch:'synth',n:n1,v:s1,dur:pd});
        var w1=clamp(amp('vWood')*b*lay.organic*acc),t3=t2+(rnd()*2-1)*P(-6);
        if(w1>0)E_({t:t3,type:'on',ch:'wood',n:n1+12,v:w1,dur:pd});
        var g1=clamp(amp('vGlass')*sh*lay.shimmer*acc);
        if(g1>0&&sh>P(-8))E_({t:t3+S(-10),type:'on',ch:'glass',n:n1+12*2,v:g1,dur:lerp(S(2),S(4),sh/G)*det.glassDecay});}
      // birdsong, over five octaves up
      if(rnd()<P(-7)*b+P(-6)*sh){var t4=t0+rnd()*STEP,bv=clamp(amp('vBird')*(b+sh)*lay.organic),cn=rnd()<0.5?3:5;
        for(var c2=0;c2<cn;c2++)E_({t:t4+c2*S(-2),type:'on',ch:'bird',n:12*5+8+Math.floor(rnd()*5),v:bv});}
      step++;pPos++;if(pPos>=pLen){pPos=0;pIdx++;pLen=PHR[pIdx%3];}
      return out;}
    function allOff(T){var out=[];padOn.forEach(function(n){out.push({t:T,type:'off',ch:'pad',n:n});});padOn=[];if(breathOn)out.push({t:T,type:'off',ch:'breath',n:0});breathOn=false;return out;}
    return {step:stepEvents,allOff:allOff,event:function(name){var a=ev[name];if(a)nudges.push({t:now(),a:a});},nudge:function(a){nudges.push({t:now(),a:+a||0});},
      base:function(){return root.B0?baseHz(root.B0,root.x):null;},
      state:function(){return {m:mNow(),y:y.slice(),pitch:{x:+root.x.toFixed(3),base:root.B0?+baseHz(root.B0,root.x).toFixed(2):null,range:root.pt},loud:loud,feeds:feedsNow,step:step,phrase:[pIdx,pLen]};}};}

  // ================= RENDERER (plain Web Audio) =================
  function Renderer(ac,dest){
    var K=[],held={},base=P(PITCH.start)/anchors().B0,st={blend:0,filter:0.5,res:0.5,reverb:0,shimmer:0,low:0,loud:1,breath:0,wave:0},alive=true;
    function g(v){var n=ac.createGain();n.gain.value=v==null?1:v;K.push(n);return n;}
    function f(type,fr,q){var n=ac.createBiquadFilter();n.type=type;n.frequency.value=fr;if(q!=null)n.Q.value=q;K.push(n);return n;}
    function tgt(p,v,t,tc){try{p.setTargetAtTime(v,Math.max(t,ac.currentTime),tc||S(-3));}catch(e){}}
    function hz(n){return base*Math.pow(2,n/12);}   // a note: semitones over the live base (a ratio of the base)
    function noise(sec,pink){var n=Math.floor(ac.sampleRate*sec),b=ac.createBuffer(1,n,ac.sampleRate),c=b.getChannelData(0),l=0;
      for(var i=0;i<n;i++){var w=Math.random()*2-1;l=pink?l+(w-l)*P(-4):w;c[i]=pink?l*P(2):w;}return b;}
    function ir(sec){var n=Math.floor(ac.sampleRate*sec),b=ac.createBuffer(2,n,ac.sampleRate);
      for(var ch=0;ch<2;ch++){var c=b.getChannelData(ch);for(var i=0;i<n;i++)c[i]=(Math.random()*2-1)*Math.pow(1-i/n,P(2));}return b;}
    var NZ=noise(STEP,false),PNZ=noise(P(2),true);
    var comp=ac.createDynamicsCompressor();K.push(comp);comp.threshold.value=amp('compThr');comp.ratio.value=amp('compRatio');comp.attack.value=S(-7);comp.release.value=STEP;comp.connect(dest||ac.destination);
    var bus=g(1);bus.connect(comp);
    function verb(sec){var c=ac.createConvolver();c.buffer=ir(sec);c.connect(comp);K.push(c);return c;}
    var revS=verb(S(2)),revL=verb(S(5)),sendS=g(amp('send0')),sendL=g(0),shim=g(0);sendS.connect(revS);sendL.connect(revL);shim.connect(revL);
    var C={};['synth','wood','glass','pad','breath','bird','sub','hats'].forEach(function(k){var c=g(0);c.connect(bus);c.connect(sendS);c.connect(sendL);C[k]=c;});
    function lv(k){return amp(k)*amp('head')*st.loud*music();}   // matrix level x matrix head x quiet hours x music relation (no master node)
    function levels(t,tc){['synth','wood','glass','pad','bird','sub','hats'].forEach(function(k){tgt(C[k].gain,alive?lv(k):0,t,tc||S(1));});
      tgt(C.breath.gain,alive?lv('breath')*st.breath:0,t,tc||S(1));}
    var padF=f('lowpass',base*P(7));padF.connect(C.pad);
    var brF=f('bandpass',base*P(9),G);brF.connect(C.breath);var brSrc=null,brG=null;
    function macro(t){var fl=st.filter;
      tgt(padF.frequency,base*P(lerp(6,9,fl)),t,S(1));tgt(brF.frequency,base*P(9),t,S(1));
      var sv=lerp(amp('sendLo'),amp('sendHi'),st.reverb);tgt(sendS.gain,sv*(1-st.reverb),t,STEP);tgt(sendL.gain,sv*st.reverb,t,STEP);tgt(shim.gain,st.shimmer*amp('shim'),t,STEP);
      tgt(bus.gain,lerp(1,amp('makeup'),st.blend),t,S(1));
      Object.keys(held).forEach(function(n){held[n].oscs.forEach(function(o){tgt(o.o.frequency,hz(+n)*o.r,t,S(2));});});}   // held pad notes glide with the base
    function env(gn,t,peak,a,d,sus){gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(peak,t+a);gn.gain.setTargetAtTime(peak*(sus||0),t+a,d/3);}
    function osc(type,fr,t){var o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(fr,t);o.start(t);return o;}
    function end(nodes,t){nodes.forEach(function(o){try{o.stop(t);}catch(e){}});}
    var V={
      synth:function(e,t){var fr=hz(e.n),o=osc(st.wave?'sawtooth':'square',fr,t),lp=ac.createBiquadFilter(),a=ac.createGain(),c=base*P(lerp(7,10,st.filter));
        lp.type='lowpass';lp.Q.value=P(lerp(-1,4,st.res));lp.frequency.setValueAtTime(c*G,t);lp.frequency.linearRampToValueAtTime(c*P(2),t+S(-9));lp.frequency.setTargetAtTime(c*G,t+S(-9),S(-1));
        env(a,t,e.v,S(-10),STEP,0);a.gain.setTargetAtTime(0,t+e.dur,S(-1));o.connect(lp);lp.connect(a);a.connect(C.synth);end([o],t+e.dur+S(3));},
      wood:function(e,t){var fr=hz(e.n),o=osc('triangle',fr,t),a=ac.createGain(),s=ac.createBufferSource(),bp=ac.createBiquadFilter(),b=ac.createGain();
        env(a,t,e.v,S(-10),Math.min(e.dur,STEP),0);o.connect(a);a.connect(C.wood);
        s.buffer=NZ;bp.type='bandpass';bp.frequency.value=fr;bp.Q.value=P(5);env(b,t,e.v*PHI,S(-10),S(-3),0);s.connect(bp);bp.connect(b);b.connect(C.wood);s.start(t);end([o,s],t+e.dur+S(1));},
      glass:function(e,t){var fr=hz(e.n),c=osc('sine',fr,t),m=osc('sine',fr*P(3),t),mg=ac.createGain(),a=ac.createGain();
        mg.gain.setValueAtTime(fr*P(3)*P(4),t);mg.gain.setTargetAtTime(0,t+S(-10),S(1)/3);m.connect(mg);mg.connect(c.frequency);
        env(a,t,e.v,S(-10),e.dur,0);c.connect(a);a.connect(C.glass);a.connect(shim);end([c,m],t+e.dur+S(2));},
      bird:function(e,t){var fr=hz(e.n)*(1-P(-5)*Math.random()),o=osc('sine',fr,t),a=ac.createGain();
        o.frequency.exponentialRampToValueAtTime(fr*PHI,t+S(-3));env(a,t,e.v,S(-8),S(-3),0);o.connect(a);a.connect(C.bird);end([o],t+S(0));},
      sub:function(e,t){[[0,'sub',e.dur],[12,'sub2',e.dur*G]].forEach(function(q){var fr=hz(q[0]),o=osc('sine',fr*P(3),t),a=ac.createGain();
        o.frequency.exponentialRampToValueAtTime(fr,t+S(-3));env(a,t,e.v*(q[1]==='sub2'?amp('sub2'):1),S(-9),q[2],0);o.connect(a);a.connect(C.sub);end([o],t+q[2]+S(1));});},
      hat:function(e,t){var s=ac.createBufferSource(),hp=ac.createBiquadFilter(),a=ac.createGain();s.buffer=NZ;hp.type='highpass';hp.frequency.value=hz(e.n)*P(3);
        env(a,t,e.v*amp('hat'),S(-12),S(-3),0);s.connect(hp);hp.connect(a);a.connect(C.hats);s.start(t);end([s],t+S(0));},
      pad:function(e,t){var fr=hz(e.n),a=ac.createGain(),os=[{o:osc('sine',fr,t),r:1},{o:osc('triangle',fr*2,t),r:2}],m=ac.createGain();m.gain.value=P(-2);
        os[0].o.connect(a);os[1].o.connect(m);m.connect(a);env(a,t,e.v,S(4),S(2),amp('padSus'));a.connect(padF);held[e.n]={a:a,oscs:os};},
      breath:function(e,t){if(brSrc)return;brSrc=ac.createBufferSource();brSrc.buffer=PNZ;brSrc.loop=true;brG=ac.createGain();brG.gain.setValueAtTime(0,t);brG.gain.setTargetAtTime(1,t,S(2)/3);
        brSrc.connect(brG);brG.connect(brF);brSrc.start(t);}};
    function off(e,t){if(e.ch==='pad'){var h=held[e.n];if(!h)return;delete held[e.n];h.a.gain.cancelScheduledValues(t);h.a.gain.setTargetAtTime(0,t,S(5)/3);end(h.oscs.map(function(x){return x.o;}),t+S(5)*2);}
      else if(e.ch==='breath'&&brSrc){brG.gain.setTargetAtTime(0,t,S(4)/3);end([brSrc],t+S(4)*2);brSrc=null;}}
    function ev(e){var t=Math.max(e.t,ac.currentTime);try{
      if(e.type==='set'){st[e.k]=e.val;if(e.k==='base'){base=e.val;macro(t);}else if(e.k==='loud'||e.k==='breath')levels(t);else if(e.k!=='wave')macro(t);return;}
      if(e.type==='off')return off(e,t);
      if(V[e.ch])V[e.ch](e,t);}catch(err){}}
    return {ev:ev,base:function(){return base;},
      fadeIn:function(t){levels(t,S(2));macro(t);},
      stop:function(t,fade){alive=false;levels(t,fade||S(-3));setTimeout(function(){end(Object.keys(held).reduce(function(a,n){return a.concat(held[n].oscs.map(function(x){return x.o;}));},brSrc?[brSrc]:[]),ac.currentTime);
        K.forEach(function(n){try{n.disconnect();}catch(e){}});},Math.max(fade||0,STEP)*P(3)*1000);}};}

  // ================= engine =================
  var live={},current=null;
  function create(ac,dest,o){o=o||{};var alive=true,timer=0,next=0,seq=Sequencer({events:o.events,logo:o.logo,forceM:o.forceM}),R=Renderer(ac,dest);
    var api={event:function(n){seq.event(n);},nudge:function(a){seq.nudge(a);},state:function(){return seq.state();},base:function(){return R.base();},
      stop:function(fade){if(!alive)return;alive=false;if(current===api){current=null;if(W.AutoDJ&&W.AutoDJ.duck)W.AutoDJ.duck(false);}clearTimeout(timer);seq.allOff(ac.currentTime).forEach(R.ev);R.stop(ac.currentTime,fade);}};
    if(current&&current!==api){try{current.stop();}catch(e){}}current=api;if(W.AutoDJ&&W.AutoDJ.duck)W.AutoDJ.duck(true);   // the music dips under the logo
    next=ac.currentTime+S(-2);
    function tick(){if(!alive)return;if(next<ac.currentTime)next=ac.currentTime+S(-3);
      while(next<ac.currentTime+S(1)){var evs=seq.step(next);for(var i=0;i<evs.length;i++)R.ev(evs[i]);next+=STEP;}
      if(o.logo){try{var q=seq.state();live[o.logo]={at:Date.now(),m:q.m,base:q.pitch.base,loud:q.loud};}catch(e){}}
      timer=setTimeout(tick,S(-2)*1000);}
    tick();R.fadeIn(ac.currentTime);
    return api;}
  function base(){if(current)return current.base();var p=pitchTarget();return baseHz(p.B0,p.x);}
  W.LogoSound={create:create,Sequencer:Sequencer,wave:wave,STEP:STEP,live:live,current:function(){return current;},
    base:base,level:level,amp:amp,AMP:AMP,PITCH:PITCH,pitch:pitchTarget,matrix:null};
})(this);
