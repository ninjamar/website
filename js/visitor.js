function vistor(){
	fetch('https://api.ninjamar.dev/v1/pageload/visitor');
}
function ping(callback){
	fetch('https://api.ninjamar.dev/v1/pageload/ping').then(callback);
}
