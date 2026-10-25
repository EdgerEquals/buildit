/* LOAD TIERS ("light, lined up"; Danny's adaptive golden-ratio principle). Every gap, wait and stagger is a phi step on
   this page's own ladder (PHI^(n + own step), own step read from CSS --own-step, default .25):
   Tier 0 CRITICAL, painted at once: HTML, css/style.css, text, the 3 KB avatar. No web fonts.
   Tier 1 AFTER FIRST PAINT: the page script (gate + chat), then after unlock the piece-by-piece questions.
   Tier 2 IDLE (requestIdleCallback after load, timeout PHI^2): decoration + motion, one job per idle slot, PHI^-2 apart,
          ordered by the on-device usage loop (Adapt.order: what this person opens most comes first). Skipped in Lite.
   Tier 3 BACKGROUND PREFETCH: after load + PHI^3 and an idle slot (timeout PHI^4), never on save-data / 2g, never in Lite.
   Tiers 2 and 3 wait while the visitor is scrolling or typing (PHI^0 of quiet first). The DJ engine loads only on tap.
   LoadTiers.report() lists what ran and when (ms). */
(function(){
  'use strict';
  var PHI=1.6180339887,OWN=.25;
  try{var v=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--own-step'));if(isFinite(v))OWN=v;}catch(e){}
  function ms(n){return Math.round(Math.pow(PHI,n+OWN)*1000);}
  var T={1:[],2:[],3:[]},done={1:0,2:0,3:0},log=[],last=0,t0=Date.now();
  var ric=window.requestIdleCallback||function(f){return setTimeout(function(){f({timeRemaining:function(){return 8},didTimeout:false});},ms(-3));};
  function now(){return Date.now()-t0;}
  ['scroll','keydown','input','touchmove','wheel'].forEach(function(e){addEventListener(e,function(){last=Date.now();},{passive:true,capture:true});});
  function quiet(f){var w=Date.now()-last,q=ms(0);if(w<q)setTimeout(function(){quiet(f);},q-w);else f();}
  function lite(){return !!(window.Adapt&&window.Adapt.lite());}
  function one(n,j){if(n>1&&j.deco&&lite()){log.push([n,j.name+' (lite: skipped)',now()]);return;}try{j.fn();log.push([n,j.name,now()]);}catch(e){log.push([n,j.name+' FAILED',now()]);}}
  function run(n){done[n]=1;var q=T[n];T[n]=[];if(n>1&&window.Adapt)q=window.Adapt.order(q);
    if(n===1){q.forEach(function(j){one(1,j);});return;}
    drain(n,q);}
  var late={2:[],3:[]};
  function flush(n){var q=late[n];late[n]=[];if(window.Adapt)q=window.Adapt.order(q);
    drain(n,q);}
  // one job per idle slot, PHI^-2 (+ own step) apart, in order: most important / most used first
  function drain(n,q){if(!q.length)return;ric(function(){quiet(function(){one(n,q.shift());if(q.length)setTimeout(function(){drain(n,q);},ms(-2));});},{timeout:ms(2)});}
  function add(n,fn,name,deco){var j={fn:fn,name:name||fn.name||'fn',deco:deco!==false&&n>1};
    if(done[n]){if(n===1){one(1,j);return;}if(!late[n].length)setTimeout(function(){flush(n);},0);late[n].push(j);return;}T[n].push(j);}
  function slow(){var c=navigator.connection||{};return !!(c.saveData||/(^|-)2g$/.test(c.effectiveType||''));}
  function script(url,n,attrs,name,deco){add(n||2,function(){var s=document.createElement('script');s.src=url;s.async=true;if(attrs)Object.keys(attrs).forEach(function(k){s.setAttribute(k,attrs[k]);});document.head.appendChild(s);},name||url.split('/').pop().split('?')[0],deco);}
  function prefetch(url){add(3,function(){if(slow())return;var i=new Image();try{i.fetchPriority='low';}catch(e){}i.decoding='async';i.src=url;LoadTiers._keep.push(i);},'prefetch '+url.split('/').pop().split('?')[0]);}
  function start(){
    requestAnimationFrame(function(){setTimeout(function(){run(1);},0);});
    function afterLoad(){ric(function(){quiet(function(){run(2);});},{timeout:ms(2)});
      setTimeout(function(){ric(function(){quiet(function(){if(!lite())run(3);});},{timeout:ms(4)});},ms(3));}
    if(document.readyState==='complete')afterLoad();else addEventListener('load',afterLoad);
  }
  window.LoadTiers={add:add,script:script,prefetch:prefetch,ms:ms,_keep:[],report:function(){return log.slice();}};
  start();
})();
