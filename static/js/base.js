/* 
    When I get my GitHub account back, use a CDN
*/
window.analytics={initialize:function(e){let t;crypto.randomUUID(),t=setTimeout((function(){clearTimeout(t);let i=new Date;document.addEventListener("visibilitychange",(()=>{"hidden"==document.visibilityState?function(t){let i=new URL(window.location.href);fetch(e,{body:JSON.stringify({totalTimeOnPage:t,currentTime:(new Date).getTime(),width:document.body.clientWidth,height:document.body.clientHeight,timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,userAgent:navigator.userAgent,isMobile:navigator.userAgentData.mobile,isTouchScreen:navigator.maxTouchPoints>0,referrer:document.referrer||null,host:i.hostname,port:i.port||null,path:i.pathname}),method:"POST",keepalive:!0,mode:"no-cors"})}(new Date-i):"visible"==document.visibilityState&&(i=new Date)}))}),2e3)}};

(() => {
    // Don't use analytics on localhost
    if (new URL(window.location.href).hostname != "localhost"){
        window.analytics.initialize("https://analytics.ninjamar.workers.dev/v1/info");
    }
})();